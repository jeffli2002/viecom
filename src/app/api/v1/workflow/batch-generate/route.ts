import { randomUUID } from 'node:crypto';
import { applyGenerationStyle } from '@/config/styles.config';
import { auth } from '@/lib/auth/auth';
import {
  type BatchGenerateRequest,
  batchGenerateRequestSchema,
} from '@/lib/workflow/batch-generation-schema';
import { templateGenerator } from '@/lib/workflow/template-generator';
import { db } from '@/server/db';
import { batchGenerationJob, generatedAsset } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MAX_RETRIES = 3;

/**
 * Generate a single asset with retry logic
 */
async function generateImageAssetWithRetry(
  userId: string,
  params: {
    prompt: string;
    enhancedPrompt: string;
    baseImage?: string; // Can be HTTP/HTTPS URL or base64 image
    aspectRatio?: string;
    productName?: string;
    productDescription?: string;
  },
  jobId: string,
  rowIndex: number
): Promise<{ success: boolean; assetId?: string; assetUrl?: string; error?: string }> {
  const { getKieApiService } = await import('@/lib/kie/kie-api');
  const { r2StorageService } = await import('@/lib/storage/r2');
  const { creditsConfig } = await import('@/config/credits.config');
  const { creditService } = await import('@/lib/credits/credit-service');

  type KieApiService = ReturnType<typeof getKieApiService>;
  const kieApiService: KieApiService = getKieApiService();
  type ImageTaskResponse = Awaited<ReturnType<KieApiService['generateImage']>>;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Auto-determine mode based on baseImage presence
      const actualMode: 't2i' | 'i2i' = params.baseImage?.trim() ? 'i2i' : 't2i';

      console.log(
        `[Job ${jobId}] Row ${rowIndex}, Attempt ${attempt}/${MAX_RETRIES}: Generating image (mode: ${actualMode})`
      );

      const model = actualMode === 'i2i' ? 'google/nano-banana-edit' : 'google/nano-banana';

      // Check credits before generation
      const creditAccount = await creditService.getCreditAccount(userId);
      if (!creditAccount) {
        throw new Error('Credit account not found');
      }

      const creditCost =
        creditsConfig.consumption.imageGeneration[
          model as keyof typeof creditsConfig.consumption.imageGeneration
        ] || 10;

      if (creditAccount.balance < creditCost) {
        throw new Error(
          `Insufficient credits. Required: ${creditCost}, Available: ${creditAccount.balance}`
        );
      }

      // Process baseImage if provided (convert base64 to R2 URL if needed)
      let processedImageUrl: string | undefined = undefined;
      if (params.baseImage?.trim()) {
        const baseImage = params.baseImage.trim();

        // Check if it's base64 image
        if (baseImage.startsWith('data:image/')) {
          try {
            const base64Match = baseImage.match(/^data:image\/(\w+);base64,(.+)$/);
            if (base64Match) {
              const [, imageType, base64Data] = base64Match;
              const imageBuffer = Buffer.from(base64Data, 'base64');
              const extension =
                imageType === 'png'
                  ? 'png'
                  : imageType === 'jpeg' || imageType === 'jpg'
                    ? 'jpeg'
                    : 'png';
              const contentType = `image/${extension}`;

              // Upload to R2
              const r2Result = await r2StorageService.uploadAsset(
                imageBuffer,
                `batch-input-${jobId}-${rowIndex}-${randomUUID()}.${extension}`,
                contentType,
                'image'
              );

              processedImageUrl = r2Result.url;
              console.log(`[Job ${jobId}] Row ${rowIndex}: Converted base64 image to R2 URL`);
            }
          } catch (error) {
            console.error(`[Job ${jobId}] Row ${rowIndex}: Failed to process base64 image:`, error);
            throw new Error('Failed to process base64 image');
          }
        } else if (baseImage.startsWith('http://') || baseImage.startsWith('https://')) {
          // Already a valid URL, use directly
          processedImageUrl = baseImage;
        } else {
          throw new Error('Invalid baseImageUrl format. Expected HTTP/HTTPS URL or base64 image');
        }
      }

      // Generate image asset
      const assetId = randomUUID();
      const aspectRatioMap: Record<string, '1:1' | '9:16' | '16:9' | '3:4' | '4:3'> = {
        '1:1': '1:1',
        '9:16': '9:16',
        '16:9': '16:9',
        '4:3': '4:3',
        '3:4': '3:4',
      };
      const imageSize = aspectRatioMap[params.aspectRatio || '1:1'] || '1:1';

      const taskResponse: ImageTaskResponse = await kieApiService.generateImage({
        prompt: params.enhancedPrompt,
        imageUrl: processedImageUrl,
        imageSize,
        outputFormat: 'jpeg',
      });

      const imageResult = await kieApiService.pollTaskStatus(taskResponse.data.taskId, 'image');
      if (!imageResult.imageUrl) {
        throw new Error('Image generation failed: No image URL in response');
      }

      const imageResponse = await fetch(imageResult.imageUrl);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const r2Result = await r2StorageService.uploadAsset(
        imageBuffer,
        `batch-${jobId}-${rowIndex}-${assetId}.jpg`,
        'image/jpeg',
        'image'
      );
      const assetUrl = r2Result.url;

      // Deduct credits
      await creditService.spendCredits({
        userId,
        amount: creditCost,
        source: 'generation',
        description: `Batch image generation - Row ${rowIndex}`,
        referenceId: `batch-${jobId}-${rowIndex}`,
      });

      // Save asset to database
      const metadata: Record<string, unknown> = {
        rowIndex,
        productName: params.productName,
        productDescription: params.productDescription,
      };

      await db.insert(generatedAsset).values({
        id: assetId,
        userId,
        batchJobId: jobId,
        assetType: 'image',
        generationMode: actualMode, // Use auto-determined mode
        prompt: params.prompt,
        enhancedPrompt: params.enhancedPrompt,
        baseImageUrl: processedImageUrl || params.baseImage, // Save processed image URL
        r2Key: assetUrl.split('/').pop() || '',
        publicUrl: assetUrl,
        status: 'completed',
        creditsSpent: creditCost,
        model: model,
        metadata,
      });

      console.log(`[Job ${jobId}] Row ${rowIndex}: Successfully generated image`);

      return {
        success: true,
        assetId,
        assetUrl,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `[Job ${jobId}] Row ${rowIndex}, Attempt ${attempt}/${MAX_RETRIES} failed:`,
        lastError.message
      );

      // If this is the last attempt, return error
      if (attempt === MAX_RETRIES) {
        return {
          success: false,
          error: lastError.message,
        };
      }

      // Wait before retry (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000));
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Unknown error',
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const parsedBody = batchGenerateRequestSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: 'Invalid batch generation parameters',
          details: parsedBody.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const body = parsedBody.data;
    const { rows, generationType, mode, aspectRatio, style } = body;

    // Create batch job record
    const jobId = randomUUID();
    const totalRows = rows.length;

    await db.insert(batchGenerationJob).values({
      id: jobId,
      userId,
      jobName: `Batch ${generationType} generation`,
      status: 'processing',
      totalRows,
      processedRows: 0,
      successfulRows: 0,
      failedRows: 0,
    });

    // Process rows in background
    processBatchGeneration(jobId, userId, rows, {
      generationType,
      mode,
      aspectRatio,
      style,
      defaultModel: body.defaultModel,
      defaultResolution: body.defaultResolution,
      defaultDuration: body.defaultDuration,
      generateAudio: body.generateAudio,
      videoInputEnabled: body.videoInputEnabled,
    }).catch((error) => {
      console.error('Background batch generation error:', error);
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        status: 'processing',
        totalRows,
      },
    });
  } catch (error) {
    console.error('Batch generation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Batch generation failed',
      },
      { status: 500 }
    );
  }
}

/**
 * 处理批量视频生成（使用优先队列）
 */
async function processBatchVideoGeneration(
  jobId: string,
  userId: string,
  rows: BatchGenerateRequest['rows'],
  options: {
    mode: 't2i' | 'i2i' | 't2v' | 'i2v';
    aspectRatio: string;
    style?: string;
    defaultModel?: 'seedance-2-fast';
    defaultResolution?: '480p' | '720p';
    defaultDuration?: 10 | 15;
    generateAudio: boolean;
    videoInputEnabled: boolean;
  }
) {
  try {
    // 动态导入优先队列处理器
    const { PriorityQueueProcessor } = await import('@/lib/batch/priority-queue-processor');
    const { payment } = await import('@/server/db/schema');

    // 获取用户套餐
    let userPlan = 'free';
    try {
      const userPayment = await db
        .select()
        .from(payment)
        .where(eq(payment.userId, userId))
        .orderBy(payment.createdAt)
        .limit(1);

      if (userPayment.length > 0 && userPayment[0].plan) {
        userPlan = userPayment[0].plan;
      }
    } catch (error) {
      console.warn('Failed to get user plan, using free:', error);
    }

    // 转换任务格式
    const tasks = rows.map((row) => ({
      rowIndex: row.rowIndex,
      model: row.model || options.defaultModel || 'seedance-2-fast',
      resolution: row.resolution || options.defaultResolution || '720p',
      duration: row.duration || options.defaultDuration || 15,
      prompt: row.prompt,
      enhancedPrompt: applyGenerationStyle(row.enhancedPrompt, options.style, 'video'),
      imageUrl: row.baseImageUrl,
      referenceVideoUrl: options.videoInputEnabled ? row.referenceVideoUrl : undefined,
      referenceVideoDuration: options.videoInputEnabled ? row.referenceVideoDuration : undefined,
      aspectRatio: options.aspectRatio,
      generateAudio: options.generateAudio,
      productName: row.productName,
      productDescription: row.productDescription,
    }));

    console.log(
      `[Job ${jobId}] Starting priority queue processing: ` +
        `${tasks.length} tasks, plan=${userPlan}`
    );

    // 创建处理器并执行
    const processor = new PriorityQueueProcessor(userId, jobId, userPlan);
    const stats = await processor.processBatch(tasks);

    console.log(
      `[Job ${jobId}] Batch processing completed: ` +
        `${stats.successful}/${stats.total} succeeded, ${stats.failed} failed`
    );
  } catch (error) {
    console.error(`[Job ${jobId}] Batch video generation error:`, error);
    throw error;
  }
}

async function processBatchGeneration(
  jobId: string,
  userId: string,
  rows: BatchGenerateRequest['rows'],
  options: {
    generationType: 'image' | 'video';
    mode: 't2i' | 'i2i' | 't2v' | 'i2v';
    aspectRatio: string;
    style?: string;
    defaultModel?: 'seedance-2-fast';
    defaultResolution?: '480p' | '720p';
    defaultDuration?: 10 | 15;
    generateAudio: boolean;
    videoInputEnabled: boolean;
  }
) {
  // 对于视频，使用优先队列处理器
  if (options.generationType === 'video') {
    return await processBatchVideoGeneration(jobId, userId, rows, options);
  }

  // 对于图片，保持原有顺序处理逻辑
  let processedRows = 0;
  let successfulRows = 0;
  let failedRows = 0;
  const errors: Array<{ rowIndex: number; error: string }> = [];

  try {
    // Process rows sequentially to avoid overwhelming the API
    for (const row of rows) {
      try {
        const result = await generateImageAssetWithRetry(
          userId,
          {
            prompt: row.prompt,
            enhancedPrompt: applyGenerationStyle(row.enhancedPrompt, options.style, 'image'),
            baseImage: row.baseImageUrl,
            aspectRatio: options.aspectRatio,
            productName: row.productName,
            productDescription: row.productDescription,
          },
          jobId,
          row.rowIndex
        );

        processedRows++;
        if (result.success) {
          successfulRows++;
        } else {
          failedRows++;
          const errorMsg = result.error || 'Unknown error';
          errors.push({
            rowIndex: row.rowIndex,
            error: errorMsg,
          });

          // Save failed asset record for tracking
          try {
            const failedAssetId = randomUUID();
            await db.insert(generatedAsset).values({
              id: failedAssetId,
              userId,
              batchJobId: jobId,
              assetType: options.generationType,
              generationMode: options.mode,
              prompt: row.prompt,
              enhancedPrompt: row.enhancedPrompt,
              r2Key: '',
              publicUrl: '',
              status: 'failed',
              creditsSpent: 0,
              errorMessage: errorMsg,
              metadata: {
                rowIndex: row.rowIndex,
              } satisfies Record<string, unknown>,
            });
          } catch (dbError) {
            console.error('Failed to save failed asset record:', dbError);
          }
        }

        // Update job progress after each row
        await db
          .update(batchGenerationJob)
          .set({
            processedRows,
            successfulRows,
            failedRows,
            errorReport: errors.length > 0 ? JSON.stringify(errors) : null,
            updatedAt: new Date(),
          })
          .where(eq(batchGenerationJob.id, jobId));
      } catch (error) {
        processedRows++;
        failedRows++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          rowIndex: row.rowIndex,
          error: errorMsg,
        });

        await db
          .update(batchGenerationJob)
          .set({
            processedRows,
            failedRows,
            errorReport: JSON.stringify(errors),
            updatedAt: new Date(),
          })
          .where(eq(batchGenerationJob.id, jobId));
      }
    }

    // Mark job as completed
    await db
      .update(batchGenerationJob)
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(batchGenerationJob.id, jobId));
  } catch (error) {
    console.error('Batch generation processing error:', error);
    await db
      .update(batchGenerationJob)
      .set({
        status: 'failed',
        errorReport: JSON.stringify({ error: String(error) }),
      })
      .where(eq(batchGenerationJob.id, jobId));
  }
}
