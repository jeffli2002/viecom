import { normalizeCreemStatus } from '@/lib/creem/status-utils';
import { creemService } from '@/lib/creem/creem-service';
import { paymentRepository } from '@/server/db/repositories/payment-repository';

const ACTIVE_STATUSES = new Set(['active', 'trialing', 'past_due']);

const normalizeInterval = (value?: string | null): 'month' | 'year' | undefined => {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  if (lower.includes('year') || lower === 'annual' || lower === 'annually') {
    return 'year';
  }
  if (lower.includes('month') || lower === 'monthly') {
    return 'month';
  }
  return undefined;
};

/**
 * When no active subscription exists locally, try to recover it from Creem.
 * Looks at recent Creem payment rows, fetches their remote status, and updates the DB.
 */
export async function resyncActiveCreemSubscription(userId: string) {
  const candidates = await paymentRepository.findByUserId(userId);
  if (candidates.length === 0) {
    return null;
  }

  const maxChecks = Math.min(candidates.length, 5);

  for (let i = 0; i < maxChecks; i += 1) {
    const record = candidates[i];
    if (record.provider !== 'creem' || !record.subscriptionId) {
      continue;
    }

    try {
      const remote = await creemService.getSubscription(record.subscriptionId);
      if (!remote.success || !remote.subscription) {
        continue;
      }

      const remoteSubscription = remote.subscription as Record<string, any>;
      const normalizedStatus = normalizeCreemStatus(remoteSubscription.status);
      if (!normalizedStatus || !ACTIVE_STATUSES.has(normalizedStatus)) {
        continue;
      }

      const productInfo =
        (remoteSubscription.product as { billing_period?: string } | undefined) || undefined;
      const interval =
        normalizeInterval(remoteSubscription.interval) ||
        normalizeInterval(remoteSubscription.billing_period) ||
        normalizeInterval(productInfo?.billing_period) ||
        record.interval ||
        'month';

      await paymentRepository.update(record.id, {
        status: normalizedStatus,
        interval,
        periodStart: remoteSubscription.current_period_start_date
          ? new Date(remoteSubscription.current_period_start_date)
          : record.periodStart,
        periodEnd: remoteSubscription.current_period_end_date
          ? new Date(remoteSubscription.current_period_end_date)
          : record.periodEnd,
        cancelAtPeriodEnd: Boolean(remoteSubscription.cancel_at_period_end),
      });

      return paymentRepository.findActiveSubscriptionByUserId(userId);
    } catch (error) {
      console.error('[Subscription Sync] Failed to resync subscription from Creem:', {
        userId,
        subscriptionId: record.subscriptionId,
        error,
      });
    }
  }

  return null;
}
