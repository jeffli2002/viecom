import { resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Please check your .env.local file.');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function analyzeJeffleeSubscription() {
  try {
    console.log('📊 Analyzing jefflee2002@gmail.com subscription status...\n');

    // Check user info
    const user = await sql`
      SELECT id, email, name, role, created_at, banned
      FROM "user"
      WHERE email = 'jefflee2002@gmail.com'
      LIMIT 1;
    `;

    if (user.length === 0) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User Information:');
    console.table(user[0]);

    // Check all subscriptions
    const subscriptions = await sql`
      SELECT 
        p.id AS subscription_id,
        p.subscription_id AS creem_subscription_id,
        p.provider,
        p.price_id,
        p.product_id,
        p.status,
        p.interval,
        p.period_start,
        p.period_end,
        p.cancel_at_period_end,
        p.created_at,
        p.updated_at
      FROM payment p
      WHERE p.user_id = ${user[0].id}
        AND p.type = 'subscription'
      ORDER BY p.created_at DESC;
    `;

    console.log(`\n📋 Found ${subscriptions.length} subscription records:\n`);
    console.table(
      subscriptions.map(
        (s: {
          subscription_id: string;
          creem_subscription_id: string;
          provider: string;
          price_id: string;
          product_id?: string;
          status: string;
          interval: string;
          period_start?: Date | string;
          period_end?: Date | string;
          cancel_at_period_end?: boolean;
        }) => ({
          'Subscription ID': s.subscription_id,
          'Creem Sub ID': s.creem_subscription_id,
          Provider: s.provider,
          'Price ID': s.price_id,
          'Product ID': `${s.product_id?.substring(0, 15)}...`,
          Status: s.status,
          Interval: s.interval,
          'Period Start': s.period_start ? new Date(s.period_start).toLocaleDateString() : 'N/A',
          'Period End': s.period_end ? new Date(s.period_end).toLocaleDateString() : 'N/A',
          'Cancel at End': s.cancel_at_period_end ? 'Yes' : 'No',
        })
      )
    );

    // Check for active subscription
    const activeSubscriptions = subscriptions.filter(
      (s: { status: string }) =>
        s.status === 'active' || s.status === 'trialing' || s.status === 'past_due'
    );

    console.log(`\n✅ Active subscriptions: ${activeSubscriptions.length}`);
    if (activeSubscriptions.length > 0) {
      console.log('\nActive subscription details:');
      activeSubscriptions.forEach(
        (
          s: {
            subscription_id: string;
            price_id: string;
            status: string;
            interval: string;
            period_start?: Date | string;
            period_end?: Date | string;
          },
          index: number
        ) => {
          console.log(`\n[${index + 1}] ${s.price_id} (${s.status})`);
          console.log(`    Subscription ID: ${s.subscription_id}`);
          console.log(`    Creem Sub ID: ${s.creem_subscription_id}`);
          console.log(`    Provider: ${s.provider}`);
          console.log(`    Interval: ${s.interval}`);
          console.log(
            `    Period: ${s.period_start ? new Date(s.period_start).toISOString() : 'N/A'} to ${s.period_end ? new Date(s.period_end).toISOString() : 'N/A'}`
          );
          console.log(`    Cancel at Period End: ${s.cancel_at_period_end ? 'Yes' : 'No'}`);
        }
      );
    }

    // Check credits
    const credits = await sql`
      SELECT balance, updated_at
      FROM user_credits
      WHERE user_id = ${user[0].id}
      LIMIT 1;
    `;

    console.log(`\n💰 Credits: ${credits.length > 0 ? credits[0].balance : 0}`);

    // Check if scheduled columns exist
    console.log('\n🔍 Checking for scheduled columns...');
    try {
      const testQuery = await sql`
        SELECT 
          id,
          price_id,
          scheduled_plan_id,
          scheduled_interval,
          scheduled_period_start
        FROM payment
        WHERE user_id = ${user[0].id}
          AND type = 'subscription'
        LIMIT 1;
      `;
      console.log('✅ Scheduled columns exist and are accessible');
      if (testQuery.length > 0 && 'scheduled_plan_id' in testQuery[0]) {
        const row = testQuery[0] as {
          scheduled_plan_id?: string;
          scheduled_interval?: string;
          scheduled_period_start?: Date | string;
        };
        console.log('   Found scheduled upgrade:', {
          scheduledPlanId: row.scheduled_plan_id,
          scheduledInterval: row.scheduled_interval,
          scheduledPeriodStart: row.scheduled_period_start,
        });
      } else {
        console.log('   No scheduled upgrades found');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('scheduled_plan_id') || message.includes('does not exist')) {
        console.log('❌ Scheduled columns do NOT exist in the database');
        console.log('   This explains the 500 error on /api/creem/subscription');
        console.log('   Action needed: Add scheduled columns to payment table');
      } else {
        console.error('   Error checking scheduled columns:', error.message);
      }
    }

    // Summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`User: ${user[0].email} (${user[0].name})`);
    console.log(`Total subscriptions: ${subscriptions.length}`);
    console.log(`Active subscriptions: ${activeSubscriptions.length}`);
    console.log(`Current credits: ${credits.length > 0 ? credits[0].balance : 0}`);

    if (activeSubscriptions.length === 1) {
      const active = activeSubscriptions[0];
      console.log(`\n✅ Current plan: ${active.price_id} (${active.status})`);
      console.log(`   Provider: ${active.provider}`);
      console.log(`   Billing: ${active.interval}`);
    } else if (activeSubscriptions.length > 1) {
      console.log('\n⚠️  WARNING: Multiple active subscriptions found!');
      console.log('   This may cause issues. Consider canceling duplicate subscriptions.');
    } else {
      console.log('\n⚠️  No active subscriptions found');
    }
  } catch (error) {
    console.error('❌ Failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    process.exit(1);
  }
}

analyzeJeffleeSubscription();
