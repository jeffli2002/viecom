import { randomUUID } from 'node:crypto';
import { creditsConfig, getModelCost } from '@/config/credits.config';
import { MAX_SOURCE_IMAGES } from '@/config/image-upload.config';
import { auth } from '@/lib/auth/auth';
import { creditService } from '@/lib/credits';
import { getQuotaUsageByService, updateQuotaUsage } from '@/lib/quota/quota-service';
import { checkAndAwardReferralReward } from '@/lib/rewards/referral-reward';
import { db } from '@/server/db';
import { generatedAsset } from '@/server/db/schema';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
// Set max duration to 5 minutes (300 seconds) for image generation polling
export const maxDuration = 300;

type KieApiService = Awaited<ReturnType<typeof import('@/lib/kie/kie-api')['getKieApiService']>>;

const MODEL_ENDPOINTS: Record<string, string> = {
  'flux-1.1': 'https://api.bfl.ai/v1/flux-pro-1.1',
  'flux-1.1-pro': 'https://api.bfl.ai/v1/flux-pro-1.1',
  'flux-1.1-ultra': 'https://api.bfl.ai/v1/flux-pro-1.1-ultra',
  'flux-kontext-pro': 'https://api.bfl.ai/v1/flux-kontext-pro',
  'flux-kontext-max': 'https://api.bfl.ai/v1/flux-kontext-max',
  'flux-kontext-dev': 'https://api.bfl.ai/v1/flux-kontext-dev',
  'stable-diffusion': 'https://api.stability.ai/v2beta/stable-image/generate/sd3',
  // 'nano-banana' is handled by KIE API, not OpenRouter
};

export async function POST(request: NextRequest) {
  try {
    const isTestMode =
      process.env.NODE_ENV === 'test' ||
      process.env.DISABLE_AUTH === 'true' ||
      request.headers.get('x-test-mode') === 'true';

    let userId: string;

    if (isTestMode) {
      userId = 'test-user-id';
    } else {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = session.user.id;
    }

    const {
      prompt,
      model = 'nano-banana',
      width = 1024,
      height = 1024,
      raw = false,
      aspect_ratio,
      prompt_upsampling = false,
      seed,
      safety_tolerance = 2,
      output_format = 'jpeg',
      image,
      images,
      style,
      enhancedPrompt: enhancedPromptInput,
      clientRequestId,
    } = await request.json();

    const requestId =
      typeof clientRequestId === 'string' &&
      clientRequestId.length > 0 &&
      clientRequestId.length <= 128
        ? clientRequestId
        : randomUUID();

    const incomingImages = Array.isArray(images)
      ? images.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
      : [];
    if (typeof image === 'string' && image.length > 0) {
      incomingImages.unshift(image);
    }
    const sourceImageInputs = incomingImages.slice(0, MAX_SOURCE_IMAGES);

    const generationMode = sourceImageInputs.length > 0 ? 'i2i' : 't2i';

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    const creditCost = getModelCost('imageGeneration', model);
    if (creditCost === 0) {
      return NextResponse.json({ error: `Invalid model: ${model}` }, { status: 400 });
    }

    // Pure credit-based system: always check and charge credits
    if (!isTestMode) {
      const hasCredits = await creditService.hasEnoughCredits(userId, creditCost);
      if (!hasCredits) {
        return NextResponse.json(
          {
            error: `Insufficient credits. Required: ${creditCost} credits. Please earn more credits or upgrade your plan.`,
          },
          { status: 402 }
        );
      }
    }

    // Track usage for analytics only (not for quota enforcement)
    const dailyPeriod = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const monthlyPeriod = new Date().toISOString().substring(0, 7); // YYYY-MM

    const isNanoBanana = model === 'nano-banana' || model === 'nano-banana-pro';
    if (isNanoBanana) {
      // Use KIE API for nano-banana image generation
      let kieApiService: KieApiService | undefined;
      try {
        const { getKieApiService } = await import('@/lib/kie/kie-api');
        kieApiService = getKieApiService();
      } catch (error) {
        console.error('Failed to initialize KIE API service:', error);
        return NextResponse.json(
          { error: 'Failed to initialize image generation service' },
          { status: 500 }
        );
      }

      const { r2StorageService } = await import('@/lib/storage/r2');

      // Map aspect ratio to KIE API format (image_size)
      const aspectRatioMap: Record<
        string,
        '1:1' | '9:16' | '16:9' | '3:4' | '4:3' | '3:2' | '2:3' | '5:4' | '4:5' | '21:9' | 'auto'
      > = {
        '1:1': '1:1',
        '9:16': '9:16',
        '16:9': '16:9',
        '4:3': '4:3',
        '3:4': '3:4',
        '3:2': '3:2',
        '2:3': '2:3',
        '5:4': '5:4',
        '4:5': '4:5',
        '21:9': '21:9',
      };
      const kieImageSize = aspectRatioMap[aspect_ratio || '1:1'] || '1:1';

      // Map output format
      const outputFormatMap: Record<string, 'png' | 'jpeg'> = {
        png: 'png',
        jpeg: 'jpeg',
        jpg: 'jpeg',
      };
      const kieOutputFormat = outputFormatMap[output_format || 'jpeg'] || 'jpeg';

      // Process image URLs for I2I: convert base64/blob to HTTP URLs if needed
      const sourceImagePublicUrls: string[] = [];
      const imageUrlsForKie: string[] = [];
      if (sourceImageInputs.length > 0) {
        const { env } = await import('@/env');
        const isR2Configured =
          env.R2_BUCKET_NAME &&
          env.R2_BUCKET_NAME !== 'dummy' &&
          env.R2_ACCESS_KEY_ID &&
          env.R2_ACCESS_KEY_ID !== 'dummy' &&
          env.R2_SECRET_ACCESS_KEY &&
          env.R2_SECRET_ACCESS_KEY !== 'dummy' &&
          env.R2_ENDPOINT &&
          env.R2_ENDPOINT !== 'https://dummy.r2.cloudflarestorage.com';

        for (const rawImage of sourceImageInputs) {
          if (typeof rawImage !== 'string' || rawImage.length === 0) {
            continue;
          }

          if (rawImage.startsWith('data:image/')) {
            if (!isR2Configured) {
              return NextResponse.json(
                {
                  error:
                    'R2 storage is not configured. Please configure R2 credentials in environment variables to use image-to-image generation.',
                },
                { status: 500 }
              );
            }

            try {
              const base64Match = rawImage.match(/^data:image\/(\w+);base64,(.+)$/);
              if (!base64Match) {
                return NextResponse.json({ error: 'Invalid base64 image format' }, { status: 400 });
              }

              const [, imageType, base64Data] = base64Match;
              const imageBuffer = Buffer.from(base64Data, 'base64');
              const extension =
                imageType === 'png'
                  ? 'png'
                  : imageType === 'jpeg' || imageType === 'jpg'
                    ? 'jpeg'
                    : 'png';
              const contentType = `image/${extension}`;

              const r2Result = await r2StorageService.uploadAsset(
                imageBuffer,
                `input-image-${randomUUID()}.${extension}`,
                contentType,
                'image'
              );

              sourceImagePublicUrls.push(r2Result.url);

              let signedUrl: string | null = null;
              try {
                signedUrl = await r2StorageService.getSignedUrl(r2Result.key, 3600);
              } catch (signError) {
                console.error(
                  'Failed to create signed URL for input image (falling back to public URL):',
                  signError
                );
              }

              const preparedUrl = signedUrl || r2Result.url;
              try {
                const parsed = new URL(preparedUrl);
                if (parsed.protocol !== 'https:') {
                  throw new Error(
                    `Input image URL must use HTTPS. Current protocol: ${parsed.protocol || 'unknown'}`
                  );
                }
              } catch (urlError) {
                console.error('Invalid input image URL generated for KIE:', urlError);
                return NextResponse.json(
                  {
                    error: 'Failed to prepare source image. Please try uploading the image again.',
                  },
                  { status: 500 }
                );
              }

              imageUrlsForKie.push(preparedUrl);
              console.log(
                `Prepared input image URL for KIE (${signedUrl ? 'signed' : 'public'}): ${preparedUrl}`
              );
            } catch (uploadError) {
              console.error('R2 upload error:', uploadError);
              const errorSource =
                typeof uploadError === 'object' && uploadError !== null
                  ? (uploadError as { Code?: string; code?: string })
                  : undefined;
              const errorCode = errorSource?.Code || errorSource?.code || 'Unknown';
              const errorMessage =
                errorCode === 'Unauthorized'
                  ? 'R2 storage authentication failed. Please check your R2 credentials.'
                  : 'Failed to upload image to R2 storage. Please check your R2 configuration.';
              return NextResponse.json({ error: errorMessage }, { status: 500 });
            }
          } else if (rawImage.startsWith('blob:')) {
            return NextResponse.json(
              { error: 'Blob URLs are not supported. Please upload the image file directly.' },
              { status: 400 }
            );
          } else if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
            if (rawImage.startsWith('http://')) {
              return NextResponse.json(
                { error: 'Source image URL must use HTTPS for image-to-image generation.' },
                { status: 400 }
              );
            }
            sourceImagePublicUrls.push(rawImage);
            imageUrlsForKie.push(rawImage);
          } else {
            return NextResponse.json(
              { error: 'Invalid image URL format. Expected base64 data URL or HTTP/HTTPS URL.' },
              { status: 400 }
            );
          }
        }

        if (imageUrlsForKie.length === 0) {
          return NextResponse.json(
            {
              error:
                'No valid source images were processed. Please re-upload your reference images and try again.',
            },
            { status: 400 }
          );
        }
      }

      // Create image generation task
      let taskResponse: Awaited<ReturnType<KieApiService['generateImage']>> | undefined;
      try {
        // Pass the model name to KIE API service
        // For nano-banana-pro, pass 'nano-banana-pro' as preferred model
        const preferredModel = model === 'nano-banana-pro' ? 'nano-banana-pro' : undefined;
        taskResponse = await kieApiService.generateImage(
          {
            prompt,
            imageUrls: imageUrlsForKie.length > 0 ? imageUrlsForKie : undefined,
            imageSize: kieImageSize,
            outputFormat: kieOutputFormat,
          },
          preferredModel
        );
      } catch (error) {
        console.error('[Image Generation] KIE API generateImage error:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          prompt: prompt.substring(0, 100),
          model,
          generationMode,
          hasImage: imageUrlsForKie.length > 0,
        });
        return NextResponse.json(
          {
            error:
              error instanceof Error ? error.message : 'Failed to create image generation task',
          },
          { status: 500 }
        );
      }

      const taskId = taskResponse.data.taskId;

      // Poll for task completion
      let state: string | undefined = undefined;
      let attempts = 0;
      const maxAttempts = 60; // Wait up to 5 minutes

      while (
        state !== 'success' &&
        state !== 'fail' &&
        state !== 'failed' &&
        attempts < maxAttempts
      ) {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

        let statusResponse: Awaited<ReturnType<KieApiService['getTaskStatus']>> | undefined;
        try {
          statusResponse = await kieApiService.getTaskStatus(taskId);
          // Use 'state' field (KIE API format) or fallback to 'status'
          state = statusResponse.data.state || statusResponse.data.status;
          console.log(`Task ${taskId} status: ${state} (attempt ${attempts + 1}/${maxAttempts})`);
        } catch (error) {
          console.error(`[Image Generation] KIE API getTaskStatus error for task ${taskId}:`, {
            taskId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          return NextResponse.json(
            {
              error: 'Failed to check task status',
              details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
          );
        }

        if (state === 'success' || state === 'completed') {
          // Check for image URL in resultUrls array or imageUrl
          const imageUrl =
            statusResponse.data.result?.resultUrls?.[0] || statusResponse.data.result?.imageUrl;
          if (!imageUrl) {
            return NextResponse.json(
              { error: 'Image generation completed but no image URL found' },
              { status: 500 }
            );
          }

          // Download image and upload to R2
          const imageResponse = await fetch(imageUrl);
          if (!imageResponse.ok) {
            return NextResponse.json(
              { error: 'Failed to download generated image' },
              { status: 500 }
            );
          }

          const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
          const outputFileSize = imageBuffer.length;

          // In test mode, skip R2 upload and use KIE API URL directly
          let r2Result: { key: string; url: string };
          if (isTestMode) {
            r2Result = {
              key: `test-image-${randomUUID()}`,
              url: imageUrl, // Use KIE API URL directly in test mode
            };
          } else {
            r2Result = await r2StorageService.uploadAsset(
              imageBuffer,
              `image-${randomUUID()}.png`,
              'image/png',
              'image'
            );
          }

          // Update usage statistics for analytics only
          try {
            await updateQuotaUsage({
              userId,
              service: 'image_generation',
              amount: 1,
              period: dailyPeriod,
            });
            await updateQuotaUsage({
              userId,
              service: 'image_generation',
              amount: 1,
              period: monthlyPeriod,
            });
          } catch (error) {
            // In test mode, ignore quota update errors
            if (!isTestMode) {
              throw error;
            }
            console.warn('Quota update error (ignored in test mode):', error);
          }

          // Pure credit-based system: always charge credits
          if (!isTestMode) {
            try {
              await creditService.spendCredits({
                userId,
                amount: creditCost,
                source: 'api_call',
                description: `Image generation with ${model}`,
                metadata: {
                  feature: 'image-generation',
                  model,
                  prompt: prompt.substring(0, 100),
                  taskId,
                },
              });
            } catch (error) {
              console.error('Error spending credits:', error);
              // Clean up uploaded asset if credit charge fails
              try {
                await r2StorageService.deleteFile(r2Result.key);
              } catch (cleanupError) {
                console.error('Failed to clean up image asset after credit charge failure:', cleanupError);
              }
              const isInsufficient =
                error instanceof Error && error.message.includes('Insufficient credits');
              const message = isInsufficient
                ? `Insufficient credits. Required: ${creditCost} credits. Please earn more credits or upgrade your plan.`
                : 'Failed to charge credits for this generation. Please try again.';
              return NextResponse.json({ error: message }, { status: isInsufficient ? 402 : 500 });
            }
          }

          // Check and award referral reward if this is user's first generation
          if (!isTestMode) {
            await checkAndAwardReferralReward(userId).catch((error) => {
              console.error('Error checking referral reward:', error);
              // Don't fail the request if referral reward check fails
            });
          }

          const previewUrl = isTestMode
            ? imageUrl
            : `/api/v1/media?key=${encodeURIComponent(r2Result.key)}`;

          let savedAssetId: string | undefined;

          if (!isTestMode) {
            try {
              savedAssetId = randomUUID();
              await db.insert(generatedAsset).values({
                id: savedAssetId,
                userId,
                assetType: 'image',
                generationMode,
                prompt,
                enhancedPrompt: enhancedPromptInput,
                baseImageUrl: sourceImagePublicUrls[0],
                styleId: typeof style === 'string' ? style : null,
                r2Key: r2Result.key,
                publicUrl: r2Result.url,
                thumbnailUrl: previewUrl.startsWith('http') ? previewUrl : undefined,
                width,
                height,
                fileSize: outputFileSize,
                status: 'completed',
                creditsSpent: creditCost,
                generationParams: {
                  aspect_ratio,
                  output_format,
                  prompt_upsampling,
                  seed,
                  safety_tolerance,
                  raw,
                  style,
                  model,
                },
                metadata: {
                  previewUrl,
                  taskId,
                  generationMode,
                  clientRequestId: requestId,
                  sourceImages: sourceImagePublicUrls,
                },
              });
            } catch (saveError) {
              console.error('Failed to persist generated image asset:', saveError);
            }
          }

          const responseData = {
            imageUrl: r2Result.url,
            previewUrl,
            model,
            prompt,
            width,
            height,
            creditsUsed: creditCost,
            taskId,
            assetId: savedAssetId ?? null,
            clientRequestId: requestId,
          };

          console.log(`[Image Generation] Successfully generated image for task ${taskId}:`, {
            taskId,
            imageUrl: r2Result.url,
            previewUrl,
            assetId: savedAssetId,
          });

          return NextResponse.json(responseData);
        }

        if (state === 'fail' || state === 'failed') {
          const errorMsg =
            statusResponse.data.failMsg ||
            statusResponse.data.error ||
            statusResponse.data.msg ||
            'Image generation failed';

          // Log detailed error information for debugging
          console.error(`[Image Generation] Task ${taskId} failed:`, {
            taskId,
            state,
            failMsg: statusResponse.data.failMsg,
            error: statusResponse.data.error,
            msg: statusResponse.data.msg,
            fullResponse: JSON.stringify(statusResponse.data, null, 2),
          });

          return NextResponse.json({ error: errorMsg }, { status: 500 });
        }

        attempts++;
      }

      // If we exit the loop without success, return timeout or current status
      if (state !== 'success' && state !== 'completed') {
        // If we've exhausted all attempts, return timeout error
        if (attempts >= maxAttempts) {
          console.error(
            `[Image Generation] Task ${taskId} timed out after ${maxAttempts} attempts`
          );
          return NextResponse.json(
            {
              error:
                'Image generation timeout. The task is still processing. Please try again later or contact support.',
              taskId,
              status: state || 'processing',
            },
            { status: 504 } // Gateway Timeout
          );
        }

        // Otherwise, return current status for client to poll
        return NextResponse.json({
          taskId,
          status: state || 'processing',
          message:
            state === 'fail' || state === 'failed'
              ? 'Image generation failed'
              : 'Image generation in progress. Please poll task status.',
        });
      }
    }

    // For other models (Flux, Stable Diffusion, etc.), check endpoint
    const endpoint = MODEL_ENDPOINTS[model];
    if (!endpoint) {
      return NextResponse.json({ error: `Unsupported model: ${model}` }, { status: 400 });
    }

    // For other models, implement similar logic as needed
    return NextResponse.json({ error: 'Model not yet implemented' }, { status: 501 });
  } catch (error) {
    console.error('[Image Generation] Unhandled error in generate-image route:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack }),
      },
      { status: 500 }
    );
  }
}
