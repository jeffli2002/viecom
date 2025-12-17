/**
 * Grant credits and enable 2K/4K resolution access for a user by email
 * Note: 2K and 4K permissions are controlled by the same mechanism (hasCreditPack)
 * Usage: pnpm tsx scripts/grant-credits-and-4k-access.ts <email> <credits>
 * Example: pnpm tsx scripts/grant-credits-and-4k-access.ts 1931929980@qq.com 30
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
import { creditPackPurchase, creditTransactions, user, userCredits } from '@/server/db/schema';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(databaseUrl);
const db = drizzle(sql);

async function grantCreditsAnd2K4KAccess(email: string, amount: number) {
  try {
    console.log(`\n🔧 Granting ${amount} credits and 2K/4K resolution access to ${email}...\n`);
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
    console.log('   Source: admin\n');

    // Step 5: Check if user already has credit pack (for 4K access)
    const [existingCreditPack] = await db
      .select()
      .from(creditPackPurchase)
      .where(eq(creditPackPurchase.userId, userRecord.id))
      .limit(1);

    if (existingCreditPack) {
      console.log('ℹ️  User already has credit pack purchase record (2K/4K access already enabled)');
      console.log(`   Credit Pack ID: ${existingCreditPack.id}`);
    } else {
      // Step 6: Create credit pack purchase record to enable 2K/4K access
      // Note: This enables both 2K and 4K resolution access via hasCreditPack mechanism
      const creditPackId = randomUUID();
      const orderId = `admin_2k_4k_access_${Date.now()}`;

      await db.insert(creditPackPurchase).values({
        id: creditPackId,
        userId: userRecord.id,
        creditPackId: 'admin_2k_4k_access',
        credits: amount,
        amountCents: 0, // Free grant
        currency: 'USD',
        provider: 'creem',
        orderId,
        checkoutId: `admin_checkout_${Date.now()}`,
        creditTransactionId: transactionId,
        metadata: {
          grantedBy: 'admin_script',
          purpose: 'enable_2k_4k_resolution',
          email,
          timestamp: new Date().toISOString(),
        },
        testMode: false,
      });

      console.log('✅ 2K and 4K resolution access enabled!');
      console.log(`   Credit Pack Purchase ID: ${creditPackId}`);
      console.log(`   Order ID: ${orderId}`);
    }

    // Step 7: Verify final balance
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
    console.log('Summary:');
    console.log(`  - Credits granted: ${amount}`);
    console.log(`  - New balance: ${finalBalance}`);
    console.log(
      `  - 2K/4K resolution access: ${existingCreditPack ? 'Already enabled' : 'Enabled'}\n`
    );
  } catch (error) {
    console.error('❌ Error granting credits and 2K/4K access:', error);
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
  console.error('Usage: pnpm tsx scripts/grant-credits-and-4k-access.ts <email> <amount>');
  console.error('Example: pnpm tsx scripts/grant-credits-and-4k-access.ts 1931929980@qq.com 30');
  console.error('Note: This script enables both 2K and 4K resolution access');
  process.exit(1);
}

if (!amountArg) {
  console.error('❌ Amount is required.');
  console.error('Usage: pnpm tsx scripts/grant-credits-and-4k-access.ts <email> <amount>');
  console.error('Example: pnpm tsx scripts/grant-credits-and-4k-access.ts 1931929980@qq.com 30');
  console.error('Note: This script enables both 2K and 4K resolution access');
  process.exit(1);
}

const amount = Number.parseInt(amountArg, 10);

if (Number.isNaN(amount) || amount <= 0) {
  console.error('❌ Invalid amount. Please provide a positive number.');
  process.exit(1);
}

grantCreditsAnd2K4KAccess(email, amount)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
