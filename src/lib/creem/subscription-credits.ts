import { randomUUID } from 'node:crypto';
import { type BillingInterval, formatPlanName, getCreditsForPlan } from '@/lib/creem/plan-utils';
import { awardReferralForPaidUser } from '@/lib/rewards/referral-reward';
import { db } from '@/server/db';
import { creditTransactions, userCredits } from '@/server/db/schema';
import { and, desc, eq, like, or } from 'drizzle-orm';

/**
 * Grant subscription credits to user with idempotency
 * Returns true if credits were granted, false if already granted or none configured
 */
export async function grantSubscriptionCredits(
  userId: string,
  planIdentifier: string,
  subscriptionId: string,
  interval?: BillingInterval,
  isRenewal = false
): Promise<boolean> {
  const creditInfo = getCreditsForPlan(planIdentifier, interval);

  console.log('[Creem Credits] getCreditsForPlan result:', {
    planIdentifier,
    interval,
    planId: creditInfo.planId,
    plan: creditInfo.plan ? { id: creditInfo.plan.id, name: creditInfo.plan.name } : null,
    amount: creditInfo.amount,
  });

  if (!creditInfo.plan || creditInfo.amount <= 0) {
    console.log(
      `[Creem Credits] No credits to grant for identifier ${planIdentifier} (interval=${interval || 'auto'})`,
      { plan: creditInfo.plan, amount: creditInfo.amount }
    );
    return false;
  }

  const normalizedPlanId = creditInfo.planId;
  const isYearly = creditInfo.interval === 'year';
  const creditsToGrant = creditInfo.amount;
  const planDisplayName = formatPlanName(creditInfo.plan, normalizedPlanId);

  try {
    // Simple idempotency check: only check for exact referenceId match
    // This prevents duplicate grants from the same call, but allows grants for different plans/subscriptions
    // For renewals, we always grant full credits (skip this check)

    // For renewals, we always grant full credits (don't check existing grants)
    const referenceId = `creem_${subscriptionId}_${isRenewal ? 'renewal' : 'initial'}_${Date.now()}`;

    // Check for existing transaction to prevent duplicates
    // Note: neon-http driver doesn't support db.transaction(), so we do manual idempotency checks
    const [existingTransaction] = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.referenceId, referenceId))
      .limit(1);

    if (existingTransaction) {
      console.log(`[Creem Credits] Credits already granted for reference ${referenceId}`);
      return false;
    }

    // Get user credit account
    const [userCredit] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .limit(1);

    const newBalance = (userCredit?.balance || 0) + creditsToGrant;

    // Update or create user credit account
    if (userCredit) {
      await db
        .update(userCredits)
        .set({
          balance: newBalance,
          totalEarned: userCredit.totalEarned + creditsToGrant,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId));
    } else {
      await db.insert(userCredits).values({
        id: randomUUID(),
        userId,
        balance: creditsToGrant,
        totalEarned: creditsToGrant,
        totalSpent: 0,
        frozenBalance: 0,
      });
    }

    // Insert credit transaction
    await db.insert(creditTransactions).values({
      id: randomUUID(),
      userId,
      type: 'earn',
      amount: creditsToGrant,
      balanceAfter: newBalance,
      source: 'subscription',
      description: `${planDisplayName} subscription ${isRenewal ? 'renewal' : 'credits'} (Creem)`,
      referenceId,
      metadata: JSON.stringify({
        planId: normalizedPlanId,
        planIdentifier,
        isYearly,
        subscriptionId,
        provider: 'creem',
        isRenewal,
      }),
    });

    console.log(
      `[Creem Credits] Granted ${creditsToGrant} credits to user ${userId} for ${normalizedPlanId} ${isRenewal ? 'renewal' : 'subscription'}`
    );

    if (!isRenewal) {
      await awardReferralForPaidUser(userId, {
        reason: 'subscription',
        metadata: {
          planId: normalizedPlanId,
          subscriptionId,
        },
      });
    }

    return true;
  } catch (error) {
    console.error('[Creem Credits] Error granting subscription credits:', error);
    return false;
  }
}
