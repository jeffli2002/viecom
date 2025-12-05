import { env } from '@/env';
import { db } from '@/server/db';
import { generatedAsset } from '@/server/db/schema';
import { and, eq, lt } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for cron job

/**
 * Cron job to process stuck video/image generation tasks
 * 
 * This endpoint is called periodically (every 10 minutes) by Vercel Cron
 * 
 * What it does:
 * 1. Find all tasks with status="processing" older than 10 minutes
 * 2. Check KIE.ai for completion status
 * 3. If completed: Download video/image, upload to R2, unfreeze & charge credits
 * 4. If failed: Unfreeze credits (refund user)
 * 5. If still processing: Leave it alone (wait for next cron run)
 * 
 * This prevents:
 * - Frozen credits forever
 * - Financial losses (KIE.ai paid but user not charged)
 * - Orphaned videos/images
 */

async function processStuckTasks(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = env.CRON_SECRET;

  // Verify cron authorization
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.error('[Cron] Unauthorized cron request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  console.log('[Cron] Starting stuck task processor...');

  try {
    // Find stuck tasks (processing for more than 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    const stuckTasks = await db
      .select()
      .from(generatedAsset)
      .where(
        and(
          eq(generatedAsset.status, 'processing'),
          lt(generatedAsset.createdAt, tenMinutesAgo)
        )
      )
      .limit(50); // Process up to 50 stuck tasks per run

    console.log(`[Cron] Found ${stuckTasks.length} stuck tasks to process`);

    if (stuckTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stuck tasks found',
        processed: 0,
        duration: Date.now() - startTime,
      });
    }

    const results = {
      completed: 0,
      failed: 0,
      stillProcessing: 0,
      errors: 0,
    };

    // Process each stuck task
    for (const task of stuckTasks) {
      const metadata = task.metadata as any;
      const taskId = metadata?.taskId;

      if (!taskId) {
        console.warn('[Cron] Task has no taskId in metadata:', task.id);
        results.errors++;
        continue;
      }

      console.log(`[Cron] Processing task ${taskId}...`);

      try {
        // Check KIE.ai status
        const { getKieApiService } = await import('@/lib/kie/kie-api');
        const kieApiService = getKieApiService();
        
        const kieStatus = await kieApiService.getTaskStatus(taskId);
        const state = kieStatus.data?.state || kieStatus.data?.status;

        if (state === 'success' || state === 'completed') {
          // Video is ready - process it!
          console.log(`[Cron] Task ${taskId} completed in KIE.ai, processing...`);
          
          const resultUrl = kieStatus.data?.result?.videoUrl || 
                           kieStatus.data?.result?.imageUrl ||
                           kieStatus.data?.result?.resultUrls?.[0];

          if (!resultUrl) {
            throw new Error('No result URL in KIE.ai response');
          }

          // Download from KIE.ai
          const response = await fetch(resultUrl);
          if (!response.ok) {
            throw new Error(`Failed to download: ${response.status}`);
          }

          const buffer = Buffer.from(await response.arrayBuffer());
          const fileSize = buffer.length;

          // Upload to R2
          const { r2StorageService } = await import('@/lib/storage/r2');
          const extension = task.assetType === 'video' ? 'mp4' : 'png';
          const contentType = task.assetType === 'video' ? 'video/mp4' : 'image/png';
          
          const r2Result = await r2StorageService.uploadAsset(
            buffer,
            `${task.assetType}-${randomUUID()}.${extension}`,
            contentType,
            task.assetType
          );

          const previewUrl = `/api/v1/media?key=${encodeURIComponent(r2Result.key)}`;

          // Update database
          await db
            .update(generatedAsset)
            .set({
              status: 'completed',
              r2Key: r2Result.key,
              publicUrl: r2Result.url,
              fileSize,
              metadata: {
                ...metadata,
                previewUrl,
                completedAt: new Date().toISOString(),
                processedByCron: true,
              },
              updatedAt: new Date(),
            })
            .where(eq(generatedAsset.id, task.id));

          // Unfreeze and charge credits
          const { CreditService } = await import('@/lib/credits/credit-service');
          const creditService = new CreditService();
          const creditCost = task.creditsSpent || 0;

          if (creditCost > 0) {
            // Unfreeze
            try {
              await creditService.unfreezeCredits(
                task.userId,
                creditCost,
                `${task.assetType} generation completed (cron)`,
                `cron_unfreeze_${taskId}`
              );
            } catch (unfreezeError) {
              console.warn('[Cron] Failed to unfreeze (may already be unfrozen):', unfreezeError);
            }

            // Charge
            try {
              await creditService.spendCredits({
                userId: task.userId,
                amount: creditCost,
                source: 'api_call',
                description: `${task.assetType} generation - processed by cron`,
                referenceId: `video_${taskId}`,
                metadata: {
                  feature: `${task.assetType}-generation`,
                  taskId,
                  assetId: task.id,
                  processedByCron: true,
                },
              });
            } catch (chargeError) {
              console.error('[Cron] Failed to charge credits:', chargeError);
              // Continue - video is saved, credit charge can be fixed manually
            }
          }

          console.log(`[Cron] ✅ Task ${taskId} completed successfully`);
          results.completed++;

        } else if (state === 'fail' || state === 'failed') {
          // Generation failed - refund credits
          console.log(`[Cron] Task ${taskId} failed in KIE.ai, refunding credits...`);
          
          const errorMsg = kieStatus.data?.error || kieStatus.data?.failMsg || 'Generation failed';

          // Update database
          await db
            .update(generatedAsset)
            .set({
              status: 'failed',
              errorMessage: errorMsg,
              metadata: {
                ...metadata,
                failedAt: new Date().toISOString(),
                processedByCron: true,
              },
              updatedAt: new Date(),
            })
            .where(eq(generatedAsset.id, task.id));

          // Unfreeze credits (refund)
          const { CreditService } = await import('@/lib/credits/credit-service');
          const creditService = new CreditService();
          const creditCost = task.creditsSpent || 0;

          if (creditCost > 0) {
            try {
              await creditService.unfreezeCredits(
                task.userId,
                creditCost,
                `${task.assetType} generation failed - credits refunded (cron)`,
                `cron_refund_${taskId}`
              );
              console.log(`[Cron] ✅ Refunded ${creditCost} credits for failed task ${taskId}`);
            } catch (unfreezeError) {
              console.error('[Cron] Failed to unfreeze credits:', unfreezeError);
            }
          }

          results.failed++;

        } else {
          // Still processing in KIE.ai - leave it alone
          console.log(`[Cron] Task ${taskId} still processing in KIE.ai (state: ${state})`);
          results.stillProcessing++;
        }

      } catch (error) {
        console.error(`[Cron] Error processing task ${taskId}:`, {
          error: error instanceof Error ? error.message : String(error),
          taskId,
          assetId: task.id,
        });
        results.errors++;
      }
    }

    const duration = Date.now() - startTime;
    console.log('[Cron] Stuck task processor completed:', {
      duration: `${duration}ms`,
      results,
    });

    return NextResponse.json({
      success: true,
      message: 'Stuck tasks processed',
      results,
      duration,
      totalFound: stuckTasks.length,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Cron] Error in stuck task processor:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      },
      { status: 500 }
    );
  }
}

// Support both GET and POST for compatibility
export async function GET(request: NextRequest) {
  return processStuckTasks(request);
}

export async function POST(request: NextRequest) {
  return processStuckTasks(request);
}
