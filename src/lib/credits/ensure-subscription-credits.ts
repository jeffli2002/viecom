import { creditService } from '@/lib/credits';
import { getCreditsForPlan } from '@/lib/creem/plan-utils';
import { db } from '@/server/db';
import { paymentRepository } from '@/server/db/repositories/payment-repository';
import { creditTransactions } from '@/server/db/schema';
import { and, eq, like } from 'drizzle-orm';

/**
 * Ensure a user has received their initial subscription credits.
 * Returns true if a grant was made, false otherwise.
 */
export async function ensureSubscriptionCredits(userId: string): Promise<boolean> {
  try {
    const subscription = await paymentRepository.findActiveSubscriptionByUserId(userId);
    if (!subscription) {
      return false;
    }

    const subscriptionKey = subscription.subscriptionId || subscription.id;
    if (!subscriptionKey) {
      return false;
    }

    const now = Date.now();
    const startTime =
      subscription.periodStart?.getTime() || subscription.createdAt?.getTime() || now;
    const subscriptionAgeMs = now - startTime;

    // Give the normal sync/webhook flow time to grant credits before fallback runs
    if (subscriptionAgeMs < 2 * 60 * 1000) {
      return false;
    }

    const interval = subscription.interval === 'year' ? 'year' : 'month';
    const creditInfo = getCreditsForPlan(subscription.priceId, interval);

    if (!creditInfo.plan || creditInfo.amount <= 0) {
      return false;
    }

    const existingForSubscription = await db
      .select({ amount: creditTransactions.amount })
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.userId, userId),
          eq(creditTransactions.source, 'subscription'),
          like(creditTransactions.referenceId, `creem_${subscriptionKey}_%`)
        )
      );

    const grantedAmount = existingForSubscription.reduce((sum, txn) => sum + (txn.amount || 0), 0);

    if (grantedAmount >= creditInfo.amount) {
      return false;
    }

    const amountToGrant = creditInfo.amount - grantedAmount;

    await creditService.earnCredits({
      userId,
      amount: amountToGrant,
      source: 'subscription',
      description: `${creditInfo.plan.name} subscription credits`,
      referenceId: `auto_grant_${subscription.subscriptionId || subscription.id}_${Date.now()}`,
      metadata: {
        planId: creditInfo.planId,
        interval,
        provider: subscription.provider,
        reason: 'auto_grant_missing_subscription_credits',
      },
    });

    return true;
  } catch (error) {
    console.error('[Credits] Failed to ensure subscription credits:', error);
    return false;
  }
}
