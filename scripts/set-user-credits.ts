/**
 * Set user credits to a specific amount
 * Usage: pnpm tsx scripts/set-user-credits.ts <email> <credits>
 * Example: pnpm tsx scripts/set-user-credits.ts jefflee2002@gmail.com 2
 */

import { resolve } from 'node:path';
import { config } from 'dotenv';

// Load .env.local file FIRST
config({ path: resolve(process.cwd(), '.env.local') });

// Set SKIP_ENV_VALIDATION to avoid env.ts validation when importing modules
process.env.SKIP_ENV_VALIDATION = 'true';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Please check your .env.local file.');
  process.exit(1);
}

import { randomUUID } from 'node:crypto';
import { creditTransactions, user, userCredits } from '@/server/db/schema';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(databaseUrl);
const db = drizzle(sql);

async function setUserCredits(email: string, credits: number) {
  try {
    console.log(`\n🔧 Setting ${email} credits to ${credits}...\n`);
    console.log('='.repeat(80));

    // Step 1: Find user by email
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
    console.log(`   Name: ${userRecord.name || 'N/A'}\n`);

    // Step 2: Get current credit balance
    const [currentCredits] = await db
      .select({
        balance: userCredits.balance,
        totalEarned: userCredits.totalEarned,
        totalSpent: userCredits.totalSpent,
      })
      .from(userCredits)
      .where(eq(userCredits.userId, userRecord.id))
      .limit(1);

    const currentBalance = currentCredits?.balance || 0;
    const delta = credits - currentBalance;

    console.log(`   Current balance: ${currentBalance}`);
    console.log(`   Target balance: ${credits}`);
    console.log(`   Change: ${delta > 0 ? '+' : ''}${delta}\n`);

    // Step 3: Update or create credit account
    const now = new Date();
    if (currentCredits) {
      await db
        .update(userCredits)
        .set({
          balance: credits,
          updatedAt: now,
        })
        .where(eq(userCredits.userId, userRecord.id));
    } else {
      await db.insert(userCredits).values({
        id: randomUUID(),
        userId: userRecord.id,
        balance: credits,
        totalEarned: credits,
        totalSpent: 0,
        frozenBalance: 0,
      });
    }

    // Step 4: Create transaction record if balance changed
    if (delta !== 0) {
      const transactionId = randomUUID();
      const referenceId = `admin_set_credits_${Date.now()}`;
      const transactionType = delta > 0 ? 'earn' : 'admin_adjust';
      const metadata = {
        previousBalance: currentBalance,
        newBalance: credits,
        reason: 'manual_set',
        setBy: 'admin_script',
        email,
        timestamp: now.toISOString(),
      };

      await db.insert(creditTransactions).values({
        id: transactionId,
        userId: userRecord.id,
        type: transactionType,
        amount: delta,
        balanceAfter: credits,
        source: 'admin',
        description: `Manual credit set (${credits} credits)`,
        referenceId,
        metadata: JSON.stringify(metadata),
      });

      console.log('✅ Credits updated successfully!');
      console.log(`   Transaction ID: ${transactionId}`);
      console.log(`   Transaction type: ${transactionType}`);
      console.log(`   Amount: ${delta > 0 ? '+' : ''}${delta}`);
    } else {
      console.log('✅ Credits already at target amount (no change needed)');
    }

    // Step 5: Verify final balance
    const [finalCredits] = await db
      .select({ balance: userCredits.balance })
      .from(userCredits)
      .where(eq(userCredits.userId, userRecord.id))
      .limit(1);

    const finalBalance = finalCredits?.balance || 0;
    console.log('\n📊 Verification:');
    console.log(`   Final balance: ${finalBalance}`);

    if (finalBalance === credits) {
      console.log('   ✅ Balance matches target value');
    } else {
      console.log(`   ⚠️  Warning: Balance mismatch (expected: ${credits})`);
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ Process completed!\n');
  } catch (error) {
    console.error('❌ Error setting credits:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
    process.exit(1);
  }
}

// Parse command line arguments
const email = process.argv[2];
const creditsArg = process.argv[3];

if (!email) {
  console.error('❌ Email is required.');
  console.error('Usage: pnpm tsx scripts/set-user-credits.ts <email> <credits>');
  console.error('Example: pnpm tsx scripts/set-user-credits.ts jefflee2002@gmail.com 2');
  process.exit(1);
}

if (!creditsArg) {
  console.error('❌ Credits amount is required.');
  console.error('Usage: pnpm tsx scripts/set-user-credits.ts <email> <credits>');
  console.error('Example: pnpm tsx scripts/set-user-credits.ts jefflee2002@gmail.com 2');
  process.exit(1);
}

const credits = Number.parseInt(creditsArg, 10);

if (Number.isNaN(credits) || credits < 0) {
  console.error('❌ Invalid credits amount. Please provide a non-negative number.');
  process.exit(1);
}

setUserCredits(email, credits)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

