import { creditsConfig, getModelCost } from '@/config/credits.config';
import { auth } from '@/lib/auth/auth';
import { creditService } from '@/lib/credits';
import { getQuotaUsageByService, updateQuotaUsage } from '@/lib/quota/quota-service';
import { checkAndAwardReferralReward } from '@/lib/rewards/referral-reward';
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
    } = await request.json();

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

    // Get daily and monthly quota usage
    const dailyPeriod = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const monthlyPeriod = new Date().toISOString().substring(0, 7); // YYYY-MM

    let dailyUsage = 0;
    let monthlyUsage = 0;

    try {
      const dailyQuota = await getQuotaUsageByService(userId, 'image_generation', dailyPeriod);
      const monthlyQuota = await getQuotaUsageByService(userId, 'image_generation', monthlyPeriod);
      dailyUsage = dailyQuota?.usedAmount || 0;
      monthlyUsage = monthlyQuota?.usedAmount || 0;
    } catch (error) {
      // In test mode, ignore quota errors
      if (!isTestMode) {
        throw error;
      }
      console.warn('Quota service error (ignored in test mode):', error);
    }

    // Get free quota limits from config
    const freeDailyQuota = creditsConfig.freeUser.imageGeneration.freeQuotaPerDay;
    const freeMonthlyQuota = creditsConfig.freeUser.imageGeneration.freeQuotaPerMonth;

    // Check if user has exceeded free quota
    const hasExceededDailyQuota = freeDailyQuota > 0 && dailyUsage >= freeDailyQuota;
    const hasExceededMonthlyQuota = freeMonthlyQuota > 0 && monthlyUsage >= freeMonthlyQuota;
    
    // If free quota is 0, always charge credits. Otherwise, charge when quota is exhausted.
    const shouldChargeCredits = freeDailyQuota === 0 && freeMonthlyQuota === 0 
      ? true 
      : hasExceededDailyQuota || hasExceededMonthlyQuota;

    if (!isTestMode) {
      // Always check credits if we should charge
      if (shouldChargeCredits) {
        const hasCredits = await creditService.hasEnoughCredits(userId, creditCost);
        if (!hasCredits) {
          return NextResponse.json(
            {
              error: `Insufficient credits. Required: ${creditCost} credits. Please purchase credits to continue.`,
            },
            { status: 402 }
          );
        }
      } else {
        // Check if free quota is exceeded
        if (hasExceededDailyQuota && hasExceededMonthlyQuota) {
          // Both quotas exceeded, should have been caught above, but double-check credits
          const hasCredits = await creditService.hasEnoughCredits(userId, creditCost);
          if (!hasCredits) {
            return NextResponse.json(
              { error: 'Daily and monthly quota exceeded. Please use credits.' },
              { status: 402 }
            );
          }
        } else if (hasExceededDailyQuota) {
          // Daily quota exceeded, check if user has credits
          const hasCredits = await creditService.hasEnoughCredits(userId, creditCost);
          if (!hasCredits) {
            return NextResponse.json(
              { error: `Daily quota exceeded (${freeDailyQuota}/day). Please use credits.` },
              { status: 402 }
            );
          }
        } else if (hasExceededMonthlyQuota) {
          // Monthly quota exceeded, check if user has credits
          const hasCredits = await creditService.hasEnoughCredits(userId, creditCost);
          if (!hasCredits) {
            return NextResponse.json(
              { error: `Monthly quota exceeded (${freeMonthlyQuota}/month). Please use credits.` },
              { status: 402 }
            );
          }
        }
      }
    }

    const isStableDiffusion = model === 'stable-diffusion';
    const isNanoBanana = model === 'nano-banana';

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
      const { randomUUID } = await import('node:crypto');

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

                imageUrlForKie = r2Result.url;
                console.log(`Converted base64 image to R2 URL: ${imageUrlForKie}`);
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
        } else if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://'))) {
          // Already a valid HTTP/HTTPS URL, use directly
          imageUrlForKie = image;
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

          // Update both daily and monthly quota
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

          if (!isTestMode && shouldChargeCredits) {
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
                  usedFreeQuota: !shouldChargeCredits,
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

          return NextResponse.json({
            imageUrl: r2Result.url,
            model,
            prompt,
            width,
            height,
            creditsUsed: shouldChargeCredits ? creditCost : 0,
            quotaRemaining: Math.max(0, 1 - dailyUsage),
            usedFreeQuota: !shouldChargeCredits,
            taskId,
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
