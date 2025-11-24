/**
 * Grant credits to a user by email
 * Usage: pnpm tsx scripts/grant-credits.ts <email> <amount>
 * Example: pnpm tsx scripts/grant-credits.ts jefflee2002@gmail.com 500
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

async function grantCredits(email: string, amount: number) {
  try {
    console.log(`\n🔧 Granting ${amount} credits to ${email}...\n`);
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
      .select({ balance: userCredits.balance, totalEarned: userCredits.totalEarned })
      .from(userCredits)
      .where(eq(userCredits.userId, userRecord.id))
      .limit(1);

    const currentBalance = currentCredits?.balance || 0;
    const currentTotalEarned = currentCredits?.totalEarned || 0;
    const newBalance = currentBalance + amount;
    const newTotalEarned = currentTotalEarned + amount;

    console.log(`   Current balance: ${currentBalance}`);
    console.log(`   Amount to grant: ${amount}`);
    console.log(`   New balance will be: ${newBalance}\n`);

    // Step 3: Update or create credit account
    if (currentCredits) {
      await db
        .update(userCredits)
        .set({
          balance: newBalance,
          totalEarned: newTotalEarned,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userRecord.id));
    } else {
      await db.insert(userCredits).values({
        id: randomUUID(),
        userId: userRecord.id,
        balance: amount,
        totalEarned: amount,
        totalSpent: 0,
        frozenBalance: 0,
      });
    }

    // Step 4: Create transaction record
    const transactionId = randomUUID();
    const referenceId = `admin_grant_${Date.now()}`;
    const metadata = {
      grantedBy: 'admin_script',
      email,
      timestamp: new Date().toISOString(),
    };

    await db.insert(creditTransactions).values({
      id: transactionId,
      userId: userRecord.id,
      type: 'earn',
      amount,
      balanceAfter: newBalance,
      source: 'admin',
      description: `Manual credit grant (${amount} credits)`,
      referenceId,
      metadata: JSON.stringify(metadata),
    });

    console.log('✅ Credits granted successfully!');
    console.log(`   Transaction ID: ${transactionId}`);
    console.log(`   New balance: ${newBalance}`);
    console.log('   Transaction type: earn');
    console.log('   Source: admin');

    // Step 5: Verify final balance
    const [finalCredits] = await db
      .select({ balance: userCredits.balance })
      .from(userCredits)
      .where(eq(userCredits.userId, userRecord.id))
      .limit(1);

    const finalBalance = finalCredits?.balance || 0;
    console.log('\n📊 Verification:');
    console.log(`   Final balance: ${finalBalance}`);

    if (finalBalance === newBalance) {
      console.log('   ✅ Balance matches expected value');
    } else {
      console.log(`   ⚠️  Warning: Balance mismatch (expected: ${newBalance})`);
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ Process completed!\n');
  } catch (error) {
    console.error('❌ Error granting credits:', error);
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
const amountArg = process.argv[3];

if (!email) {
  console.error('❌ Email is required.');
  console.error('Usage: pnpm tsx scripts/grant-credits.ts <email> <amount>');
  console.error('Example: pnpm tsx scripts/grant-credits.ts jefflee2002@gmail.com 500');
  process.exit(1);
}

if (!amountArg) {
  console.error('❌ Amount is required.');
  console.error('Usage: pnpm tsx scripts/grant-credits.ts <email> <amount>');
  console.error('Example: pnpm tsx scripts/grant-credits.ts jefflee2002@gmail.com 500');
  process.exit(1);
}

const amount = Number.parseInt(amountArg, 10);

if (Number.isNaN(amount) || amount <= 0) {
  console.error('❌ Invalid amount. Please provide a positive number.');
  process.exit(1);
}

grantCredits(email, amount)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
