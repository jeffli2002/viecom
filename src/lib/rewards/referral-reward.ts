import { creditsConfig } from '@/config/credits.config';
import { creditService } from '@/lib/credits';
import { db } from '@/server/db';
import { creditTransactions, userReferrals } from '@/server/db/schema';
import { and, eq } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

type ReferralRecord = InferSelectModel<typeof userReferrals>;
type ReferralUpdate = Partial<InferInsertModel<typeof userReferrals>>;

interface FinalizeReferralOptions {
  reason: 'first_generation' | 'subscription' | 'credit_pack' | 'paid';
  description: string;
  metadata?: Record<string, unknown>;
  updateFields?: ReferralUpdate;
}

async function finalizeReferralReward(
  referralRecord: ReferralRecord,
  options: FinalizeReferralOptions
): Promise<void> {
  const creditsToAward = creditsConfig.rewards.referral.creditsPerReferral;
  const referenceId = `${options.reason}_${referralRecord.id}_${Date.now()}`;

  await db.transaction(async (tx) => {
    await creditService.earnCredits({
      userId: referralRecord.referrerId,
      amount: creditsToAward,
      source: 'referral',
      description: options.description,
      referenceId,
      metadata: {
        referralId: referralRecord.id,
        referredUserId: referralRecord.referredId,
        referralCode: referralRecord.referralCode,
        trigger: options.reason,
        ...(options.metadata || {}),
      },
    });

    const referralUpdate: ReferralUpdate = {
      ...options.updateFields,
      creditsAwarded: true,
      creditsAwardedAt: new Date(),
      referredUserFirstGenerationCompleted:
        options.updateFields?.referredUserFirstGenerationCompleted ??
        referralRecord.referredUserFirstGenerationCompleted,
    };

    await tx
      .update(userReferrals)
      .set(referralUpdate)
      .where(eq(userReferrals.id, referralRecord.id));
  });

  console.log(
    `✅ Awarded ${creditsToAward} referral credits to user ${referralRecord.referrerId} for referral ${referralRecord.id} (${options.reason})`
  );
}

/**
 * Check if this is the user's first successful generation and award referral credits
 * This should be called after a successful image or video generation
 */
export async function checkAndAwardReferralReward(userId: string): Promise<void> {
  try {
    // Check if user has a referral record
    const referral = await db
      .select()
      .from(userReferrals)
      .where(eq(userReferrals.referredId, userId))
      .limit(1);

    if (referral.length === 0) {
      // No referral record, nothing to do
      return;
    }

    const referralRecord = referral[0];
    if (!referralRecord) {
      return;
    }

    // Check if credits have already been awarded
    if (referralRecord.creditsAwarded) {
      return;
    }

    // Check if user has completed any generation before (by checking credit transactions)
    // Look for any 'spend' transactions with source 'api_call' (image/video generation)
    const previousGenerations = await db
      .select()
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.userId, userId),
          eq(creditTransactions.type, 'spend'),
          eq(creditTransactions.source, 'api_call')
        )
      )
      .limit(1);

    // If this is the first generation (only 1 transaction - the current one), award referral credits
    // We check if there's only the current transaction or none before awarding
    // Note: The current transaction might not be committed yet, so we check if there are 0 or 1 transactions
    // If there's already more than 1, it means this is not the first generation
    if (previousGenerations.length <= 1) {
      await finalizeReferralReward(referralRecord, {
        reason: 'first_generation',
        description: 'Referral reward - User completed first generation',
        metadata: { stage: 'first_generation' },
        updateFields: { referredUserFirstGenerationCompleted: true },
      });
    }
  } catch (error) {
    // Don't throw - referral reward failure shouldn't break generation
    console.error('Error awarding referral reward:', error);
  }
}

/**
 * Award referral credits when the invited user becomes a paying customer
 * (subscription activation or credit pack purchase)
 */
export async function awardReferralForPaidUser(
  userId: string,
  options?: {
    reason?: 'subscription' | 'credit_pack';
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const referral = await db
      .select()
      .from(userReferrals)
      .where(eq(userReferrals.referredId, userId))
      .limit(1);

    if (referral.length === 0) {
      return;
    }

    const referralRecord = referral[0];
    if (!referralRecord) {
      return;
    }

    if (referralRecord.creditsAwarded) {
      return;
    }

    await finalizeReferralReward(referralRecord, {
      reason: options?.reason ?? 'paid',
      description:
        options?.reason === 'credit_pack'
          ? 'Referral reward - Invited user purchased a credit pack'
          : 'Referral reward - Invited user became a paid subscriber',
      metadata: {
        rewardReason: options?.reason ?? 'paid',
        ...(options?.metadata || {}),
      },
    });
  } catch (error) {
    console.error('Error awarding referral reward for paid user:', error);
  }
}
