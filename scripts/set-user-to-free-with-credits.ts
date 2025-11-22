/**
 * Set a user to Free plan and set credits to a specific amount
 * - Cancel all active subscriptions in database
 * - Clear all scheduled plan fields
 * - Cancel active subscriptions in Creem
 * - Set credits to specified amount
 */

import { resolve } from 'node:path';
import { config } from 'dotenv';

// Load .env.local file FIRST
config({ path: resolve(process.cwd(), '.env.local') });

// Set SKIP_ENV_VALIDATION to avoid env.ts validation when importing modules
process.env.SKIP_ENV_VALIDATION = 'true';

// Verify CREEM_API_KEY is loaded before importing modules
const apiKeyFromEnv = process.env.CREEM_API_KEY;
if (!apiKeyFromEnv) {
  console.error('❌ CREEM_API_KEY not found in .env.local');
  process.exit(1);
}
console.log(`✅ CREEM_API_KEY loaded: ${apiKeyFromEnv.substring(0, 15)}...\n`);

import { neon } from '@neondatabase/serverless';
import { creemService } from '@/lib/creem/creem-service';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Please check your .env.local file.');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function setUserToFreeWithCredits(email: string, credits: number) {
  try {
    console.log(`\n🔧 Setting ${email} to Free plan with ${credits} credits...\n`);
    console.log('='.repeat(80));

    // Step 1: Get user ID
    const userResult = await sql`
      SELECT id, email
      FROM "user"
      WHERE email = ${email}
      LIMIT 1
    `;

    if (userResult.length === 0) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    const userId = userResult[0].id;
    console.log(`✅ Found user: ${userResult[0].email} (ID: ${userId})\n`);

    // Step 2: Get all active subscriptions
    const activeSubs = await sql`
      SELECT 
        id,
        subscription_id,
        status,
        price_id,
        product_id
      FROM payment
      WHERE user_id = ${userId}
        AND type = 'subscription'
        AND (
          status IN ('active', 'trialing', 'past_due')
          OR scheduled_plan_id IS NOT NULL
        )
    `;

    console.log(`📋 Found ${activeSubs.length} active/subscribed records to process\n`);

    // Step 3: Cancel subscriptions in Creem
    const creemSubscriptions: string[] = [];
    for (const sub of activeSubs) {
      if (sub.subscription_id && sub.status === 'active') {
        creemSubscriptions.push(sub.subscription_id);
      }
    }

    if (creemSubscriptions.length > 0) {
      console.log(`🔄 Canceling ${creemSubscriptions.length} subscription(s) in Creem...\n`);
      for (const subId of creemSubscriptions) {
        try {
          console.log(`   Canceling: ${subId}...`);
          const result = await creemService.cancelSubscription(subId);
          if (result.success || result.alreadyCancelled) {
            console.log(`   ✅ Canceled in Creem`);
          } else {
            console.log(`   ⚠️  Failed to cancel in Creem: ${result.error}`);
          }
        } catch (error) {
          console.log(`   ⚠️  Error canceling in Creem: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      console.log();
    } else {
      console.log('ℹ️  No active Creem subscriptions to cancel\n');
    }

    // Step 4: Update database - cancel all subscriptions and clear scheduled fields
    console.log('🔄 Updating database subscriptions...\n');

    const updateResult = await sql`
      UPDATE payment
      SET 
        status = 'canceled',
        cancel_at_period_end = false,
        scheduled_plan_id = NULL,
        scheduled_interval = NULL,
        scheduled_period_start = NULL,
        scheduled_period_end = NULL,
        scheduled_at = NULL,
        updated_at = NOW()
      WHERE user_id = ${userId}
        AND type = 'subscription'
        AND (
          status IN ('active', 'trialing', 'past_due')
          OR scheduled_plan_id IS NOT NULL
        )
      RETURNING 
        id, 
        subscription_id,
        status, 
        scheduled_plan_id,
        updated_at
    `;

    console.log(`✅ Updated ${updateResult.length} subscription record(s) in database:`);
    updateResult.forEach((record, index) => {
      console.log(`   [${index + 1}] ${record.subscription_id || record.id}`);
      console.log(`       Status: ${record.status}`);
      if (record.scheduled_plan_id) {
        console.log(`       Cleared scheduled_plan_id: ${record.scheduled_plan_id}`);
      }
      console.log(`       Updated: ${new Date(record.updated_at).toISOString()}`);
    });

    // Step 5: Update credits
    console.log(`\n🔄 Setting credits to ${credits}...\n`);

    // Get current credit balance
    const currentCredits = await sql`
      SELECT balance
      FROM user_credits
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    const currentBalance = currentCredits.length > 0 ? Number(currentCredits[0].balance) : 0;
    console.log(`   Current balance: ${currentBalance}`);
    console.log(`   Target balance: ${credits}`);

    // Update or insert credits
    // Generate a unique ID for the insert case
    const { randomUUID } = await import('node:crypto');
    const creditId = randomUUID();
    const now = new Date();
    const referenceId = `admin_manual_adjust_${Date.now()}`;
    const delta = credits - currentBalance;
    
    const creditUpdate = await sql`
      INSERT INTO user_credits (id, user_id, balance, total_earned, total_spent, created_at, updated_at)
      VALUES (${creditId}, ${userId}, ${credits}, ${credits}, 0, ${now.toISOString()}, ${now.toISOString()})
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        balance = ${credits},
        updated_at = ${now.toISOString()}
      RETURNING balance, updated_at
    `;

    console.log(`   ✅ Credits updated to: ${creditUpdate[0].balance}`);
    console.log(`   Updated at: ${new Date(creditUpdate[0].updated_at).toISOString()}`);

    // Record credit transaction so dashboard history stays accurate
    if (delta !== 0) {
      const isIncrease = delta > 0;
      const adjustmentType = isIncrease ? 'earn' : 'admin_adjust';
      const adjustmentAmount = Math.abs(delta);

      await sql`
        INSERT INTO credit_transactions (
          id,
          user_id,
          type,
          amount,
          balance_after,
          source,
          description,
          reference_id,
          metadata,
          created_at
        )
        VALUES (
          ${randomUUID()},
          ${userId},
          ${adjustmentType},
          ${isIncrease ? adjustmentAmount : -adjustmentAmount},
          ${credits},
          'admin',
          'Manual credit adjustment (set-user-to-free-with-credits)',
          ${referenceId},
          ${JSON.stringify({
            previousBalance: currentBalance,
            newBalance: credits,
            reason: 'manual_adjust',
          })}::jsonb,
          ${now.toISOString()}
        )
      `;

      console.log(
        `   🧾 Recorded manual adjustment transaction (${adjustmentType}) for ${adjustmentAmount} credits`
      );
    } else {
      console.log('   ℹ️  No balance change detected, skipping transaction log');
    }

    // Step 6: Verify final state
    console.log('\n' + '='.repeat(80));
    console.log('📊 Verification:\n');

    const finalCheck = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE status IN ('active', 'trialing', 'past_due')) as active_count,
        COUNT(*) FILTER (WHERE scheduled_plan_id IS NOT NULL) as scheduled_count
      FROM payment
      WHERE user_id = ${userId}
        AND type = 'subscription'
    `;

    const activeCount = Number(finalCheck[0]?.active_count || 0);
    const scheduledCount = Number(finalCheck[0]?.scheduled_count || 0);

    const finalCredits = await sql`
      SELECT balance
      FROM user_credits
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    const finalBalance = finalCredits.length > 0 ? Number(finalCredits[0].balance) : 0;

    if (activeCount === 0 && scheduledCount === 0 && finalBalance === credits) {
      console.log('✅ User is now on FREE PLAN with correct credits');
      console.log(`   - Active subscriptions: ${activeCount}`);
      console.log(`   - Scheduled plan changes: ${scheduledCount}`);
      console.log(`   - Credit balance: ${finalBalance}`);
    } else {
      console.log('⚠️  Warning: Some issues detected');
      console.log(`   - Active subscriptions: ${activeCount}`);
      console.log(`   - Scheduled plan changes: ${scheduledCount}`);
      console.log(`   - Credit balance: ${finalBalance} (expected: ${credits})`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Process completed!\n');
  } catch (error) {
    console.error('❌ Error setting user to Free:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
    process.exit(1);
  }
}

const email = process.argv[2] || 'jefflee2002@gmail.com';
const credits = process.argv[3] ? parseInt(process.argv[3], 10) : 100;

if (isNaN(credits)) {
  console.error('❌ Invalid credits amount. Please provide a number.');
  process.exit(1);
}

setUserToFreeWithCredits(email, credits)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

