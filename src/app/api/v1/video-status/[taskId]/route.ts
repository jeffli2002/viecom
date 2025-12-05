import { auth } from '@/lib/auth/auth';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { generatedAsset, userCredits } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for processing

interface RouteParams {
  params: Promise<{
    taskId: string;
  }>;
}

/**
 * Check video generation status
 * GET /api/v1/video-status/:taskId
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { taskId } = await params;

    // Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Find task in database
    const assets = await db
      .select()
      .from(generatedAsset)
      .where(eq(generatedAsset.userId, userId))
      .orderBy(generatedAsset.createdAt);

    const asset = assets.find((a) => {
      const metadata = a.metadata as any;
      return metadata?.taskId === taskId;
    });

    if (!asset) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // If already completed or failed, return immediately
    if (asset.status === 'completed') {
      return NextResponse.json({
        status: 'completed',
        progress: 100,
        videoUrl: asset.publicUrl,
        previewUrl: (asset.metadata as any)?.previewUrl,
        assetId: asset.id,
        creditsSpent: asset.creditsSpent,
      });
    }

    if (asset.status === 'failed') {
      return NextResponse.json({
        status: 'failed',
        progress: 0,
        error: asset.errorMessage || 'Video generation failed',
      });
    }

    // Status is "processing" - check KIE.ai
    console.log('[Video Status] Checking KIE.ai status:', {
      taskId,
      userId,
      assetId: asset.id,
    });

    try {
      const { getKieApiService } = await import('@/lib/kie/kie-api');
      const kieApiService = getKieApiService();
      
      const kieStatus = await kieApiService.getTaskStatus(taskId);

      // Still processing in KIE.ai
      if (kieStatus.data?.status === 'processing' || kieStatus.data?.state === 'processing') {
        return NextResponse.json({
          status: 'processing',
          progress: 50, // Estimate
          message: 'Generating video... This may take 5-20 minutes',
        });
      }

      // Failed in KIE.ai
      if (kieStatus.data?.status === 'failed' || kieStatus.data?.state === 'fail') {
        const errorMsg = kieStatus.data?.error || kieStatus.data?.failMsg || 'Generation failed';
        
        // Update database
        await db
          .update(generatedAsset)
          .set({
            status: 'failed',
            errorMessage: errorMsg,
            updatedAt: new Date(),
          })
          .where(eq(generatedAsset.id, asset.id));

        // Unfreeze credits (refund)
        const { CreditService } = await import('@/lib/credits/credit-service');
        const creditService = new CreditService();
        
        try {
          await creditService.unfreezeCredits(
            userId,
            asset.creditsSpent || 0,
            `Video generation failed - credits refunded`,
            `video_refund_${taskId}`
          );
        } catch (unfreezeError) {
          console.error('[Video Status] Failed to unfreeze credits:', unfreezeError);
        }

        return NextResponse.json({
          status: 'failed',
          progress: 0,
          error: errorMsg,
        });
      }

      // Completed in KIE.ai - process the video!
      if (kieStatus.data?.status === 'completed' || kieStatus.data?.state === 'success') {
        console.log('[Video Status] Video ready in KIE.ai, processing...:', {
          taskId,
          userId,
        });

        const videoUrl = kieStatus.data?.result?.videoUrl || kieStatus.data?.result?.resultUrls?.[0];

        if (!videoUrl) {
          throw new Error('Video URL not found in KIE.ai response');
        }

        // Download video from KIE.ai
        const videoResponse = await fetch(videoUrl);
        if (!videoResponse.ok) {
          throw new Error(`Failed to download video: ${videoResponse.status}`);
        }

        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
        const fileSize = videoBuffer.length;

        // Upload to R2
        const { r2StorageService } = await import('@/lib/storage/r2');
        const r2Result = await r2StorageService.uploadAsset(
          videoBuffer,
          `video-${randomUUID()}.mp4`,
          'video/mp4',
          'video'
        );

        const previewUrl = `/api/v1/media?key=${encodeURIComponent(r2Result.key)}`;

        // Update database with completed status
        await db
          .update(generatedAsset)
          .set({
            status: 'completed',
            r2Key: r2Result.key,
            publicUrl: r2Result.url,
            fileSize,
            metadata: {
              ...(asset.metadata as any),
              previewUrl,
              completedAt: new Date().toISOString(),
            },
            updatedAt: new Date(),
          })
          .where(eq(generatedAsset.id, asset.id));

        // Unfreeze and charge credits
        const { CreditService } = await import('@/lib/credits/credit-service');
        const creditService = new CreditService();

        const creditCost = asset.creditsSpent || 0;
        
        // Unfreeze
        try {
          await creditService.unfreezeCredits(
            userId,
            creditCost,
            `Video generation completed`,
            `video_unfreeze_${taskId}`
          );
        } catch (unfreezeError) {
          console.error('[Video Status] Failed to unfreeze credits:', unfreezeError);
        }

        // Charge
        try {
          await creditService.spendCredits({
            userId,
            amount: creditCost,
            source: 'api_call',
            description: `Video generation with ${asset.generationMode || 'video'}`,
            referenceId: `video_${taskId}`,
            metadata: {
              feature: 'video-generation',
              taskId,
              assetId: asset.id,
            },
          });
        } catch (chargeError) {
          console.error('[Video Status] Failed to charge credits:', chargeError);
          // Continue - video is ready, credit charge can be fixed manually
        }

        console.log('[Video Status] Video processing completed:', {
          taskId,
          userId,
          assetId: asset.id,
          r2Key: r2Result.key,
        });

        return NextResponse.json({
          status: 'completed',
          progress: 100,
          videoUrl: r2Result.url,
          previewUrl,
          assetId: asset.id,
          creditsSpent: creditCost,
        });
      }

      // Unknown status
      return NextResponse.json({
        status: 'processing',
        progress: 30,
        message: 'Processing... Please wait',
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Video Status] Error checking KIE.ai status:', {
        taskId,
        userId,
        error: errorMessage,
      });

      // Return processing status so frontend keeps polling
      return NextResponse.json({
        status: 'processing',
        progress: 50,
        message: 'Still processing... This may take a few minutes',
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Video Status] Error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

