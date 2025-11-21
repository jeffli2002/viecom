/**
 * Manual import tool for Creem subscriptions
 * Use this to import active subscriptions from Creem dashboard into your database
 */

import { resolve } from 'path';
import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: resolve(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = postgres(DATABASE_URL);

// Subscription data structure from Creem dashboard
interface CreemSubscription {
  subscriptionId: string; // e.g., "sub_xxxxx"
  customerId: string; // e.g., "cus_xxxxx"
  userId: string; // Your user ID (jefflee's user ID)
  priceId: string; // e.g., "pro", "proplus"
  status: string; // e.g., "active", "trialing"
  interval: 'month' | 'year'; // billing interval
  periodStart?: string; // e.g., "2025-11-19T01:02:27.154Z"
  periodEnd?: string; // e.g., "2025-12-19T01:02:27.154Z"
  trialStart?: string;
  trialEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

async function importSubscription(sub: CreemSubscription) {
  console.log(`\nImporting ${sub.subscriptionId}...`);

  // Check if already exists
  const existing = await sql`
    SELECT id, status FROM payment 
    WHERE subscription_id = ${sub.subscriptionId}
  `;

  if (existing.length > 0) {
    console.log(`  ⚠️  Already exists (status: ${existing[0].status})`);

    // Update status if different
    if (existing[0].status !== sub.status) {
      await sql`
        UPDATE payment 
        SET 
          status = ${sub.status},
          price_id = ${sub.priceId},
          interval = ${sub.interval},
          period_start = ${sub.periodStart ? new Date(sub.periodStart) : null},
          period_end = ${sub.periodEnd ? new Date(sub.periodEnd) : null},
          cancel_at_period_end = ${sub.cancelAtPeriodEnd || false},
          updated_at = NOW()
        WHERE subscription_id = ${sub.subscriptionId}
      `;
      console.log(`  ✅ Updated: ${existing[0].status} → ${sub.status}`);
    } else {
      console.log(`  ✓ Already up to date`);
    }
    return;
  }

  // Insert new subscription
  await sql`
    INSERT INTO payment (
      id,
      provider,
      price_id,
      type,
      interval,
      user_id,
      customer_id,
      subscription_id,
      status,
      period_start,
      period_end,
      cancel_at_period_end,
      trial_start,
      trial_end,
      created_at,
      updated_at
    ) VALUES (
      ${sub.subscriptionId},
      'creem',
      ${sub.priceId},
      'subscription',
      ${sub.interval},
      ${sub.userId},
      ${sub.customerId},
      ${sub.subscriptionId},
      ${sub.status},
      ${sub.periodStart ? new Date(sub.periodStart) : null},
      ${sub.periodEnd ? new Date(sub.periodEnd) : null},
      ${sub.cancelAtPeriodEnd || false},
      ${sub.trialStart ? new Date(sub.trialStart) : null},
      ${sub.trialEnd ? new Date(sub.trialEnd) : null},
      NOW(),
      NOW()
    )
  `;

  console.log(`  ✅ Imported successfully`);
}

async function main() {
  console.log('📥 Creem Subscription Import Tool\n');

  // First, get jefflee's user ID
  const users = await sql`
    SELECT id, email FROM "user" 
    WHERE email LIKE '%jefflee%' OR email = 'jefflee2002@gmail.com'
    LIMIT 1
  `;

  if (users.length === 0) {
    console.error('❌ Could not find user jefflee2002@gmail.com');
    process.exit(1);
  }

  const jeffleeUserId = users[0].id;
  console.log(`✅ Found user: ${users[0].email}`);
  console.log(`   User ID: ${jeffleeUserId}\n`);

  // ============================================================
  // PASTE YOUR 14 SUBSCRIPTIONS HERE
  // ============================================================
  // Copy from Creem dashboard, one by one, and add to this array

  const subscriptionsToImport: CreemSubscription[] = [
    // Example format - replace with your actual data:
    // {
    //   subscriptionId: 'sub_xxxxx',
    //   customerId: 'cus_xxxxx',
    //   userId: jeffleeUserId,  // Use jefflee's user ID
    //   priceId: 'pro',         // or 'proplus'
    //   status: 'active',       // or 'trialing', 'canceled', etc.
    //   interval: 'month',      // or 'year'
    //   periodStart: '2025-11-19T01:02:27.154Z',
    //   periodEnd: '2025-12-19T01:02:27.154Z',
    //   cancelAtPeriodEnd: false,
    // },
    // ADD MORE SUBSCRIPTIONS BELOW:
  ];

  if (subscriptionsToImport.length === 0) {
    console.log('⚠️  No subscriptions to import!');
    console.log('\n📝 Instructions:');
    console.log('1. Open Creem dashboard');
    console.log('2. Click on each subscription');
    console.log('3. Copy the details and paste into the array above');
    console.log('4. Run this script again');
    console.log('\nExample format:');
    console.log(`{
  subscriptionId: 'sub_xxxxx',
  customerId: 'cus_xxxxx', 
  userId: '${jeffleeUserId}',
  priceId: 'pro',
  status: 'active',
  interval: 'month',
  periodStart: '2025-11-19T01:02:27.154Z',
  periodEnd: '2025-12-19T01:02:27.154Z',
},`);
    await sql.end();
    return;
  }

  console.log(`\n🔄 Importing ${subscriptionsToImport.length} subscriptions...\n`);
  console.log('='.repeat(60));

  for (const sub of subscriptionsToImport) {
    try {
      await importSubscription(sub);
    } catch (error) {
      console.error(`  ❌ Error importing ${sub.subscriptionId}:`, error);
    }
  }

  console.log('\n' + '='.repeat(60));

  // Summary
  const dbSubs = await sql`
    SELECT status, COUNT(*) as count
    FROM payment
    WHERE user_id = ${jeffleeUserId} AND provider = 'creem'
    GROUP BY status
    ORDER BY count DESC
  `;

  console.log('\n📊 Current subscription status:');
  console.table(dbSubs);

  await sql.end();
  console.log('\n✅ Done!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
