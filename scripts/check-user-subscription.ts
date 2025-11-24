/**
 * Check subscription status for a specific user
 */

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

async function checkUserSubscription(email: string) {
  try {
    console.log(`\n🔍 Checking subscription status for: ${email}\n`);
    console.log('='.repeat(80));

    // Get user info
    const userResult = await sql`
      SELECT id, email, name, role, created_at, banned
      FROM "user"
      WHERE email = ${email}
      LIMIT 1
    `;

    if (userResult.length === 0) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    const user = userResult[0];
    console.log(`\n👤 User Information:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${new Date(user.created_at).toISOString()}`);
    console.log(`   Banned: ${user.banned ? 'Yes' : 'No'}`);

    // Get credit balance
    const creditResult = await sql`
      SELECT balance, updated_at
      FROM user_credits
      WHERE user_id = ${user.id}
      LIMIT 1
    `;

    if (creditResult.length > 0) {
      const credits = creditResult[0];
      console.log(`\n💰 Credit Balance:`);
      console.log(`   Balance: ${credits.balance}`);
      console.log(`   Last Updated: ${new Date(credits.updated_at).toISOString()}`);
    } else {
      console.log(`\n💰 Credit Balance: 0 (no record found)`);
    }

    // Get all subscriptions
    const subscriptionResult = await sql`
      SELECT 
        id,
        type,
        provider,
        status,
        price_id,
        product_id,
        subscription_id,
        customer_id,
        cancel_at_period_end,
        period_start,
        period_end,
        scheduled_plan_id,
        scheduled_interval,
        scheduled_period_start,
        scheduled_period_end,
        scheduled_at,
        created_at,
        updated_at
      FROM payment
      WHERE user_id = ${user.id}
        AND type = 'subscription'
      ORDER BY created_at DESC
    `;

    console.log(`\n📋 Subscriptions (${subscriptionResult.length} total):`);
    console.log('='.repeat(80));

    if (subscriptionResult.length === 0) {
      console.log('   No subscriptions found');
      console.log('   Status: FREE PLAN');
    } else {
      subscriptionResult.forEach((sub, index) => {
        // Determine plan from product_id or price_id
        let planName = 'Unknown';
        if (sub.product_id) {
          if (sub.product_id.includes('proplus') || sub.product_id.includes('pro_plus')) {
            planName = 'Pro+';
          } else if (sub.product_id.includes('pro')) {
            planName = 'Pro';
          } else if (sub.product_id.includes('free')) {
            planName = 'Free';
          }
        }
        if (planName === 'Unknown' && sub.price_id) {
          if (sub.price_id.includes('proplus') || sub.price_id.includes('pro_plus')) {
            planName = 'Pro+';
          } else if (sub.price_id.includes('pro')) {
            planName = 'Pro';
          } else if (sub.price_id.includes('free')) {
            planName = 'Free';
          }
        }

        console.log(`\n[${index + 1}] Subscription ID: ${sub.id}`);
        console.log(`   Provider: ${sub.provider || 'N/A'}`);
        console.log(`   Status: ${sub.status || 'N/A'}`);
        console.log(`   Plan: ${planName}`);
        console.log(`   Product ID: ${sub.product_id || 'N/A'}`);
        console.log(`   Price ID: ${sub.price_id || 'N/A'}`);
        console.log(`   Subscription ID: ${sub.subscription_id || 'N/A'}`);
        console.log(`   Customer ID: ${sub.customer_id || 'N/A'}`);
        console.log(`   Cancel at Period End: ${sub.cancel_at_period_end ? 'Yes' : 'No'}`);
        if (sub.period_start) {
          console.log(`   Period Start: ${new Date(sub.period_start).toISOString()}`);
        }
        if (sub.period_end) {
          console.log(`   Period End: ${new Date(sub.period_end).toISOString()}`);
        }
        if (sub.scheduled_plan_id) {
          console.log(`   ⚠️  Scheduled Plan Change:`);
          console.log(`      Scheduled Plan: ${sub.scheduled_plan_id}`);
          console.log(`      Scheduled Interval: ${sub.scheduled_interval || 'N/A'}`);
          if (sub.scheduled_period_start) {
            console.log(`      Scheduled Period Start: ${new Date(sub.scheduled_period_start).toISOString()}`);
          }
          if (sub.scheduled_period_end) {
            console.log(`      Scheduled Period End: ${new Date(sub.scheduled_period_end).toISOString()}`);
          }
          if (sub.scheduled_at) {
            console.log(`      Scheduled At: ${new Date(sub.scheduled_at).toISOString()}`);
          }
        }
        console.log(`   Created: ${new Date(sub.created_at).toISOString()}`);
        console.log(`   Updated: ${new Date(sub.updated_at).toISOString()}`);
      });

      // Determine current plan
      const activeSub = subscriptionResult.find(
        (s) => s.status === 'active' || s.status === 'trialing' || s.status === 'past_due'
      );

      if (activeSub) {
        let currentPlanName = 'Unknown';
        if (activeSub.product_id) {
          if (activeSub.product_id.includes('proplus') || activeSub.product_id.includes('pro_plus')) {
            currentPlanName = 'Pro+';
          } else if (activeSub.product_id.includes('pro')) {
            currentPlanName = 'Pro';
          } else if (activeSub.product_id.includes('free')) {
            currentPlanName = 'Free';
          }
        }
        if (currentPlanName === 'Unknown' && activeSub.price_id) {
          if (activeSub.price_id.includes('proplus') || activeSub.price_id.includes('pro_plus')) {
            currentPlanName = 'Pro+';
          } else if (activeSub.price_id.includes('pro')) {
            currentPlanName = 'Pro';
          } else if (activeSub.price_id.includes('free')) {
            currentPlanName = 'Free';
          }
        }

        console.log(`\n✅ Current Active Plan: ${currentPlanName}`);
        if (activeSub.scheduled_plan_id) {
          console.log(`   ⚠️  Scheduled to change to: ${activeSub.scheduled_plan_id}`);
          if (activeSub.scheduled_period_start) {
            console.log(`   Effective from: ${new Date(activeSub.scheduled_period_start).toISOString()}`);
          }
        }
      } else {
        console.log(`\n📌 Current Status: FREE PLAN (no active subscription)`);
      }
    }

    console.log('\n' + '='.repeat(80));
  } catch (error) {
    console.error('❌ Error checking subscription:', error);
    process.exit(1);
  }
}

const email = process.argv[2] || 'jefflee2002@gmail.com';
checkUserSubscription(email)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

