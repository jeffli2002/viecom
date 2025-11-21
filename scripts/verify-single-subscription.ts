/**
 * Verify that user has only 1 active subscription
 * Checks both database and Creem (if API permits)
 */

import { resolve } from 'path';
import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: resolve(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL!;
const CREEM_API_KEY = process.env.CREEM_API_KEY!;
const sql = postgres(DATABASE_URL);

async function main() {
  console.log('🔍 Verification: Single Active Subscription\n');
  console.log('='.repeat(70));

  // Get jefflee's user
  const users = await sql`
    SELECT id, email FROM "user" 
    WHERE email = 'jefflee2002@gmail.com'
    LIMIT 1
  `;

  if (users.length === 0) {
    console.error('❌ User not found');
    process.exit(1);
  }

  const userId = users[0].id;
  console.log(`\n✅ User: ${users[0].email}`);
  console.log(`   ID: ${userId}\n`);

  // Check database status
  console.log('📊 DATABASE STATUS\n');

  const allSubscriptions = await sql`
    SELECT 
      subscription_id,
      customer_id,
      price_id,
      status,
      interval,
      period_start,
      period_end,
      created_at,
      updated_at
    FROM payment
    WHERE user_id = ${userId}
      AND provider = 'creem'
    ORDER BY 
      CASE status 
        WHEN 'active' THEN 1 
        WHEN 'trialing' THEN 2
        ELSE 3 
      END,
      period_end DESC NULLS LAST,
      created_at DESC
  `;

  console.log(`Total subscriptions in DB: ${allSubscriptions.length}\n`);

  // Count by status
  const statusCounts = await sql`
    SELECT status, COUNT(*) as count
    FROM payment
    WHERE user_id = ${userId} AND provider = 'creem'
    GROUP BY status
    ORDER BY count DESC
  `;

  console.log('Status breakdown:');
  console.table(statusCounts);

  // Show active subscriptions
  const activeSubscriptions = allSubscriptions.filter((s) => s.status === 'active');

  console.log(`\n🟢 ACTIVE SUBSCRIPTIONS: ${activeSubscriptions.length}\n`);

  if (activeSubscriptions.length > 0) {
    activeSubscriptions.forEach((sub, index) => {
      console.log(`${index + 1}. Subscription ID: ${sub.subscription_id}`);
      console.log(`   Plan: ${sub.price_id} (${sub.interval}ly)`);
      console.log(
        `   Period: ${sub.period_start ? new Date(sub.period_start).toISOString().split('T')[0] : 'N/A'} → ${sub.period_end ? new Date(sub.period_end).toISOString().split('T')[0] : 'N/A'}`
      );
      console.log(`   Customer: ${sub.customer_id}`);
      console.log(`   Created: ${new Date(sub.created_at).toISOString()}`);
      console.log('');
    });
  }

  // Validation
  console.log('='.repeat(70));
  console.log('✅ VALIDATION RESULTS\n');

  if (activeSubscriptions.length === 0) {
    console.log('⚠️  WARNING: No active subscriptions found');
    console.log('   User may not have access to paid features\n');
  } else if (activeSubscriptions.length === 1) {
    console.log('✅ PASSED: Exactly 1 active subscription');
    console.log(`   Subscription ID: ${activeSubscriptions[0].subscription_id}`);
    console.log(`   Plan: ${activeSubscriptions[0].price_id}\n`);
  } else {
    console.log(`❌ FAILED: ${activeSubscriptions.length} active subscriptions found`);
    console.log('   Expected: 1 active subscription');
    console.log('   Action needed: Cancel extra subscriptions\n');
  }

  // Try to verify in Creem (will likely fail due to API permissions)
  console.log('='.repeat(70));
  console.log('📡 CREEM API VERIFICATION\n');

  if (activeSubscriptions.length > 0) {
    for (const sub of activeSubscriptions) {
      try {
        const response = await fetch(
          `https://api.creem.io/v1/subscriptions/${sub.subscription_id}`,
          {
            headers: {
              Authorization: `Bearer ${CREEM_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${sub.subscription_id}`);
          console.log(`   Creem Status: ${data.status}`);
          console.log(`   Match: ${data.status === sub.status ? '✅' : '❌ MISMATCH'}\n`);
        } else {
          console.log(`⚠️  ${sub.subscription_id}`);
          console.log(`   API Error: ${response.status} ${response.statusText}`);
          console.log('   (This is expected if API key has limited permissions)\n');
        }
      } catch (error) {
        console.log(`❌ ${sub.subscription_id}`);
        console.log(`   Error: ${error}\n`);
      }
    }
  }

  console.log('='.repeat(70));
  console.log('\n💡 RECOMMENDATIONS\n');

  if (activeSubscriptions.length === 1) {
    console.log('✅ System is healthy!');
    console.log('✅ User has exactly 1 active subscription');
    console.log('✅ No further action needed\n');
  } else if (activeSubscriptions.length === 0) {
    console.log('⚠️  User has no active subscriptions');
    console.log('   If user should have a subscription:');
    console.log('   1. Check Creem dashboard manually');
    console.log('   2. Run webhook sync to update database');
    console.log('   3. Or create new subscription via checkout\n');
  } else {
    console.log('⚠️  Multiple active subscriptions detected');
    console.log('   Actions needed:');
    console.log('   1. Manually cancel extra subscriptions in Creem dashboard');
    console.log('   2. Or run: pnpm tsx scripts/fix-multiple-active-subscriptions-final.ts\n');
  }

  await sql.end();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
