import { creditsConfig } from '@/config/credits.config';
import { creditService } from '@/lib/credits';
import { db } from '@/server/db';
import { creditTransactions, userReferrals } from '@/server/db/schema';
import { and, eq, or } from 'drizzle-orm';

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
      // This appears to be the first generation, award credits
      const creditsToAward = creditsConfig.rewards.referral.creditsPerReferral;
      const referenceId = `referral_${referralRecord.id}_${Date.now()}`;

      // Award credits to referrer and mark referral as completed in a transaction
      await db.transaction(async (tx) => {
        // Award credits to referrer
        await creditService.earnCredits({
          userId: referralRecord.referrerId,
          amount: creditsToAward,
          source: 'referral',
          description: 'Referral reward - User completed first generation',
          referenceId,
          metadata: {
            referralId: referralRecord.id,
            referredUserId: referralRecord.referredId,
            referralCode: referralRecord.referralCode,
          },
        });

        // Mark referral as completed and credits as awarded
        await tx
          .update(userReferrals)
          .set({
            referredUserFirstGenerationCompleted: true,
            creditsAwarded: true,
            creditsAwardedAt: new Date(),
          })
          .where(eq(userReferrals.id, referralRecord.id));
      });

      console.log(
        `✅ Awarded ${creditsToAward} referral credits to user ${referralRecord.referrerId} for referral ${referralRecord.id}`
      );
    }
  } catch (error) {
    // Don't throw - referral reward failure shouldn't break generation
    console.error('Error awarding referral reward:', error);
  }
}
