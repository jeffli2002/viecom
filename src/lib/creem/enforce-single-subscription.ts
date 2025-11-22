import { creemService } from '@/lib/creem/creem-service';
import type { PaymentRecord, PaymentStatus } from '@/payment/types';
import { paymentRepository } from '@/server/db/repositories/payment-repository';

const ACTIVE_SUBSCRIPTION_STATUSES: PaymentStatus[] = ['active', 'trialing', 'past_due'];

/**
 * Ensure a user has only one active Creem subscription.
 * Cancels duplicate subscriptions in Creem and updates our database record.
 */
export async function enforceSingleCreemSubscription(
  userId: string,
  keepSubscriptionId?: string
): Promise<number> {
  if (!userId) {
    return 0;
  }

  const activeSubs = await paymentRepository.findSubscriptionByUserAndStatus(
    userId,
    ACTIVE_SUBSCRIPTION_STATUSES
  );

  if (!activeSubs || activeSubs.length <= 1) {
    return 0;
  }

  const sortedSubs = [...activeSubs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  let keepSub: PaymentRecord | undefined;
  if (keepSubscriptionId) {
    keepSub = sortedSubs.find(
      (sub) => sub.subscriptionId === keepSubscriptionId || sub.id === keepSubscriptionId
    );
  }

  if (!keepSub) {
    keepSub = sortedSubs[0];
  }

  const duplicates = sortedSubs.filter((sub) => sub.id !== keepSub!.id);
  console.warn(
    `[Creem Enforcement] User ${userId} has ${activeSubs.length} active subscriptions. Keeping ${keepSub.subscriptionId || keepSub.id}, canceling ${duplicates.length}.`
  );

  for (const duplicate of duplicates) {
    if (duplicate.subscriptionId) {
      try {
        const cancelResult = await creemService.cancelSubscription(duplicate.subscriptionId);
        if (!cancelResult.success && !cancelResult.alreadyCancelled) {
          console.warn(
            `[Creem Enforcement] Failed to cancel Creem subscription ${duplicate.subscriptionId}: ${cancelResult.error}`
          );
        }
      } catch (error) {
        console.error(
          `[Creem Enforcement] Error canceling Creem subscription ${duplicate.subscriptionId}:`,
          error
        );
      }
    }

    await paymentRepository.update(duplicate.id, {
      status: 'canceled',
      cancelAtPeriodEnd: false,
    });
  }

  return duplicates.length;
}
