import { randomUUID } from 'node:crypto';
import { getVideoModelInfo } from '@/config/credits.config';
import { env } from '@/env';
import { auth } from '@/lib/auth/auth';
import { creditService } from '@/lib/credits';
import {
  acquireGenerationLock,
  releaseGenerationLock,
  updateGenerationLock,
} from '@/lib/generation/generation-lock';
import { getKieApiService } from '@/lib/kie/kie-api';
import { updateQuotaUsage } from '@/lib/quota/quota-service';
import { checkAndAwardReferralReward } from '@/lib/rewards/referral-reward';
import { r2StorageService } from '@/lib/storage/r2';
import { db } from '@/server/db';
import { generatedAsset, user as userTable } from '@/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
// Allow long-running polling (large models can take a few minutes)
export const maxDuration = 300;
const VIDEO_GENERATION_LOCK_TTL_MS = 45 * 60 * 1000; // 45 minutes gives enough headroom

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
  // Declare variables in outer scope for error handling
  let userId = 'unknown';
  let taskId: string | undefined;
  let generationMode: 't2v' | 'i2v' = 't2v';
  let prompt = '';
  let generationLockId: string | null = null;
  let releaseLockOnExit = true;

  try {
    const isTestMode =
      process.env.NODE_ENV === 'test' ||
      process.env.DISABLE_AUTH === 'true' ||
      request.headers.get('x-test-mode') === 'true';

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

      const [userStatus] = await db
        .select({
          banned: userTable.banned,
          banReason: userTable.banReason,
        })
        .from(userTable)
        .where(eq(userTable.id, userId))
        .limit(1);

      if (userStatus?.banned) {
        return NextResponse.json(
          {
            error:
              userStatus.banReason ||
              'Your account has been disabled. Please contact support to regain access.',
          },
          { status: 403 }
        );
      }
    }

    const requestBody = await request.json();
    const {
      prompt: promptInput,
      model = 'sora-2',
      mode,
      aspect_ratio = '16:9',
      duration = 10,
      quality = 'standard',
      style,
      image,
      enhancedPrompt: enhancedPromptInput,
    } = requestBody;

    prompt = promptInput || '';

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

    generationMode = mode === 'i2v' || mode === 'image-to-video' || Boolean(image) ? 'i2v' : 't2v';

    // CRITICAL OPTIMIZATION 1: Rate limiting - prevent too frequent requests (3-minute cooldown)
    if (!isTestMode) {
      const { checkGenerationRateLimit } = await import('@/lib/rate-limit/generation-rate-limit');
      const rateLimit = await checkGenerationRateLimit(userId, 'video');

      if (!rateLimit.allowed) {
        console.warn('[Video Generation] Rate limited:', {
          userId,
          reason: rateLimit.reason,
          waitTimeSeconds: rateLimit.waitTimeSeconds,
        });

        return NextResponse.json(
          {
            error: rateLimit.reason || 'Too many requests. Please wait before trying again.',
            waitTimeSeconds: rateLimit.waitTimeSeconds,
          },
          { status: 429 }
        );
      }
    }

    if (!isTestMode) {
      const lockResult = await acquireGenerationLock({
        userId,
        assetType: 'video',
        metadata: {
          model: normalizedModel,
          generationMode,
          duration: normalizedDuration,
          quality: normalizedQuality,
          resolution,
        },
        ttlMs: VIDEO_GENERATION_LOCK_TTL_MS,
      });

      if (!lockResult.acquired || !lockResult.lockId) {
        const lock = lockResult.existingLock;
        const waitTimeSeconds =
          lock && lock.expiresAt
            ? Math.max(1, Math.ceil((lock.expiresAt.getTime() - Date.now()) / 1000))
            : undefined;

        return NextResponse.json(
          {
            error:
              'Another video generation request is already running. Please wait for it to finish before starting a new one.',
            ...(lock?.taskId ? { currentTaskId: lock.taskId } : {}),
            ...(lock?.requestId ? { currentRequestId: lock.requestId } : {}),
            ...(lock?.createdAt ? { lockedAt: lock.createdAt.toISOString() } : {}),
            ...(lock?.expiresAt ? { expectedReleaseAt: lock.expiresAt.toISOString() } : {}),
            ...(waitTimeSeconds ? { waitTimeSeconds } : {}),
          },
          { status: 429 }
        );
      }

      generationLockId = lockResult.lockId;
    }

    // CRITICAL OPTIMIZATION 2: Check credits and FREEZE immediately to prevent race conditions
    // Available balance = total balance - frozen balance (accounts for in-progress generations)
    let creditsFrozen = false;
    if (!isTestMode) {
      const hasCredits = await creditService.hasEnoughCredits(userId, creditCost);
      if (!hasCredits) {
        // Get detailed balance info for error message
        const account = await creditService.getCreditAccount(userId);
        const availableBalance = account ? account.balance - account.frozenBalance : 0;
        const frozenBalance = account?.frozenBalance || 0;

        console.warn('[Video Generation] Insufficient credits:', {
          userId,
          required: creditCost,
          totalBalance: account?.balance || 0,
          frozenBalance,
          availableBalance,
        });

        return NextResponse.json(
          {
            error:
              frozenBalance > 0
                ? `Insufficient credits. Required: ${creditCost} credits. You have ${availableBalance} available (${frozenBalance} credits reserved for in-progress generations). Please wait for current generations to complete or purchase more credits.`
                : `Insufficient credits. Required: ${creditCost} credits. Please earn more credits or upgrade your plan.`,
            required: creditCost,
            available: availableBalance,
            frozen: frozenBalance,
          },
          { status: 402 }
        );
      }

      // CRITICAL: Freeze credits immediately to prevent race conditions
      // This ensures that concurrent requests cannot both pass the credit check
      try {
        await creditService.freezeCredits(
          userId,
          creditCost,
          `Video generation reservation (${normalizedModel})`,
          `video_reserve_${randomUUID()}`
        );
        creditsFrozen = true;
        console.log('[Video Generation] Credits frozen successfully:', {
          userId,
          credits: creditCost,
          model: normalizedModel,
        });
      } catch (freezeError) {
        console.error('[Video Generation] Failed to freeze credits:', {
          userId,
          credits: creditCost,
          error: freezeError instanceof Error ? freezeError.message : String(freezeError),
        });
        return NextResponse.json(
          {
            error: `Failed to reserve credits. ${freezeError instanceof Error && freezeError.message.includes('Insufficient') ? 'Another generation may be in progress.' : 'Please try again.'}`,
          },
          { status: 500 }
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

    let taskId: string;
    try {
      const generationResponse = await kieApiService.generateVideo({
        prompt,
        model: normalizedModel,
        aspectRatio: mapAspectRatio(aspect_ratio),
        quality: normalizedQuality,
        duration: normalizedDuration,
        imageUrls: imageUrlForKie ? [imageUrlForKie] : undefined,
      });

      taskId = generationResponse.data.taskId;

      console.log('[Video Generation] Task created successfully:', {
        taskId,
        userId,
        model: normalizedModel,
        mode: generationMode,
        prompt: prompt.substring(0, 100),
      });

      if (generationLockId) {
        try {
          await updateGenerationLock(generationLockId, {
            taskId,
            metadata: {
              taskId,
              model: normalizedModel,
              generationMode,
              duration: normalizedDuration,
              quality: normalizedQuality,
              resolution,
              startedAt: new Date().toISOString(),
            },
            extendMs: VIDEO_GENERATION_LOCK_TTL_MS,
          });
        } catch (lockUpdateError) {
          console.error('[Video Generation] Failed to update generation lock metadata:', {
            lockId: generationLockId,
            taskId,
            error:
              lockUpdateError instanceof Error
                ? lockUpdateError.message
                : String(lockUpdateError),
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Video Generation] Failed to create task:', {
        userId,
        model: normalizedModel,
        mode: generationMode,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Unfreeze credits on task creation failure
      if (creditsFrozen && !isTestMode) {
        try {
          await creditService.unfreezeCredits(
            userId,
            creditCost,
            'Task creation failed - credits refunded',
            `video_refund_creation_${randomUUID()}`
          );
          console.log('[Video Generation] Credits unfrozen after task creation failure');
        } catch (unfreezeError) {
          console.error(
            '[Video Generation] Failed to unfreeze credits after creation failure:',
            unfreezeError
          );
        }
      }

      throw error;
    }

    // ASYNC FLOW: Save task to database and return immediately (no polling/waiting)
    // Frontend will poll /api/v1/video-status/:taskId for completion
    if (!isTestMode) {
      try {
        const assetId = randomUUID();
        await db.insert(generatedAsset).values({
          id: assetId,
          userId,
          assetType: 'video',
          generationMode,
          prompt,
          enhancedPrompt: enhancedPromptInput,
          baseImageUrl: sourceImagePublicUrl,
          styleId: typeof style === 'string' ? style : null,
          videoStyle: typeof style === 'string' ? style : null,
          r2Key: `processing-${taskId}`, // Placeholder
          publicUrl: `processing-${taskId}`, // Placeholder
          status: 'processing',
          creditsSpent: creditCost, // Will be charged when completed
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
            taskId,
            generationMode,
            startedAt: new Date().toISOString(),
            creditsFrozen: true,
            ...(generationLockId ? { generationLockId } : {}),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log('[Video Generation] Task record saved, returning immediately:', {
          taskId,
          userId,
          assetId,
          creditsReserved: creditCost,
        });

        releaseLockOnExit = false;

        return NextResponse.json({
          taskId,
          assetId,
          status: 'processing',
          message:
            'Video generation started. This may take 5-20 minutes depending on model and duration.',
          estimatedTime: normalizedModel === 'sora-2-pro' ? '10-20 minutes' : '5-10 minutes',
        });
      } catch (saveError) {
        console.error('[Video Generation] Failed to save task record:', saveError);

        // Unfreeze credits
        if (creditsFrozen) {
          try {
            await creditService.unfreezeCredits(
              userId,
              creditCost,
              'Failed to save task - credits refunded',
              `video_refund_save_${taskId}`
            );
          } catch (unfreezeError) {
            console.error('[Video Generation] Failed to unfreeze after save error:', unfreezeError);
          }
        }

        throw saveError;
      }
    }

    // Test mode - continue with old synchronous flow for testing
    const pollingIntervalMs = 5000;
    const maxAttempts =
      normalizedModel === 'sora-2-pro'
        ? normalizedDuration === 15
          ? 240 // up to 20 minutes
          : 210
        : normalizedDuration === 15
          ? 180
          : 150;

    let videoResult: { imageUrl?: string; videoUrl?: string; status: string };
    try {
      console.log('[Video Generation] Starting to poll task status:', {
        taskId,
        userId,
        maxAttempts,
        pollingIntervalMs,
      });

      videoResult = await kieApiService.pollTaskStatus(
        taskId,
        'video',
        maxAttempts,
        pollingIntervalMs
      );

      console.log('[Video Generation] Task polling completed:', {
        taskId,
        userId,
        status: videoResult.status,
        hasVideoUrl: !!videoResult.videoUrl,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Video Generation] Task polling failed:', {
        taskId,
        userId,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Record failed task in database even if polling fails
      if (!isTestMode) {
        try {
          await db.insert(generatedAsset).values({
            id: randomUUID(),
            userId,
            assetType: 'video',
            generationMode,
            prompt,
            enhancedPrompt: enhancedPromptInput,
            baseImageUrl: sourceImagePublicUrl,
            styleId: typeof style === 'string' ? style : null,
            videoStyle: typeof style === 'string' ? style : null,
            status: 'failed',
            errorMessage: errorMessage,
            creditsSpent: 0, // Credits not charged if polling fails
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
              taskId,
              generationMode,
              error: errorMessage,
              failedAt: new Date().toISOString(),
            },
          });
          console.log('[Video Generation] Recorded failed task in database:', {
            taskId,
            userId,
          });
        } catch (saveError) {
          console.error('[Video Generation] Failed to record failed task in database:', {
            taskId,
            userId,
            error: saveError instanceof Error ? saveError.message : String(saveError),
          });
        }
      }

      return NextResponse.json(
        {
          error: `Video generation failed: ${errorMessage}`,
          taskId,
        },
        { status: 500 }
      );
    }

    if (!videoResult.videoUrl) {
      const errorMsg = 'Video generation completed but no video URL found';
      console.error('[Video Generation] No video URL in result:', {
        taskId,
        userId,
        status: videoResult.status,
      });

      // Record failed task in database
      if (!isTestMode) {
        try {
          await db.insert(generatedAsset).values({
            id: randomUUID(),
            userId,
            assetType: 'video',
            generationMode,
            prompt,
            enhancedPrompt: enhancedPromptInput,
            baseImageUrl: sourceImagePublicUrl,
            styleId: typeof style === 'string' ? style : null,
            videoStyle: typeof style === 'string' ? style : null,
            status: 'failed',
            errorMessage: errorMsg,
            creditsSpent: 0,
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
              taskId,
              generationMode,
              error: errorMsg,
              failedAt: new Date().toISOString(),
            },
          });
        } catch (saveError) {
          console.error('[Video Generation] Failed to record failed task (no URL):', {
            taskId,
            userId,
            error: saveError instanceof Error ? saveError.message : String(saveError),
          });
        }
      }

      return NextResponse.json({ error: errorMsg, taskId }, { status: 500 });
    }

    let videoBuffer: Buffer;
    let outputFileSize: number;
    try {
      console.log('[Video Generation] Downloading video from KIE:', {
        taskId,
        userId,
        videoUrl: `${videoResult.videoUrl.substring(0, 100)}...`,
      });

      const videoResponse = await fetch(videoResult.videoUrl);
      if (!videoResponse.ok) {
        const errorMsg = `Failed to download generated video: ${videoResponse.status} ${videoResponse.statusText}`;
        console.error('[Video Generation] Video download failed:', {
          taskId,
          userId,
          status: videoResponse.status,
          statusText: videoResponse.statusText,
        });

        // Record failed task in database
        if (!isTestMode) {
          try {
            await db.insert(generatedAsset).values({
              id: randomUUID(),
              userId,
              assetType: 'video',
              generationMode,
              prompt,
              enhancedPrompt: enhancedPromptInput,
              baseImageUrl: sourceImagePublicUrl,
              styleId: typeof style === 'string' ? style : null,
              videoStyle: typeof style === 'string' ? style : null,
              status: 'failed',
              errorMessage: errorMsg,
              creditsSpent: 0,
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
                taskId,
                generationMode,
                videoUrl: videoResult.videoUrl,
                error: errorMsg,
                failedAt: new Date().toISOString(),
              },
            });
          } catch (saveError) {
            console.error('[Video Generation] Failed to record failed task (download error):', {
              taskId,
              userId,
              error: saveError instanceof Error ? saveError.message : String(saveError),
            });
          }
        }

        return NextResponse.json({ error: errorMsg, taskId }, { status: 500 });
      }

      videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
      outputFileSize = videoBuffer.length;

      console.log('[Video Generation] Video downloaded successfully:', {
        taskId,
        userId,
        fileSize: outputFileSize,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Video Generation] Error downloading video:', {
        taskId,
        userId,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Record failed task in database
      if (!isTestMode) {
        try {
          await db.insert(generatedAsset).values({
            id: randomUUID(),
            userId,
            assetType: 'video',
            generationMode,
            prompt,
            enhancedPrompt: enhancedPromptInput,
            baseImageUrl: sourceImagePublicUrl,
            styleId: typeof style === 'string' ? style : null,
            videoStyle: typeof style === 'string' ? style : null,
            status: 'failed',
            errorMessage: errorMessage,
            creditsSpent: 0,
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
              taskId,
              generationMode,
              videoUrl: videoResult.videoUrl,
              error: errorMessage,
              failedAt: new Date().toISOString(),
            },
          });
        } catch (saveError) {
          console.error('[Video Generation] Failed to record failed task (download exception):', {
            taskId,
            userId,
            error: saveError instanceof Error ? saveError.message : String(saveError),
          });
        }
      }

      return NextResponse.json(
        { error: `Failed to download video: ${errorMessage}`, taskId },
        { status: 500 }
      );
    }

    let r2Result: { key: string; url: string };
    try {
      if (isTestMode) {
        r2Result = {
          key: `test-video-${randomUUID()}`,
          url: videoResult.videoUrl,
        };
      } else {
        console.log('[Video Generation] Uploading video to R2:', {
          taskId,
          userId,
          fileSize: outputFileSize,
        });

        r2Result = await r2StorageService.uploadAsset(
          videoBuffer,
          `video-${randomUUID()}.mp4`,
          'video/mp4',
          'video'
        );

        console.log('[Video Generation] Video uploaded to R2 successfully:', {
          taskId,
          userId,
          r2Key: r2Result.key,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Video Generation] Failed to upload video to R2:', {
        taskId,
        userId,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Record failed task in database
      if (!isTestMode) {
        try {
          await db.insert(generatedAsset).values({
            id: randomUUID(),
            userId,
            assetType: 'video',
            generationMode,
            prompt,
            enhancedPrompt: enhancedPromptInput,
            baseImageUrl: sourceImagePublicUrl,
            styleId: typeof style === 'string' ? style : null,
            videoStyle: typeof style === 'string' ? style : null,
            status: 'failed',
            errorMessage: errorMessage,
            creditsSpent: 0,
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
              taskId,
              generationMode,
              error: errorMessage,
              failedAt: new Date().toISOString(),
            },
          });
        } catch (saveError) {
          console.error('[Video Generation] Failed to record failed task (R2 upload error):', {
            taskId,
            userId,
            error: saveError instanceof Error ? saveError.message : String(saveError),
          });
        }
      }

      return NextResponse.json(
        { error: `Failed to upload video: ${errorMessage}`, taskId },
        { status: 500 }
      );
    }

    const previewUrl = isTestMode
      ? videoResult.videoUrl
      : `/api/v1/media?key=${encodeURIComponent(r2Result.key)}`;

    // CRITICAL: KIE.ai has successfully generated the video
    // We MUST save to database and charge credits, even if there are temporary failures
    // Use retry mechanism to ensure eventual consistency
    let savedAssetId: string | undefined;
    let creditTransactionId: string | undefined;

    if (!isTestMode) {
      // Retry database save up to 3 times
      const MAX_SAVE_RETRIES = 3;
      let saveSuccess = false;
      let lastSaveError: Error | null = null;

      for (let saveAttempt = 1; saveAttempt <= MAX_SAVE_RETRIES; saveAttempt++) {
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
            creditsSpent: creditCost, // Will be confirmed after credit charge
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

          saveSuccess = true;
          console.log('[Video Generation] Successfully saved asset to database:', {
            taskId,
            userId,
            assetId: savedAssetId,
            r2Key: r2Result.key,
            attempt: saveAttempt,
          });
          break;
        } catch (saveError) {
          lastSaveError = saveError instanceof Error ? saveError : new Error(String(saveError));
          console.error(
            `[Video Generation] Database save attempt ${saveAttempt}/${MAX_SAVE_RETRIES} failed:`,
            {
              taskId,
              userId,
              error: lastSaveError.message,
              stack: lastSaveError.stack,
              r2Key: r2Result.key,
              r2Url: r2Result.url,
            }
          );

          // Wait before retry (exponential backoff)
          if (saveAttempt < MAX_SAVE_RETRIES) {
            const waitTime = Math.min(1000 * 2 ** (saveAttempt - 1), 5000);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          }
        }
      }

      // CRITICAL: Even if database save fails, we MUST charge credits
      // because KIE.ai has already successfully generated the video
      // The video is available at r2Result.url, so user should get it
      if (!saveSuccess) {
        console.error(
          '[Video Generation] CRITICAL: All database save attempts failed, but KIE.ai succeeded:',
          {
            taskId,
            userId,
            r2Key: r2Result.key,
            r2Url: r2Result.url,
            error: lastSaveError?.message,
          }
        );

        // Try to create a minimal record to track this issue
        try {
          const fallbackId = randomUUID();
          await db.insert(generatedAsset).values({
            id: fallbackId,
            userId,
            assetType: 'video',
            generationMode,
            prompt: prompt.substring(0, 500), // Truncate if too long
            baseImageUrl: sourceImagePublicUrl,
            r2Key: r2Result.key,
            publicUrl: r2Result.url,
            duration: normalizedDuration,
            fileSize: outputFileSize,
            status: 'completed',
            creditsSpent: creditCost,
            generationParams: {
              aspect_ratio,
              duration: normalizedDuration,
              quality: normalizedQuality,
              resolution,
              model: normalizedModel,
              modelKey,
            },
            metadata: {
              taskId,
              generationMode,
              saveRetryFailed: true,
              originalError: lastSaveError?.message,
            },
          });
          savedAssetId = fallbackId;
          console.log('[Video Generation] Created minimal fallback record:', {
            taskId,
            assetId: fallbackId,
          });
        } catch (fallbackError) {
          console.error('[Video Generation] CRITICAL: Even fallback save failed:', {
            taskId,
            userId,
            error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          });
          // Continue - we'll still charge credits and return the video URL
        }
      }
    }

    // Update quota (non-critical, don't fail if this fails)
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
        console.warn('[Video Generation] Quota update failed (non-critical):', {
          taskId,
          userId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // CRITICAL: Unfreeze and charge credits - MUST succeed because KIE.ai has already generated the video
    // Use retry mechanism to ensure credits are charged
    if (!isTestMode) {
      // First, unfreeze the credits
      if (creditsFrozen) {
        try {
          await creditService.unfreezeCredits(
            userId,
            creditCost,
            `Video generation completed (${normalizedModel})`,
            `video_unfreeze_${taskId}`
          );
          console.log('[Video Generation] Credits unfrozen successfully:', {
            taskId,
            userId,
            credits: creditCost,
          });
        } catch (unfreezeError) {
          console.error('[Video Generation] Failed to unfreeze credits (will retry):', {
            taskId,
            userId,
            error: unfreezeError instanceof Error ? unfreezeError.message : String(unfreezeError),
          });
          // Continue - we'll still try to charge credits
        }
      }

      const MAX_CREDIT_RETRIES = 3;
      let creditChargeSuccess = false;
      let lastCreditError: Error | null = null;

      for (let creditAttempt = 1; creditAttempt <= MAX_CREDIT_RETRIES; creditAttempt++) {
        try {
          const creditTransaction = await creditService.spendCredits({
            userId,
            amount: creditCost,
            source: 'api_call',
            description: `Video generation (${generationMode}) with ${normalizedModel}`,
            referenceId: `video_${taskId}`, // Use taskId as reference for idempotency
            metadata: {
              feature: 'video-generation',
              model: normalizedModel,
              modelKey,
              resolution,
              duration: normalizedDuration,
              prompt: prompt.substring(0, 100),
              taskId,
              assetId: savedAssetId,
            },
          });

          creditTransactionId = creditTransaction.id;
          creditChargeSuccess = true;

          console.log('[Video Generation] Successfully charged credits:', {
            taskId,
            userId,
            credits: creditCost,
            transactionId: creditTransactionId,
            assetId: savedAssetId,
            attempt: creditAttempt,
          });

          // Update asset record with credit transaction ID
          if (savedAssetId) {
            try {
              await db
                .update(generatedAsset)
                .set({
                  creditsSpent: creditCost,
                  metadata: sql`jsonb_set(
                    COALESCE(metadata, '{}'::jsonb),
                    '{creditTransactionId}',
                    ${JSON.stringify(creditTransactionId)}::jsonb
                  )`,
                })
                .where(eq(generatedAsset.id, savedAssetId));
            } catch (updateError) {
              console.warn(
                '[Video Generation] Failed to update asset with credit transaction ID (non-critical):',
                {
                  taskId,
                  assetId: savedAssetId,
                  error: updateError instanceof Error ? updateError.message : String(updateError),
                }
              );
            }
          }

          break;
        } catch (error) {
          lastCreditError = error instanceof Error ? error : new Error(String(error));
          console.error(
            `[Video Generation] Credit charge attempt ${creditAttempt}/${MAX_CREDIT_RETRIES} failed:`,
            {
              taskId,
              userId,
              credits: creditCost,
              error: lastCreditError.message,
              stack: lastCreditError.stack,
              assetId: savedAssetId,
            }
          );

          // Check if it's an idempotency issue (already charged)
          if (
            lastCreditError.message.includes('referenceId') ||
            lastCreditError.message.includes('unique')
          ) {
            console.log(
              '[Video Generation] Credits may have already been charged (idempotency check):',
              {
                taskId,
                userId,
              }
            );
            // Try to verify if credits were actually charged
            // If referenceId exists, credits were likely already charged
            creditChargeSuccess = true; // Assume success for idempotency
            break;
          }

          // Wait before retry (exponential backoff)
          if (creditAttempt < MAX_CREDIT_RETRIES) {
            const waitTime = Math.min(1000 * 2 ** (creditAttempt - 1), 5000);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          }
        }
      }

      // CRITICAL: If credit charge fails after all retries, we still need to return the video
      // because KIE.ai has already generated it. Log this as a critical issue for manual review.
      if (!creditChargeSuccess) {
        console.error(
          '[Video Generation] CRITICAL: All credit charge attempts failed, but video was generated:',
          {
            taskId,
            userId,
            credits: creditCost,
            r2Key: r2Result.key,
            r2Url: r2Result.url,
            assetId: savedAssetId,
            error: lastCreditError?.message,
          }
        );

        // Update asset record to mark credit charge failure
        if (savedAssetId) {
          try {
            await db
              .update(generatedAsset)
              .set({
                metadata: sql`jsonb_set(
                  COALESCE(metadata, '{}'::jsonb),
                  '{creditChargeFailed}',
                  ${JSON.stringify({
                    error: lastCreditError?.message,
                    failedAt: new Date().toISOString(),
                    credits: creditCost,
                  })}::jsonb
                )`,
              })
              .where(eq(generatedAsset.id, savedAssetId));
          } catch (updateError) {
            console.error('[Video Generation] Failed to update asset with credit charge failure:', {
              taskId,
              assetId: savedAssetId,
              error: updateError instanceof Error ? updateError.message : String(updateError),
            });
          }
        }

        // CRITICAL: Still return success with video URL
        // This ensures user gets the video even if credit charge failed
        // The credit charge failure will be logged and can be manually reviewed/fixed
        console.warn(
          '[Video Generation] Returning video URL despite credit charge failure - requires manual review:',
          {
            taskId,
            userId,
            credits: creditCost,
          }
        );
      }
    }

    // Check and award referral reward if this is user's first generation (non-critical)
    if (!isTestMode) {
      await checkAndAwardReferralReward(userId).catch((error) => {
        console.error('[Video Generation] Error checking referral reward (non-critical):', {
          taskId,
          userId,
          error: error instanceof Error ? error.message : String(error),
        });
        // Don't fail the request if referral reward check fails
      });
    }

    // CRITICAL: Always return success with video URL if KIE.ai succeeded
    // Even if database save or credit charge had issues, the video is available
    // This ensures user gets the video and we can fix credit/database issues later
    const response = {
      videoUrl: r2Result.url,
      previewUrl,
      model: normalizedModel,
      prompt,
      duration: normalizedDuration,
      taskId,
      creditsUsed: creditCost,
      assetId: savedAssetId ?? null,
      // Include warnings if there were any issues
      warnings: [] as string[],
    };

    if (!savedAssetId && !isTestMode) {
      response.warnings.push('Video saved but database record may be incomplete');
    }

    if (!creditTransactionId && !isTestMode) {
      response.warnings.push(
        'Video generated but credit charge may have failed - requires manual review'
      );
    }

    console.log('[Video Generation] Returning success response:', {
      taskId,
      userId,
      videoUrl: r2Result.url,
      assetId: savedAssetId,
      creditTransactionId,
      warnings: response.warnings,
    });

    return NextResponse.json(response);
  } catch (error) {
    const isTestMode =
      process.env.NODE_ENV === 'test' ||
      process.env.DISABLE_AUTH === 'true' ||
      request.headers.get('x-test-mode') === 'true';

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('[Video Generation] Unhandled error in video generation:', {
      userId,
      taskId: taskId || 'not-created',
      generationMode,
      prompt: prompt.substring(0, 100),
      error: errorMessage,
      stack: errorStack,
    });

    // CRITICAL: Unfreeze credits if they were frozen (refund on failure)
    if (creditsFrozen && !isTestMode) {
      try {
        await creditService.unfreezeCredits(
          userId,
          creditCost,
          'Video generation failed - credits refunded',
          `video_refund_${taskId || randomUUID()}`
        );
        console.log('[Video Generation] Credits unfrozen (refunded) after failure:', {
          userId,
          credits: creditCost,
          error: errorMessage,
        });
      } catch (unfreezeError) {
        console.error(
          '[Video Generation] CRITICAL: Failed to unfreeze credits after generation failure:',
          {
            userId,
            credits: creditCost,
            unfreezeError:
              unfreezeError instanceof Error ? unfreezeError.message : String(unfreezeError),
            originalError: errorMessage,
          }
        );
        // This is a critical issue - credits are frozen but generation failed
        // Need manual intervention to unfreeze
      }
    }

    // Try to record failed task if we have taskId
    if (taskId && !isTestMode) {
      try {
        await db.insert(generatedAsset).values({
          id: randomUUID(),
          userId,
          assetType: 'video',
          generationMode,
          prompt,
          status: 'failed',
          errorMessage: errorMessage,
          creditsSpent: 0,
          metadata: {
            taskId,
            error: errorMessage,
            failedAt: new Date().toISOString(),
            unhandledError: true,
          },
        });
        console.log('[Video Generation] Recorded unhandled error in database:', {
          taskId,
          userId,
        });
      } catch (saveError) {
        console.error('[Video Generation] Failed to record unhandled error:', {
          taskId,
          userId,
          error: saveError instanceof Error ? saveError.message : String(saveError),
        });
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        taskId: taskId || undefined,
      },
      { status: 500 }
    );
  } finally {
    if (generationLockId && releaseLockOnExit) {
      try {
        await releaseGenerationLock(generationLockId);
      } catch (lockReleaseError) {
        console.error('[Video Generation] Failed to release generation lock:', {
          lockId: generationLockId,
          error:
            lockReleaseError instanceof Error
              ? lockReleaseError.message
              : String(lockReleaseError),
        });
      }
      generationLockId = null;
    }
  }
}
