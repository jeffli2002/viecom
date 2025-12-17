/**
 * Release frozen credits for a user by email.
 * Usage:
 *   pnpm tsx scripts/unfreeze-user-credits.ts <email> [amount]
 * Examples:
 *   pnpm tsx scripts/unfreeze-user-credits.ts user@example.com
 *   pnpm tsx scripts/unfreeze-user-credits.ts user@example.com 200
 */

import { resolve } from 'node:path';
import { config } from 'dotenv';

// Load environment variables (prefers .env.local)
config({ path: resolve(process.cwd(), '.env.local') });

// Skip env.ts validation when importing server modules
process.env.SKIP_ENV_VALIDATION = 'true';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Please configure your .env.local file.');
  process.exit(1);
}

import { randomUUID } from 'node:crypto';
import { creditTransactions, user, userCredits } from '@/server/db/schema';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(databaseUrl);
const db = drizzle(sql);

async function unfreezeUserCredits(email: string, amountOverride?: number) {
  try {
    console.log(`\n🔧 Releasing frozen credits for ${email}...\n${'='.repeat(80)}`);

    // 1. Find user by email
    const [userRecord] = await db
      .select({ id: user.id, email: user.email, name: user.name })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!userRecord) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${userRecord.email} (ID: ${userRecord.id})`);
    console.log(`   Name: ${userRecord.name || 'N/A'}`);

    // 2. Fetch credit account
    const [credits] = await db
      .select({
        balance: userCredits.balance,
        frozenBalance: userCredits.frozenBalance,
      })
      .from(userCredits)
      .where(eq(userCredits.userId, userRecord.id))
      .limit(1);

    if (!credits) {
      console.error('❌ Credit account not found. Cannot unfreeze credits.');
      process.exit(1);
    }

    console.log(`   Current balance: ${credits.balance}`);
    console.log(`   Current frozen balance: ${credits.frozenBalance}`);

    if (credits.frozenBalance <= 0) {
      console.log('\nℹ️ No frozen credits to release.\n');
      return;
    }

    let amountToUnfreeze = credits.frozenBalance;

    if (typeof amountOverride === 'number') {
      if (amountOverride <= 0) {
        console.error('❌ Amount to unfreeze must be positive.');
        process.exit(1);
      }

      if (amountOverride > credits.frozenBalance) {
        console.error(
          `❌ Amount exceeds frozen balance. Frozen: ${credits.frozenBalance}, requested: ${amountOverride}`
        );
        process.exit(1);
      }

      amountToUnfreeze = amountOverride;
    }

    console.log(`\n➡️ Unfreezing ${amountToUnfreeze} credits...`);

    const newFrozenBalance = credits.frozenBalance - amountToUnfreeze;
    const now = new Date();

    await db
      .update(userCredits)
      .set({
        frozenBalance: newFrozenBalance,
        updatedAt: now,
      })
      .where(eq(userCredits.userId, userRecord.id));

    const transactionId = randomUUID();
    const referenceId = `manual_unfreeze_${Date.now()}`;
    const metadata = {
      reason: 'manual_unfreeze',
      releasedBy: 'admin_script',
      email,
      timestamp: now.toISOString(),
      previousFrozenBalance: credits.frozenBalance,
      amountUnfrozen: amountToUnfreeze,
    };

    await db.insert(creditTransactions).values({
      id: transactionId,
      userId: userRecord.id,
      type: 'unfreeze',
      amount: amountToUnfreeze,
      balanceAfter: credits.balance,
      source: 'admin',
      description: `Manual unfreeze (${amountToUnfreeze} credits)`,
      referenceId,
      metadata: JSON.stringify(metadata),
    });

    console.log('✅ Credits unfrozen successfully!');
    console.log(`   Transaction ID: ${transactionId}`);
    console.log(`   Remaining frozen balance: ${newFrozenBalance}`);

    console.log(`\n${'='.repeat(80)}\n`);
  } catch (error) {
    console.error('❌ Error while releasing frozen credits:', error);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

const email = process.argv[2];
const amountArg = process.argv[3];

if (!email) {
  console.error('Usage: pnpm tsx scripts/unfreeze-user-credits.ts <email> [amount]');
  process.exit(1);
}

let amount: number | undefined;

if (amountArg) {
  const parsedAmount = Number.parseInt(amountArg, 10);
  if (Number.isNaN(parsedAmount)) {
    console.error('❌ Invalid amount. Please provide a number.');
    process.exit(1);
  }
  amount = parsedAmount;
}

unfreezeUserCredits(email, amount)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
