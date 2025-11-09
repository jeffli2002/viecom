import { auth } from '@/lib/auth/auth';
import { templateGenerator } from '@/lib/workflow/template-generator';
import { type NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/server/db';
import { batchGenerationJob, generatedAsset } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

interface BatchGenerateRequest {
  rows: Array<{
    rowIndex: number;
    productName?: string;
    productDescription?: string;
    prompt: string;
    enhancedPrompt: string;
    baseImageUrl?: string; // Can be HTTP/HTTPS URL or base64 image
    productSellingPoints?: string;
  }>;
  generationType: 'image' | 'video';
  mode: 't2i' | 'i2i' | 't2v' | 'i2v'; // Default mode, will be auto-determined per row if baseImageUrl exists
  aspectRatio: string;
  style?: string;
}

const MAX_RETRIES = 3;

/**
 * Generate a single asset with retry logic
 */
async function generateAssetWithRetry(
  userId: string,
  params: {
    prompt: string;
    enhancedPrompt: string;
    mode: 't2i' | 'i2i' | 't2v' | 'i2v'; // Default mode, will be auto-determined if baseImage exists
    type: 'image' | 'video';
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
  
  const kieApiService = getKieApiService();

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Auto-determine mode based on baseImage presence
      const actualMode: 't2i' | 'i2i' | 't2v' | 'i2v' =
        params.baseImage && params.baseImage.trim()
          ? params.type === 'image'
            ? 'i2i'
            : 'i2v'
          : params.type === 'image'
            ? 't2i'
            : 't2v';

      console.log(
        `[Job ${jobId}] Row ${rowIndex}, Attempt ${attempt}/${MAX_RETRIES}: Generating ${params.type} (mode: ${actualMode})`
      );

      // Determine model based on mode
      const model =
        params.type === 'image'
          ? actualMode === 'i2i'
            ? 'google/nano-banana-edit'
            : 'google/nano-banana'
          : actualMode === 'i2v'
            ? 'sora-2-image-to-video'
            : 'sora-2-text-to-video';

      // Check credits before generation
      const creditAccount = await creditService.getCreditAccount(userId);
      if (!creditAccount) {
        throw new Error('Credit account not found');
      }

      const creditCost =
        params.type === 'image'
          ? creditsConfig.consumption.imageGeneration[model as keyof typeof creditsConfig.consumption.imageGeneration] || 10
          : creditsConfig.consumption.videoGeneration[model as keyof typeof creditsConfig.consumption.videoGeneration] || 50;

      if (creditAccount.balance < creditCost) {
        throw new Error(`Insufficient credits. Required: ${creditCost}, Available: ${creditAccount.balance}`);
      }

      // Process baseImage if provided (convert base64 to R2 URL if needed)
      let processedImageUrl: string | undefined = undefined;
      if (params.baseImage && params.baseImage.trim()) {
        const baseImage = params.baseImage.trim();

        // Check if it's base64 image
        if (baseImage.startsWith('data:image/')) {
          try {
            const base64Match = baseImage.match(/^data:image\/(\w+);base64,(.+)$/);
            if (base64Match) {
              const [, imageType, base64Data] = base64Match;
              const imageBuffer = Buffer.from(base64Data, 'base64');
              const extension = imageType === 'png' ? 'png' : imageType === 'jpeg' || imageType === 'jpg' ? 'jpeg' : 'png';
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

      // Generate asset
      let taskResponse;
      let assetUrl: string;
      let assetId = randomUUID();

      if (params.type === 'image') {
        // Image generation
        const aspectRatioMap: Record<string, '1:1' | '9:16' | '16:9' | '3:4' | '4:3'> = {
          '1:1': '1:1',
          '9:16': '9:16',
          '16:9': '16:9',
          '4:3': '4:3',
          '3:4': '3:4',
        };
        const imageSize = aspectRatioMap[params.aspectRatio || '1:1'] || '1:1';

        taskResponse = await kieApiService.generateImage({
          prompt: params.enhancedPrompt,
          imageUrl: processedImageUrl, // Use processed URL (R2 URL for base64, or original HTTP URL)
          imageSize,
          outputFormat: 'jpeg',
        });

        // Poll for image result
        const imageResult = await kieApiService.pollTaskStatus(
          taskResponse.data.taskId,
          'image'
        );
        if (!imageResult.imageUrl) {
          throw new Error('Image generation failed: No image URL in response');
        }

        assetUrl = imageResult.imageUrl;

        // Download and upload to R2
        const imageResponse = await fetch(assetUrl);
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        const r2Result = await r2StorageService.uploadAsset(
          imageBuffer,
          `batch-${jobId}-${rowIndex}-${assetId}.jpg`,
          'image/jpeg',
          'image'
        );
        assetUrl = r2Result.url;
      } else {
        // Video generation
        const aspectRatioMap: Record<string, 'square' | 'portrait' | 'landscape'> = {
          '1:1': 'square',
          '9:16': 'portrait',
          '16:9': 'landscape',
          '4:3': 'landscape',
          '3:4': 'portrait',
        };
        const kieAspectRatio = aspectRatioMap[params.aspectRatio || '16:9'] || 'landscape';

        taskResponse = await kieApiService.generateVideo({
          prompt: params.enhancedPrompt,
          imageUrls: params.baseImage ? [params.baseImage] : undefined,
          aspectRatio: kieAspectRatio,
        });

        // Poll for video result
        const videoResult = await kieApiService.pollTaskStatus(
          taskResponse.data.taskId,
          'video'
        );
        if (!videoResult.videoUrl) {
          throw new Error('Video generation failed: No video URL in response');
        }

        assetUrl = videoResult.videoUrl;

        // Download and upload to R2
        const videoResponse = await fetch(assetUrl);
        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
        const r2Result = await r2StorageService.uploadAsset(
          videoBuffer,
          `batch-${jobId}-${rowIndex}-${assetId}.mp4`,
          'video/mp4',
          'video'
        );
        assetUrl = r2Result.url;
      }

      // Deduct credits
      await creditService.spendCredits({
        userId,
        amount: creditCost,
        source: 'generation',
        description: `Batch ${params.type} generation - Row ${rowIndex}`,
        referenceId: `batch-${jobId}-${rowIndex}`,
      });

        // Save asset to database
        await db.insert(generatedAsset).values({
          id: assetId,
          userId,
          batchJobId: jobId,
          assetType: params.type,
          generationMode: actualMode, // Use auto-determined mode
          prompt: params.prompt,
          enhancedPrompt: params.enhancedPrompt,
          baseImageUrl: processedImageUrl || params.baseImage, // Save processed image URL
          r2Key: assetUrl.split('/').pop() || '',
          publicUrl: assetUrl,
          status: 'completed',
          creditsSpent: creditCost,
          model: model,
          metadata: {
            rowIndex,
            productName: params.productName,
            productDescription: params.productDescription,
          } as any,
        });

      console.log(`[Job ${jobId}] Row ${rowIndex}: Successfully generated ${params.type}`);

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
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
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
    const body: BatchGenerateRequest = await request.json();
    const { rows, generationType, mode, aspectRatio, style } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Rows are required' }, { status: 400 });
    }

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

async function processBatchGeneration(
  jobId: string,
  userId: string,
  rows: BatchGenerateRequest['rows'],
  options: {
    generationType: 'image' | 'video';
    mode: 't2i' | 'i2i' | 't2v' | 'i2v';
    aspectRatio: string;
    style?: string;
  }
) {
  let processedRows = 0;
  let successfulRows = 0;
  let failedRows = 0;
  const errors: Array<{ rowIndex: number; error: string }> = [];

  try {
    // Process rows sequentially to avoid overwhelming the API
    for (const row of rows) {
      try {
        // Mode will be auto-determined in generateAssetWithRetry based on baseImageUrl
        const result = await generateAssetWithRetry(
          userId,
          {
            prompt: row.prompt,
            enhancedPrompt: row.enhancedPrompt,
            mode: options.mode, // Default mode, will be overridden if baseImageUrl exists
            type: options.generationType,
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
              } as any,
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

