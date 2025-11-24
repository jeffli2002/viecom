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

interface SubscriptionRow {
  user_id: string;
  email: string;
  user_name: string | null;
  price_id: string | null;
  subscription_status: string;
  provider: string | null;
  billing_interval: string | null;
  period_start: string | null;
  period_end: string | null;
  days_until_period_end: number | null;
  cancel_at_period_end: boolean | null;
  current_credits: number | null;
  subscription_status_category: string | null;
}

async function viewAllSubscribedUsers() {
  try {
    console.log('📊 Fetching all subscribed users...\n');

    const results = await sql`
      SELECT 
        -- User Information
        u.id AS user_id,
        u.email,
        u.name AS user_name,
        u.role,
        u.created_at AS user_created_at,
        u.banned,
        u.ban_reason,
        u.ban_expires,
        
        -- Subscription/Payment Information
        p.id AS subscription_id,
        p.subscription_id AS creem_subscription_id,
        p.provider,
        p.price_id,
        p.product_id,
        p.type AS payment_type,
        p.interval AS billing_interval,
        p.status AS subscription_status,
        p.period_start,
        p.period_end,
        p.cancel_at_period_end,
        p.trial_start,
        p.trial_end,
        p.customer_id,
        p.created_at AS subscription_created_at,
        p.updated_at AS subscription_updated_at,
        
        -- Credit Information
        uc.balance AS current_credits,
        uc.updated_at AS credits_updated_at,
        
        -- Additional computed fields
        CASE 
          WHEN p.status IN ('active', 'trialing', 'past_due') THEN 'Active'
          WHEN p.status = 'canceled' THEN 'Canceled'
          ELSE 'Other'
        END AS subscription_status_category,
        
        CASE 
          WHEN p.period_end IS NOT NULL AND p.period_end > NOW() THEN 'Current Period'
          WHEN p.period_end IS NOT NULL AND p.period_end <= NOW() THEN 'Expired'
          ELSE 'Unknown'
        END AS period_status,
        
        -- Days until period end (if active)
        CASE 
          WHEN p.period_end IS NOT NULL AND p.period_end > NOW() 
          THEN EXTRACT(DAY FROM (p.period_end - NOW()))
          ELSE NULL
        END AS days_until_period_end

      FROM "user" u
      INNER JOIN payment p ON p.user_id = u.id
      LEFT JOIN user_credits uc ON uc.user_id = u.id
      WHERE p.type = 'subscription'
      ORDER BY 
        -- Show active subscriptions first
        CASE WHEN p.status IN ('active', 'trialing', 'past_due') THEN 0 ELSE 1 END,
        p.created_at DESC
    `;

    console.log(`✅ Found ${results.length} subscription records\n`);

    if (results.length === 0) {
      console.log('No subscriptions found.');
      return;
    }

    // Display results in a table format
    console.log('='.repeat(120));
    console.log('ALL SUBSCRIBED USERS');
    console.log('='.repeat(120));
    console.table(
      (results as SubscriptionRow[]).map((row) => ({
        Email: row.email,
        'User Name': row.user_name || 'N/A',
        Plan: row.price_id || 'N/A',
        Status: row.subscription_status,
        Provider: row.provider || 'N/A',
        Interval: row.billing_interval || 'N/A',
        'Period Start': row.period_start ? new Date(row.period_start).toLocaleDateString() : 'N/A',
        'Period End': row.period_end ? new Date(row.period_end).toLocaleDateString() : 'N/A',
        'Days Until End': row.days_until_period_end || 'N/A',
        'Cancel at Period End': row.cancel_at_period_end ? 'Yes' : 'No',
        'Current Credits': row.current_credits || 0,
        'Status Category': row.subscription_status_category,
      }))
    );

    // Summary statistics
    console.log(`\n${'='.repeat(120)}`);
    console.log('SUMMARY STATISTICS');
    console.log('='.repeat(120));

    const typedResults = results as SubscriptionRow[];
    const activeCount = typedResults.filter(
      (r) => r.subscription_status === 'active' || r.subscription_status === 'trialing'
    ).length;
    const canceledCount = typedResults.filter((r) => r.subscription_status === 'canceled').length;
    const uniqueUsers = new Set(typedResults.map((r) => r.user_id)).size;

    const planCounts: Record<string, number> = {};
    typedResults.forEach((row) => {
      const plan = row.price_id || 'unknown';
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    });

    console.log(`Total subscription records: ${results.length}`);
    console.log(`Unique users with subscriptions: ${uniqueUsers}`);
    console.log(`Active subscriptions: ${activeCount}`);
    console.log(`Canceled subscriptions: ${canceledCount}`);
    console.log('\nSubscriptions by plan:');
    Object.entries(planCounts).forEach(([plan, count]) => {
      console.log(`  ${plan}: ${count}`);
    });

    // Show detailed information for each user
    console.log(`\n${'='.repeat(120)}`);
    console.log('DETAILED INFORMATION');
    console.log('='.repeat(120));

    typedResults.forEach((row, index: number) => {
      console.log(`\n[${index + 1}] ${row.email || 'N/A'}`);
      console.log(`  User ID: ${row.user_id}`);
      console.log(`  Name: ${row.user_name || 'N/A'}`);
      console.log(`  Role: ${row.role || 'N/A'}`);
      console.log(`  Banned: ${row.banned ? 'Yes' : 'No'}`);
      console.log(`  Subscription ID: ${row.subscription_id}`);
      console.log(`  Creem Subscription ID: ${row.creem_subscription_id || 'N/A'}`);
      console.log(`  Provider: ${row.provider || 'N/A'}`);
      console.log(`  Price ID: ${row.price_id}`);
      console.log(`  Product ID: ${row.product_id || 'N/A'}`);
      console.log(`  Status: ${row.subscription_status}`);
      console.log(`  Interval: ${row.billing_interval || 'N/A'}`);
      console.log(
        `  Period Start: ${row.period_start ? new Date(row.period_start).toISOString() : 'N/A'}`
      );
      console.log(
        `  Period End: ${row.period_end ? new Date(row.period_end).toISOString() : 'N/A'}`
      );
      console.log(`  Cancel at Period End: ${row.cancel_at_period_end ? 'Yes' : 'No'}`);
      console.log(
        `  Trial Start: ${row.trial_start ? new Date(row.trial_start).toISOString() : 'N/A'}`
      );
      console.log(`  Trial End: ${row.trial_end ? new Date(row.trial_end).toISOString() : 'N/A'}`);
      console.log(`  Customer ID: ${row.customer_id}`);
      console.log(`  Current Credits: ${row.current_credits || 0}`);
      console.log(
        `  Subscription Created: ${row.subscription_created_at ? new Date(row.subscription_created_at).toISOString() : 'N/A'}`
      );
      console.log(
        `  Subscription Updated: ${row.subscription_updated_at ? new Date(row.subscription_updated_at).toISOString() : 'N/A'}`
      );
      console.log(`  Status Category: ${row.subscription_status_category}`);
      console.log(`  Period Status: ${row.period_status}`);
      if (row.days_until_period_end) {
        console.log(`  Days Until Period End: ${row.days_until_period_end}`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to fetch subscribed users:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

viewAllSubscribedUsers();
