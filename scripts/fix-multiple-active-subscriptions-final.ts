/**
 * Fix Multiple Active Subscriptions
 *
 * PROBLEM: User has 14 active subscriptions but should only have 1
 *
 * SOLUTION:
 * 1. Find the most recent active subscription (by period_end date)
 * 2. Keep that one active
 * 3. Cancel all other active subscriptions in both database and Creem
 */

import { resolve } from 'path';
import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: resolve(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL!;
const CREEM_API_KEY = process.env.CREEM_API_KEY!;
const sql = postgres(DATABASE_URL);

async function cancelCreemSubscription(subscriptionId: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.creem.io/v1/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CREEM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancel_at_period_end: false, // Cancel immediately
      }),
    });

    if (response.ok) {
      console.log(`  ✅ Canceled in Creem`);
      return true;
    } else {
      const error = await response.text();
      console.log(`  ⚠️  Creem API error: ${response.status} - ${error.substring(0, 100)}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Failed to cancel in Creem:`, error);
    return false;
  }
}

async function main() {
  console.log('🔧 Fix Multiple Active Subscriptions\n');
  console.log('='.repeat(60));

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
  console.log(`✅ User: ${users[0].email}`);
  console.log(`   ID: ${userId}\n`);

  // Get all active subscriptions
  const activeSubscriptions = await sql`
    SELECT 
      subscription_id,
      price_id,
      status,
      period_start,
      period_end,
      created_at
    FROM payment
    WHERE user_id = ${userId}
      AND provider = 'creem'
      AND status = 'active'
    ORDER BY period_end DESC NULLS LAST, created_at DESC
  `;

  console.log(`Found ${activeSubscriptions.length} active subscriptions\n`);

  if (activeSubscriptions.length <= 1) {
    console.log('✅ User has 0 or 1 active subscription. No action needed.');
    await sql.end();
    return;
  }

  // Display all active subscriptions
  console.log('📋 Current Active Subscriptions:');
  console.table(
    activeSubscriptions.map((sub, index) => ({
      '#': index + 1,
      subscriptionId: sub.subscription_id,
      plan: sub.price_id,
      periodEnd: sub.period_end ? new Date(sub.period_end).toISOString().split('T')[0] : 'N/A',
      createdAt: new Date(sub.created_at).toISOString().split('T')[0],
      action: index === 0 ? '✅ KEEP' : '❌ CANCEL',
    }))
  );

  // Keep the first one (most recent)
  const keepSubscription = activeSubscriptions[0];
  const cancelSubscriptions = activeSubscriptions.slice(1);

  console.log(`\n✅ KEEPING: ${keepSubscription.subscription_id}`);
  console.log(`   Plan: ${keepSubscription.price_id}`);
  console.log(`   Period End: ${keepSubscription.period_end}\n`);

  console.log(`❌ CANCELING ${cancelSubscriptions.length} subscriptions...\n`);
  console.log('='.repeat(60));

  let canceledInDb = 0;
  let canceledInCreem = 0;
  let errors = 0;

  for (const sub of cancelSubscriptions) {
    console.log(`\n🔄 Processing: ${sub.subscription_id}`);

    try {
      // 1. Cancel in database first
      await sql`
        UPDATE payment
        SET 
          status = 'canceled',
          cancel_at_period_end = false,
          updated_at = NOW()
        WHERE subscription_id = ${sub.subscription_id}
      `;
      console.log(`  ✅ Canceled in database`);
      canceledInDb++;

      // 2. Cancel in Creem
      const success = await cancelCreemSubscription(sub.subscription_id);
      if (success) {
        canceledInCreem++;
      }
    } catch (error) {
      console.error(`  ❌ Error:`, error);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total active subscriptions found: ${activeSubscriptions.length}`);
  console.log(`✅ Kept active: 1 (${keepSubscription.subscription_id})`);
  console.log(`❌ Canceled in database: ${canceledInDb}`);
  console.log(`❌ Canceled in Creem: ${canceledInCreem}`);
  console.log(`⚠️  Errors: ${errors}`);

  // Final status check
  const finalStatus = await sql`
    SELECT status, COUNT(*) as count
    FROM payment
    WHERE user_id = ${userId} AND provider = 'creem'
    GROUP BY status
    ORDER BY count DESC
  `;

  console.log('\n📊 Final Database Status:');
  console.table(finalStatus);

  await sql.end();
  console.log('\n✅ Done!');
  console.log('\n💡 Next steps:');
  console.log('1. Verify in Creem dashboard that only 1 subscription is active');
  console.log('2. Test the application to ensure subscription features work correctly');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
