import { randomUUID } from 'node:crypto';
import { getVideoModelInfo } from '@/config/credits.config';
import { env } from '@/env';
import { auth } from '@/lib/auth/auth';
import { creditService } from '@/lib/credits';
import { getKieApiService } from '@/lib/kie/kie-api';
import { updateQuotaUsage } from '@/lib/quota/quota-service';
import { checkAndAwardReferralReward } from '@/lib/rewards/referral-reward';
import { r2StorageService } from '@/lib/storage/r2';
import { db } from '@/server/db';
import { generatedAsset } from '@/server/db/schema';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Map aspect ratio to KIE format
function mapAspectRatio(ratio: string): 'square' | 'portrait' | 'landscape' {
  if (ratio === '1:1' || ratio === 'square') return 'square';
  if (ratio === '9:16' || ratio === 'portrait') return 'portrait';
  return 'landscape'; // Default to landscape for 16:9, 4:3, etc.
}

const isR2Configured = () =>
  !!(
    env.R2_BUCKET_NAME &&
    env.R2_BUCKET_NAME !== 'dummy' &&
    env.R2_ACCESS_KEY_ID &&
    env.R2_ACCESS_KEY_ID !== 'dummy' &&
    env.R2_SECRET_ACCESS_KEY &&
    env.R2_SECRET_ACCESS_KEY !== 'dummy' &&
    env.R2_ENDPOINT &&
    env.R2_ENDPOINT !== 'https://dummy.r2.cloudflarestorage.com'
  );

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
      model = 'sora-2',
      mode,
      aspect_ratio = '16:9',
      duration = 10,
      quality = 'standard',
      style,
      image,
      enhancedPrompt: enhancedPromptInput,
    } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    if (mode === 'i2v' && !image) {
      return NextResponse.json(
        { error: 'Image is required for image-to-video mode' },
        { status: 400 }
      );
    }

    const normalizedModel: 'sora-2' | 'sora-2-pro' =
      model === 'sora-2-pro' ? 'sora-2-pro' : 'sora-2';
    const normalizedDuration: 10 | 15 = duration === 15 ? 15 : 10;
    const normalizedQuality =
      normalizedModel === 'sora-2-pro' ? (quality === 'high' ? 'high' : 'standard') : 'standard';
    const resolution: '720p' | '1080p' =
      normalizedModel === 'sora-2-pro' ? (normalizedQuality === 'high' ? '1080p' : '720p') : '720p';

    const { modelKey, credits: creditCost } = getVideoModelInfo({
      model: normalizedModel,
      resolution,
      duration: normalizedDuration,
    });

    if (creditCost === 0) {
      return NextResponse.json({ error: 'Invalid video model configuration' }, { status: 400 });
    }

    const generationMode: 't2v' | 'i2v' =
      mode === 'i2v' || mode === 'image-to-video' || Boolean(image) ? 'i2v' : 't2v';

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

    const kieApiService = getKieApiService();

    let imageUrlForKie: string | undefined;
    let sourceImagePublicUrl: string | undefined;

    if (generationMode === 'i2v') {
      if (!image) {
        return NextResponse.json(
          { error: 'Image is required for image-to-video mode' },
          { status: 400 }
        );
      }

      if (typeof image === 'string' && image.startsWith('data:image/')) {
        if (!isR2Configured()) {
          return NextResponse.json(
            {
              error:
                'R2 storage is not configured. Please configure R2 credentials in environment variables to use image-to-video generation.',
            },
            { status: 500 }
          );
        }

        const base64Match = image.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!base64Match) {
          return NextResponse.json(
            { error: 'Invalid image format. Expected base64 data URL.' },
            { status: 400 }
          );
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

        try {
          const uploadResult = await r2StorageService.uploadAsset(
            imageBuffer,
            `input-video-image-${randomUUID()}.${extension}`,
            contentType,
            'image'
          );

          sourceImagePublicUrl = uploadResult.url;

          try {
            imageUrlForKie = await r2StorageService.getSignedUrl(uploadResult.key, 3600);
          } catch (signError) {
            console.error(
              'Failed to create signed URL for video input image (fallback to public URL):',
              signError
            );
            imageUrlForKie = uploadResult.url;
          }

          const parsed = new URL(imageUrlForKie);
          if (parsed.protocol !== 'https:') {
            throw new Error(
              `Input image URL must use HTTPS. Current protocol: ${parsed.protocol || 'unknown'}`
            );
          }
        } catch (error) {
          console.error('Failed to upload input image for video generation:', error);
          return NextResponse.json(
            { error: 'Failed to process input image for video generation. Please try again.' },
            { status: 500 }
          );
        }
      } else if (
        typeof image === 'string' &&
        (image.startsWith('http://') || image.startsWith('https://'))
      ) {
        try {
          const parsed = new URL(image);
          if (parsed.protocol !== 'https:') {
            return NextResponse.json({ error: 'Input image URL must use HTTPS.' }, { status: 400 });
          }
        } catch {
          return NextResponse.json({ error: 'Invalid input image URL.' }, { status: 400 });
        }

        sourceImagePublicUrl = image;
        imageUrlForKie = image;
      } else {
        return NextResponse.json(
          { error: 'Unsupported image format. Please upload the file directly.' },
          { status: 400 }
        );
      }
    }

    const generationResponse = await kieApiService.generateVideo({
      prompt,
      model: normalizedModel,
      aspectRatio: mapAspectRatio(aspect_ratio),
      quality: normalizedQuality,
      duration: normalizedDuration,
      imageUrls: imageUrlForKie ? [imageUrlForKie] : undefined,
    });

    const taskId = generationResponse.data.taskId;

    const videoResult = await kieApiService.pollTaskStatus(taskId, 'video');
    if (!videoResult.videoUrl) {
      return NextResponse.json(
        { error: 'Video generation completed but no video URL found' },
        { status: 500 }
      );
    }

    const videoResponse = await fetch(videoResult.videoUrl);
    if (!videoResponse.ok) {
      return NextResponse.json({ error: 'Failed to download generated video' }, { status: 500 });
    }

    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    const outputFileSize = videoBuffer.length;

    let r2Result: { key: string; url: string };
    if (isTestMode) {
      r2Result = {
        key: `test-video-${randomUUID()}`,
        url: videoResult.videoUrl,
      };
    } else {
      r2Result = await r2StorageService.uploadAsset(
        videoBuffer,
        `video-${randomUUID()}.mp4`,
        'video/mp4',
        'video'
      );
    }

    const previewUrl = isTestMode
      ? videoResult.videoUrl
      : `/api/v1/media?key=${encodeURIComponent(r2Result.key)}`;

    // Update quota
    try {
      await updateQuotaUsage({
        userId,
        service: 'video_generation',
        amount: 1,
        period: dailyPeriod,
      });
      await updateQuotaUsage({
        userId,
        service: 'video_generation',
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
          description: `Video generation (${generationMode}) with ${normalizedModel}`,
          metadata: {
            feature: 'video-generation',
            model: normalizedModel,
            modelKey,
            resolution,
            duration: normalizedDuration,
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

    let savedAssetId: string | undefined;
    if (!isTestMode) {
      try {
        savedAssetId = randomUUID();
        await db.insert(generatedAsset).values({
          id: savedAssetId,
          userId,
          assetType: 'video',
          generationMode,
          prompt,
          enhancedPrompt: enhancedPromptInput,
          baseImageUrl: sourceImagePublicUrl,
          styleId: typeof style === 'string' ? style : null,
          videoStyle: typeof style === 'string' ? style : null,
          r2Key: r2Result.key,
          publicUrl: r2Result.url,
          thumbnailUrl: previewUrl.startsWith('http') ? previewUrl : undefined,
          duration: normalizedDuration,
          fileSize: outputFileSize,
          status: 'completed',
          creditsSpent: creditCost,
          generationParams: {
            aspect_ratio,
            duration: normalizedDuration,
            quality: normalizedQuality,
            resolution,
            style,
            model: normalizedModel,
            modelKey,
          },
          metadata: {
            previewUrl,
            taskId,
            generationMode,
          },
        });
      } catch (saveError) {
        console.error('Failed to persist generated video asset:', saveError);
      }
    }

    return NextResponse.json({
      videoUrl: r2Result.url,
      previewUrl,
      model: normalizedModel,
      prompt,
      duration: normalizedDuration,
      taskId,
      creditsUsed: creditCost,
      assetId: savedAssetId ?? null,
    });
  } catch (error) {
    console.error('Error generating video:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
