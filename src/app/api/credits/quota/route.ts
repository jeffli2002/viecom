import { auth } from '@/lib/auth/auth';
import { resolvePlanByIdentifier } from '@/lib/creem/plan-utils';
import { getQuotaUsageByService } from '@/lib/quota/quota-service';
import { paymentConfig } from '@/config/payment.config';
import { creditsConfig } from '@/config/credits.config';
import { paymentRepository } from '@/server/db/repositories/payment-repository';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export interface QuotaUsageResponse {
  storage: {
    used: number;
    limit: number;
    isUnlimited: boolean;
  };
  imageGeneration?: {
    daily: {
      used: number;
      limit: number;
      isUnlimited: boolean;
    };
    monthly: {
      used: number;
      limit: number;
      isUnlimited: boolean;
    };
  };
  videoGeneration?: {
    daily: {
      used: number;
      limit: number;
      isUnlimited: boolean;
    };
    monthly: {
      used: number;
      limit: number;
      isUnlimited: boolean;
    };
  };
  imageExtraction?: {
    daily: {
      used: number;
      limit: number;
      isUnlimited: boolean;
    };
    monthly: {
      used: number;
      limit: number;
      isUnlimited: boolean;
    };
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get current periods
    const currentDate = new Date();
    const currentPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const currentDailyPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

    // Get user's current subscription to determine limits
    const subscription = await paymentRepository.findActiveSubscriptionByUserId(userId);

    // Get monthly usage records
    const monthlyImageGenUsage = await getQuotaUsageByService(userId, 'image_generation', currentPeriod);
    const monthlyVideoGenUsage = await getQuotaUsageByService(userId, 'video_generation', currentPeriod);
    const monthlyImageExtUsage = await getQuotaUsageByService(userId, 'image_extraction', currentPeriod);
    const monthlyStorageUsage = await getQuotaUsageByService(userId, 'storage', currentPeriod);

    // Get daily usage records
    const dailyImageGenUsage = await getQuotaUsageByService(userId, 'image_generation', currentDailyPeriod);
    const dailyVideoGenUsage = await getQuotaUsageByService(userId, 'video_generation', currentDailyPeriod);
    const dailyImageExtUsage = await getQuotaUsageByService(userId, 'image_extraction', currentDailyPeriod);

    // Extract usage data
    const storageUsage = monthlyStorageUsage?.usedAmount || 0;
    const monthlyImageGenUsed = monthlyImageGenUsage?.usedAmount || 0;
    const monthlyVideoGenUsed = monthlyVideoGenUsage?.usedAmount || 0;
    const monthlyImageExtUsed = monthlyImageExtUsage?.usedAmount || 0;
    const dailyImageGenUsed = dailyImageGenUsage?.usedAmount || 0;
    const dailyVideoGenUsed = dailyVideoGenUsage?.usedAmount || 0;
    const dailyImageExtUsed = dailyImageExtUsage?.usedAmount || 0;

    // Get limits from payment config
    const resolvedPlan = subscription
      ? resolvePlanByIdentifier(subscription.priceId, subscription.interval || undefined)
      : resolvePlanByIdentifier('free');

    const userPlan = resolvedPlan?.plan || paymentConfig.plans.find((p) => p.id === 'free');
    const planLimits = userPlan?.limits || paymentConfig.plans[0]?.limits || {}; // Default to free plan

    // Determine storage limits
    const baseStorageLimit = creditsConfig.freeUser.storage.freeQuotaGB * 1024 * 1024 * 1024;
    let storageLimit = baseStorageLimit;
    let isStorageUnlimited = false;

    if (subscription) {
      switch (subscription.priceId) {
        case process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY:
        case process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY:
          storageLimit = 10 * 1024 * 1024 * 1024; // 10 GB
          break;
        case process.env.NEXT_PUBLIC_STRIPE_PRICE_PROPLUS_MONTHLY:
        case process.env.NEXT_PUBLIC_STRIPE_PRICE_PROPLUS_YEARLY:
          isStorageUnlimited = true;
          break;
      }
    }

    const response: QuotaUsageResponse = {
      storage: {
        used: storageUsage,
        limit: storageLimit,
        isUnlimited: isStorageUnlimited,
      },
      imageGeneration: {
        daily: {
          used: dailyImageGenUsed,
          limit: planLimits.dailyImages || creditsConfig.freeUser.imageGeneration.freeQuotaPerDay || 0,
          isUnlimited: (planLimits.dailyImages || 0) === -1,
        },
        monthly: {
          used: monthlyImageGenUsed,
          limit: planLimits.images || creditsConfig.freeUser.imageGeneration.freeQuotaPerMonth || 0,
          isUnlimited: (planLimits.images || 0) === -1,
        },
      },
      videoGeneration: {
        daily: {
          used: dailyVideoGenUsed,
          limit: planLimits.dailyVideos || creditsConfig.freeUser.videoGeneration.freeQuotaPerDay || 0,
          isUnlimited: (planLimits.dailyVideos || 0) === -1,
        },
        monthly: {
          used: monthlyVideoGenUsed,
          limit: planLimits.videos || creditsConfig.freeUser.videoGeneration.freeQuotaPerMonth || 0,
          isUnlimited: (planLimits.videos || 0) === -1,
        },
      },
      imageExtraction: {
        daily: {
          used: dailyImageExtUsed,
          limit: creditsConfig.freeUser.imageToText.freeQuotaPerDay || 0,
          isUnlimited: false,
        },
        monthly: {
          used: monthlyImageExtUsed,
          limit: planLimits.extractions || creditsConfig.freeUser.imageToText.freeQuotaPerMonth || 0,
          isUnlimited: (planLimits.extractions || 0) === -1,
        },
      },
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error getting quota usage:', error);
    return NextResponse.json(
      {
        error: 'Failed to get quota usage',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

