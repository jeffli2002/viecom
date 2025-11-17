import type { PaymentRecord } from '@/payment/types';
import { paymentRepository } from '@/server/db/repositories/payment-repository';

export interface SubscriptionInfo {
  hasActiveSubscription: boolean;
  subscriptionId?: string;
  planId?: string;
  status?: string;
  periodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  provider?: 'stripe' | 'creem';
}

export async function getCreemSubscriptionStatus(userId: string): Promise<SubscriptionInfo> {
  const subscription = await paymentRepository.findActiveSubscriptionByUserId(userId);

  if (!subscription || subscription.provider !== 'creem') {
    return {
      hasActiveSubscription: false,
    };
  }

  return {
    hasActiveSubscription: true,
    subscriptionId: subscription.subscriptionId,
    planId: subscription.priceId,
    status: subscription.status,
    periodEnd: subscription.periodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    provider: 'creem',
  };
}

export async function hasActiveCreemSubscription(userId: string): Promise<boolean> {
  const info = await getCreemSubscriptionStatus(userId);
  return info.hasActiveSubscription;
}

export async function getSubscriptionPlan(userId: string): Promise<string | null> {
  const subscription = await paymentRepository.findActiveSubscriptionByUserId(userId);

  if (!subscription || (subscription.provider !== 'creem' && subscription.provider !== 'stripe')) {
    return null;
  }

  return subscription.priceId;
}

export function isSubscriptionActive(subscription: PaymentRecord): boolean {
  if (!subscription) return false;

  const activeStatuses = ['active', 'trialing'];
  const isStatusActive = activeStatuses.includes(subscription.status);

  if (subscription.periodEnd) {
    const now = new Date();
    const isNotExpired = subscription.periodEnd > now;
    return isStatusActive && isNotExpired;
  }

  return isStatusActive;
}

export function willCancelAtPeriodEnd(subscription: PaymentRecord): boolean {
  return subscription?.cancelAtPeriodEnd === true;
}
