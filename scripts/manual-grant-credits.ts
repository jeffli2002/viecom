import { randomUUID } from 'node:crypto';
import { db } from '@/server/db';
import { creditTransactions, userCredits } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Manual credit grant script for failed webhook
 * Usage: pnpm tsx scripts/manual-grant-credits.ts <userId> <credits> <description> <orderId>
 */

async function manualGrantCredits(
  userId: string,
  credits: number,
  description: string,
  orderId?: string
) {
  console.log('Starting manual credit grant...', { userId, credits, description, orderId });

  const referenceId = `manual_credit_grant_${orderId || randomUUID()}_${Date.now()}`;

  const [userCredit] = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userId))
    .limit(1);

  if (!userCredit) {
    // Create credit account with purchased credits
    const now = new Date();
    await db.insert(userCredits).values({
      id: randomUUID(),
      userId,
      balance: credits,
      totalEarned: credits,
      totalSpent: 0,
      frozenBalance: 0,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(creditTransactions).values({
      id: randomUUID(),
      userId,
      type: 'earn',
      amount: credits,
      balanceAfter: credits,
      source: 'purchase',
      description,
      referenceId,
      metadata: JSON.stringify({
        provider: 'creem',
        orderId,
        credits,
        manualGrant: true,
        reason: 'Webhook failed to process credit pack purchase',
      }),
    });

    console.log(`Created credit account for ${userId} with ${credits} credits`);
  } else {
    // Add credits to existing account
    const newBalance = userCredit.balance + credits;

    await db
      .update(userCredits)
      .set({
        balance: newBalance,
        totalEarned: userCredit.totalEarned + credits,
        updatedAt: new Date(),
      })
      .where(eq(userCredits.userId, userId));

    await db.insert(creditTransactions).values({
      id: randomUUID(),
      userId,
      type: 'earn',
      amount: credits,
      balanceAfter: newBalance,
      source: 'purchase',
      description,
      referenceId,
      metadata: JSON.stringify({
        provider: 'creem',
        orderId,
        credits,
        manualGrant: true,
        reason: 'Webhook failed to process credit pack purchase',
      }),
    });

    console.log(
      `Granted ${credits} credits to ${userId} (old balance: ${userCredit.balance}, new balance: ${newBalance})`
    );
  }

  console.log('✅ Manual credit grant completed successfully');
}

// Get args from command line
const userId = process.argv[2];
const credits = Number.parseInt(process.argv[3], 10);
const description = process.argv[4] || 'Manual credit grant';
const orderId = process.argv[5];

if (!userId || !credits || Number.isNaN(credits)) {
  console.error(
    'Usage: pnpm tsx scripts/manual-grant-credits.ts <userId> <credits> <description> [orderId]'
  );
  console.error(
    'Example: pnpm tsx scripts/manual-grant-credits.ts myZwkau1DoG2GXcibytBYmmwRXX8Mw6L 1000 "Credit pack purchase: 1000 credits" ord_qBvIAixMvcjpUgk25ca6l'
  );
  process.exit(1);
}

manualGrantCredits(userId, credits, description, orderId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error granting credits:', error);
    process.exit(1);
  });
