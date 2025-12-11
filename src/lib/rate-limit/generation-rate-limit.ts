/**
 * Rate limiting for generation requests
 * Prevents users from sending too many requests too quickly
 */

import { db } from '@/server/db';
import { generatedAsset } from '@/server/db/schema';
import { and, desc, eq, gte } from 'drizzle-orm';

const RATE_LIMIT_WINDOW_MS = 3 * 60 * 1000; // 3 minutes

export interface RateLimitCheck {
  allowed: boolean;
  reason?: string;
  waitTimeSeconds?: number;
  lastRequestTime?: Date;
}

/**
 * Check if user can make a new generation request
 * Enforces 3-minute cooldown ONLY if previous generation is still processing
 * Allows immediate retry if previous generation completed or failed
 */
export async function checkGenerationRateLimit(
  userId: string,
  assetType: 'image' | 'video'
): Promise<RateLimitCheck> {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

    // Find most recent generation request (any status)
    const recentAssets = await db
      .select({
        createdAt: generatedAsset.createdAt,
        status: generatedAsset.status,
      })
      .from(generatedAsset)
      .where(
        and(
          eq(generatedAsset.userId, userId),
          eq(generatedAsset.assetType, assetType),
          gte(generatedAsset.createdAt, windowStart)
        )
      )
      .orderBy(desc(generatedAsset.createdAt))
      .limit(1);

    if (recentAssets.length === 0) {
      // No recent requests - allowed
      return { allowed: true };
    }

    const lastRequest = recentAssets[0];

    // CRITICAL: Only enforce cooldown if previous generation is still PROCESSING
    // If it completed or failed, user can start new generation immediately
    if (lastRequest.status === 'completed' || lastRequest.status === 'failed') {
      console.log('[Rate Limit] Previous generation finished, allowing new request:', {
        userId,
        assetType,
        previousStatus: lastRequest.status,
        timeSinceLastRequest: Math.floor((now.getTime() - lastRequest.createdAt.getTime()) / 1000),
      });
      return { allowed: true };
    }

    // Previous generation still processing - enforce cooldown
    const timeSinceLastRequest = now.getTime() - lastRequest.createdAt.getTime();
    const waitTimeMs = RATE_LIMIT_WINDOW_MS - timeSinceLastRequest;

    if (waitTimeMs > 0) {
      // Too soon and previous still processing - rate limited
      const waitTimeSeconds = Math.ceil(waitTimeMs / 1000);
      const waitTimeMinutes = Math.ceil(waitTimeSeconds / 60);

      console.warn('[Rate Limit] Blocking request - previous generation still processing:', {
        userId,
        assetType,
        previousStatus: lastRequest.status,
        timeSinceLastRequest: Math.floor(timeSinceLastRequest / 1000),
        waitTimeSeconds,
      });

      return {
        allowed: false,
        reason: `A previous ${assetType} generation is still in progress. Please wait ${waitTimeMinutes} minute${waitTimeMinutes > 1 ? 's' : ''} or until it completes before starting another. This prevents duplicate charges and ensures your credits are properly synchronized.`,
        waitTimeSeconds,
        lastRequestTime: lastRequest.createdAt,
      };
    }

    // Enough time has passed - allowed
    return { allowed: true };
  } catch (error) {
    console.error('[Rate Limit] Error checking generation rate limit:', {
      userId,
      assetType,
      error: error instanceof Error ? error.message : String(error),
    });

    // Fail open - allow request if rate limit check fails
    // Better to allow request than block legitimate users
    return { allowed: true };
  }
}

/**
 * Get formatted wait time message
 */
export function getWaitTimeMessage(waitTimeSeconds: number): string {
  if (waitTimeSeconds < 60) {
    return `${waitTimeSeconds} seconds`;
  }

  const minutes = Math.ceil(waitTimeSeconds / 60);
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}
