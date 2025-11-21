import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL not found');
}

const sql = neon(DATABASE_URL);

async function checkSubscription() {
  console.log('Checking payment table for active subscriptions...\n');

  const subscriptions = await sql`
    SELECT 
      id,
      user_id,
      subscription_id,
      price_id,
      product_id,
      status,
      provider,
      type,
      interval,
      cancel_at_period_end,
      period_start,
      period_end,
      scheduled_plan_id
    FROM payment
    WHERE status IN ('active', 'trialing')
    AND provider = 'creem'
    ORDER BY created_at DESC
  `;

  console.log(`Found ${subscriptions.length} active Creem subscription(s):\n`);

  for (const sub of subscriptions) {
    console.log('─'.repeat(80));
    console.log('ID:', sub.id);
    console.log('User ID:', sub.user_id);
    console.log('Subscription ID:', sub.subscription_id);
    console.log('Price ID:', sub.price_id);
    console.log('Product ID:', sub.product_id);
    console.log('Status:', sub.status);
    console.log('Interval:', sub.interval);
    console.log('Scheduled Plan ID:', sub.scheduled_plan_id);
    console.log('Period:', sub.period_start, 'to', sub.period_end);
    console.log('');
  }

  console.log('\nChecking environment variables for Pro+ product configuration:\n');
  const proPlusMonthKey = process.env.CREEM_PROPLUS_PRODUCT_KEY_MONTHLY;
  const proPlusYearKey = process.env.CREEM_PROPLUS_PRODUCT_KEY_YEARLY;

  console.log('CREEM_PROPLUS_PRODUCT_KEY_MONTHLY:', proPlusMonthKey || 'NOT SET');
  console.log('CREEM_PROPLUS_PRODUCT_KEY_YEARLY:', proPlusYearKey || 'NOT SET');
}

checkSubscription();
