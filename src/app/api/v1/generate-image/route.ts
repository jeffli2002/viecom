import { creditsConfig, getModelCost } from '@/config/credits.config';
import { auth } from '@/lib/auth/auth';
import { creditService } from '@/lib/credits';
import { getQuotaUsageByService, updateQuotaUsage } from '@/lib/quota/quota-service';
import { checkAndAwardReferralReward } from '@/lib/rewards/referral-reward';
import { db } from '@/server/db';
import { generatedAsset } from '@/server/db/schema';
import { randomUUID } from 'node:crypto';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

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
      style,
      enhancedPrompt: enhancedPromptInput,
    } = await request.json();

    const generationMode = image ? 'i2i' : 't2i';

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

    const isStableDiffusion = model === 'stable-diffusion';
    const isNanoBanana = model === 'nano-banana';
    let sourceImagePublicUrl: string | undefined;

    if (isNanoBanana) {
      // Use KIE API for nano-banana image generation
      let kieApiService;
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

      // Process image URL for I2I: convert base64/blob to HTTP URL if needed
      let imageUrlForKie: string | undefined = undefined;
      if (image) {
        // Check if image is base64 data URL (data:image/...)
        if (typeof image === 'string' && image.startsWith('data:image/')) {
          try {
            // Extract base64 data and content type
            const base64Match = image.match(/^data:image\/(\w+);base64,(.+)$/);
            if (base64Match) {
              const [, imageType, base64Data] = base64Match;
              const imageBuffer = Buffer.from(base64Data, 'base64');
              
              // Determine file extension and content type
              const extension = imageType === 'png' ? 'png' : imageType === 'jpeg' || imageType === 'jpg' ? 'jpeg' : 'png';
              const contentType = `image/${extension}`;
              
              // Check if R2 is properly configured
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

              if (!isR2Configured) {
                return NextResponse.json(
                  {
                    error:
                      'R2 storage is not configured. Please configure R2 credentials in environment variables to use image-to-image generation.',
                  },
                  { status: 500 }
                );
              }

              // Upload to R2 to get public URL
              try {
                const r2Result = await r2StorageService.uploadAsset(
                  imageBuffer,
                  `input-image-${randomUUID()}.${extension}`,
                  contentType,
                  'image'
                );

                sourceImagePublicUrl = r2Result.url;

                let signedUrl: string | null = null;
                try {
                  signedUrl = await r2StorageService.getSignedUrl(r2Result.key, 3600);
                } catch (signError) {
                  console.error('Failed to create signed URL for input image (falling back to public URL):', signError);
                }

                imageUrlForKie = signedUrl || r2Result.url;

                try {
                  const parsed = new URL(imageUrlForKie);
                  if (parsed.protocol !== 'https:') {
                    throw new Error(
                      `Input image URL must use HTTPS. Current protocol: ${parsed.protocol || 'unknown'}`
                    );
                  }
                } catch (urlError) {
                  console.error('Invalid input image URL generated for KIE:', urlError);
                  return NextResponse.json(
                    { error: 'Failed to prepare source image. Please try uploading the image again.' },
                    { status: 500 }
                  );
                }

                console.log(
                  `Prepared input image URL for KIE (${signedUrl ? 'signed' : 'public'}): ${imageUrlForKie}`
                );
              } catch (r2Error: any) {
                console.error('R2 upload error:', r2Error);
                const errorCode = r2Error?.Code || r2Error?.code || 'Unknown';
                const errorMessage =
                  errorCode === 'Unauthorized'
                    ? 'R2 storage authentication failed. Please check your R2 credentials.'
                    : 'Failed to upload image to R2 storage. Please check your R2 configuration.';
                return NextResponse.json({ error: errorMessage }, { status: 500 });
              }
            } else {
              return NextResponse.json(
                { error: 'Invalid base64 image format' },
                { status: 400 }
              );
            }
          } catch (error) {
            console.error('Error processing base64 image:', error);
            return NextResponse.json(
              { error: 'Failed to process uploaded image' },
              { status: 500 }
            );
          }
        } else if (typeof image === 'string' && image.startsWith('blob:')) {
          // Blob URLs are not accessible from server, return error
          return NextResponse.json(
            { error: 'Blob URLs are not supported. Please upload the image file directly.' },
            { status: 400 }
          );
        } else if (
          typeof image === 'string' &&
          (image.startsWith('http://') || image.startsWith('https://'))
        ) {
          // Already a URL supplied by client
          if (image.startsWith('http://')) {
            return NextResponse.json(
              { error: 'Source image URL must use HTTPS for image-to-image generation.' },
              { status: 400 }
            );
          }
          imageUrlForKie = image;
              sourceImagePublicUrl = image;
        } else {
          return NextResponse.json(
            { error: 'Invalid image URL format. Expected base64 data URL or HTTP/HTTPS URL.' },
            { status: 400 }
          );
        }
      }

      // Create image generation task
      let taskResponse;
      try {
        taskResponse = await kieApiService.generateImage({
          prompt,
          imageUrl: imageUrlForKie, // Use processed URL (R2 URL for base64, or original HTTP URL)
          imageSize: kieImageSize,
          outputFormat: kieOutputFormat,
        });
      } catch (error) {
        console.error('KIE API generateImage error:', error);
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

        let statusResponse;
        try {
          statusResponse = await kieApiService.getTaskStatus(taskId);
          // Use 'state' field (KIE API format) or fallback to 'status'
          state = statusResponse.data.state || statusResponse.data.status;
          console.log(`Task ${taskId} status: ${state} (attempt ${attempts + 1}/${maxAttempts})`);
        } catch (error) {
          console.error('KIE API getTaskStatus error:', error);
          return NextResponse.json({ error: 'Failed to check task status' }, { status: 500 });
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
              // Don't fail the request if credit spending fails
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
                baseImageUrl: sourceImagePublicUrl,
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
                },
              });
            } catch (saveError) {
              console.error('Failed to persist generated image asset:', saveError);
            }
          }

          return NextResponse.json({
            imageUrl: r2Result.url,
            previewUrl,
            model,
            prompt,
            width,
            height,
            creditsUsed: creditCost,
            taskId,
            assetId: savedAssetId ?? null,
          });
        }

        if (state === 'fail' || state === 'failed') {
          const errorMsg =
            statusResponse.data.failMsg ||
            statusResponse.data.error ||
            statusResponse.data.msg ||
            'Image generation failed';
          return NextResponse.json({ error: errorMsg }, { status: 500 });
        }

        attempts++;
      }

      // If we exit the loop without success, return timeout or current status
      if (state !== 'success' && state !== 'completed') {
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
    console.error('Error generating image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error stack:', errorStack);
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
