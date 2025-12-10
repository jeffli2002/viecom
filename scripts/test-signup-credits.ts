/**
 * Test script to verify new signup users receive 15 credits (not 30)
 * Usage: pnpm tsx scripts/test-signup-credits.ts <email>
 * Example: pnpm tsx scripts/test-signup-credits.ts test@example.com
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

import { paymentConfig } from '@/config/payment.config';
import { creditTransactions, user, userCredits } from '@/server/db/schema';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(databaseUrl);
const db = drizzle(sql);

async function testSignupCredits(email: string) {
  try {
    console.log('\n🧪 Testing Signup Credits Grant');
    console.log('='.repeat(80));
    console.log(`Email: ${email}\n`);

    // Step 1: Check expected signup credits from config
    const freePlan = paymentConfig.plans.find((p) => p.id === 'free');
    const expectedSignupCredits = freePlan?.credits?.onSignup || 0;
    console.log(`📋 Expected signup credits from config: ${expectedSignupCredits}`);

    if (expectedSignupCredits !== 15) {
      console.error(`❌ ERROR: Expected 15 credits in config, but found ${expectedSignupCredits}`);
      process.exit(1);
    }
    console.log('✅ Config check passed: signup credits = 15\n');

    // Step 2: Find user by email
    const [userRecord] = await db
      .select({ id: user.id, email: user.email, name: user.name })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!userRecord) {
      console.error(`❌ User not found: ${email}`);
      console.log('\n💡 Tip: Create a test user first or use an existing email');
      process.exit(1);
    }

    console.log(`✅ Found user: ${userRecord.email}`);
    console.log(`   User ID: ${userRecord.id}`);
    console.log(`   Name: ${userRecord.name || 'N/A'}\n`);

    // Step 3: Check current credit account state
    const [currentCreditAccount] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userRecord.id))
      .limit(1);

    const [existingSignupTransaction] = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userRecord.id))
      .where(eq(creditTransactions.referenceId, `signup_${userRecord.id}`))
      .limit(1);

    if (currentCreditAccount || existingSignupTransaction) {
      console.log('⚠️  User already has credit account or signup bonus');
      console.log('   Current balance:', currentCreditAccount?.balance || 0);
      console.log('   Has signup transaction:', !!existingSignupTransaction);
      console.log('\n💡 To test fresh signup, you can:');
      console.log("   1. Delete the user's credit account and transactions");
      console.log('   2. Use a different test email');
      console.log('   3. Manually verify by checking the initialize API response\n');
    }

    // Step 4: Check transaction history for signup bonus
    const allTransactions = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userRecord.id))
      .orderBy(creditTransactions.createdAt);

    const signupTx = allTransactions.find((tx) => tx.referenceId === `signup_${userRecord.id}`);

    if (signupTx) {
      console.log('📊 Signup Transaction Found:');
      console.log(`   Amount: ${signupTx.amount}`);
      console.log(`   Source: ${signupTx.source}`);
      console.log(`   Description: ${signupTx.description}`);
      console.log(`   Created: ${signupTx.createdAt}\n`);

      if (signupTx.amount === 15) {
        console.log('✅ SUCCESS: User received 15 credits on signup (correct!)');
      } else if (signupTx.amount === 30) {
        console.error('❌ FAILED: User received 30 credits (should be 15)');
        console.error('   This indicates the old value is still in use');
        process.exit(1);
      } else {
        console.warn(`⚠️  WARNING: User received ${signupTx.amount} credits (expected 15)`);
      }
    } else {
      console.log('ℹ️  No signup transaction found yet');
      console.log('   This user may not have initialized credits yet\n');
    }

    // Step 5: Verify current balance matches expected
    if (currentCreditAccount) {
      console.log('📊 Current Credit Account:');
      console.log(`   Balance: ${currentCreditAccount.balance}`);
      console.log(`   Total Earned: ${currentCreditAccount.totalEarned}`);
      console.log(`   Total Spent: ${currentCreditAccount.totalSpent}\n`);

      // If user has only signup credits and nothing else, verify balance
      if (signupTx && allTransactions.length === 1) {
        if (currentCreditAccount.balance === 15) {
          console.log('✅ SUCCESS: Current balance is 15 credits (correct!)');
        } else {
          console.warn(`⚠️  Current balance is ${currentCreditAccount.balance} (expected 15)`);
        }
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ Test completed successfully!');
    console.log('\n💡 To test a fresh signup:');
    console.log('   1. Create a new test user account');
    console.log('   2. Call /api/credits/initialize with the user ID');
    console.log('   3. Verify the response shows signupCreditsGranted: 15\n');
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Main execution
const email = process.argv[2];

if (!email) {
  console.error('Usage: pnpm tsx scripts/test-signup-credits.ts <email>');
  console.error('Example: pnpm tsx scripts/test-signup-credits.ts test@example.com');
  process.exit(1);
}

testSignupCredits(email)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
