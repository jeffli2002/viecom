'use server';

import { auth } from '@/lib/auth/auth';
import type { PaymentRecord } from '@/payment/types';
import { paymentRepository } from '@/server/db/repositories/payment-repository';
import { headers } from 'next/headers';

export interface BillingInfo {
  activeSubscription?: PaymentRecord;
  paymentHistory: PaymentRecord[];
}

export async function getBillingInfo(): Promise<{
  success: boolean;
  data?: BillingInfo;
  error?: string;
}> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: Object.fromEntries(headersList.entries()),
    });

    if (!session?.user) {
      return {
        success: false,
        error: 'Please login first',
      };
    }

    console.log(`[getBillingInfo] Getting billing info for user: ${session.user.id}`);

    // 获取用户的活跃订阅
    const activeSubscription = await paymentRepository.findActiveSubscriptionByUserId(
      session.user.id
    );

    console.log(
      '[getBillingInfo] Active subscription:',
      activeSubscription
        ? {
            priceId: activeSubscription.priceId,
            interval: activeSubscription.interval,
            status: activeSubscription.status,
            cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
          }
        : null
    );

    // 获取用户的支付历史
    const paymentHistory = await paymentRepository.findByUserId(session.user.id);

    console.log(`[getBillingInfo] Payment history count: ${paymentHistory.length}`);

    return {
      success: true,
      data: {
        activeSubscription: activeSubscription || undefined,
        paymentHistory,
      },
    };
  } catch (error) {
    console.error('[getBillingInfo] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get billing info',
    };
  }
}

export async function getUserSubscription(): Promise<{
  success: boolean;
  data?: PaymentRecord | null;
  error?: string;
}> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: Object.fromEntries(headersList.entries()),
    });

    if (!session?.user) {
      return {
        success: false,
        error: 'Please login first',
      };
    }

    const subscription = await paymentRepository.findActiveSubscriptionByUserId(session.user.id);

    return {
      success: true,
      data: subscription,
    };
  } catch (error) {
    console.error('[getUserSubscription] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user subscription',
    };
  }
}


