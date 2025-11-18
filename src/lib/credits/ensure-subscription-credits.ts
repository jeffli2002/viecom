import { creditService } from '@/lib/credits';
import { getCreditsForPlan } from '@/lib/creem/plan-utils';
import { db } from '@/server/db';
import { paymentRepository } from '@/server/db/repositories/payment-repository';
import { creditTransactions } from '@/server/db/schema';
import { and, desc, eq, like, or } from 'drizzle-orm';

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

    // Check for existing grants from both creem webhooks and auto_grant fallback
    // This prevents duplicate grants when the function is called multiple times
    const existingForSubscription = await db
      .select({ amount: creditTransactions.amount })
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.userId, userId),
          eq(creditTransactions.source, 'subscription'),
          or(
            like(creditTransactions.referenceId, `creem_${subscriptionKey}_%`),
            like(creditTransactions.referenceId, `auto_grant_${subscriptionKey}_%`)
          )
        )
      );

    const grantedAmount = existingForSubscription.reduce((sum, txn) => sum + (txn.amount || 0), 0);

    // If already granted full amount for this subscription period, don't grant again
    if (grantedAmount >= creditInfo.amount) {
      console.log(
        `[Credits] Subscription credits already granted for user ${userId}, subscription ${subscriptionKey}. Granted: ${grantedAmount}, Expected: ${creditInfo.amount}`
      );
      return false;
    }

    // Additional safety check: if we've granted credits recently (within last 5 minutes),
    // don't grant again to prevent rapid repeated calls
    const recentGrants = await db
      .select({ createdAt: creditTransactions.createdAt })
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.userId, userId),
          eq(creditTransactions.source, 'subscription'),
          or(
            like(creditTransactions.referenceId, `creem_${subscriptionKey}_%`),
            like(creditTransactions.referenceId, `auto_grant_${subscriptionKey}_%`)
          )
        )
      )
      .orderBy(desc(creditTransactions.createdAt))
      .limit(1);

    if (recentGrants.length > 0) {
      const lastGrantTime = recentGrants[0].createdAt?.getTime() || 0;
      const timeSinceLastGrant = now - lastGrantTime;
      // If granted within last 5 minutes, don't grant again
      if (timeSinceLastGrant < 5 * 60 * 1000) {
        console.log(
          `[Credits] Recent grant detected for user ${userId}, subscription ${subscriptionKey}. Time since last grant: ${Math.round(timeSinceLastGrant / 1000)}s. Skipping.`
        );
        return false;
      }
    }

    const amountToGrant = creditInfo.amount - grantedAmount;

    console.log(
      `[Credits] Granting ${amountToGrant} credits to user ${userId} for subscription ${subscriptionKey} (plan: ${creditInfo.plan.name}, total expected: ${creditInfo.amount}, already granted: ${grantedAmount})`
    );

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
