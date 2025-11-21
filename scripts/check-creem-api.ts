/**
 * Simple script to fetch and display Creem subscription data
 * Compares it with configured product keys to identify the correct plan
 */

import { config } from 'dotenv';

config({ path: '.env.local' });

const CREEM_API_KEY = process.env.CREEM_API_KEY;
const CREEM_API_URL = 'https://api.creem.io/v1';

if (!CREEM_API_KEY) {
  console.error('❌ CREEM_API_KEY not found in environment variables');
  process.exit(1);
}

async function fetchCreemSubscriptions() {
  console.log('📡 Fetching subscriptions from Creem API...\n');

  try {
    const response = await fetch(`${CREEM_API_URL}/subscriptions`, {
      headers: {
        Authorization: `Bearer ${CREEM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Creem API error: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    const subscriptions = data.data || [];

    console.log(`Found ${subscriptions.length} subscription(s) in Creem:\n`);

    const proPlusMonthly = process.env.CREEM_PROPLUS_PLAN_PRODUCT_KEY_MONTHLY;
    const proPlusYearly = process.env.CREEM_PROPLUS_PLAN_PRODUCT_KEY_YEARLY;
    const proMonthly = process.env.CREEM_PRO_PLAN_PRODUCT_KEY_MONTHLY;
    const proYearly = process.env.CREEM_PRO_PLAN_PRODUCT_KEY_YEARLY;

    for (const sub of subscriptions) {
      console.log('═'.repeat(80));
      console.log('SUBSCRIPTION DATA FROM CREEM:');
      console.log('  Subscription ID:', sub.id);
      console.log('  Customer ID:', sub.customer_id);
      console.log('  Product ID:', sub.product_id);
      console.log('  Status:', sub.status);
      console.log('  Interval:', sub.interval);
      console.log('  Current Period Start:', sub.current_period_start);
      console.log('  Current Period End:', sub.current_period_end);
      console.log('  Cancel at Period End:', sub.cancel_at_period_end);

      // Determine which plan this is
      let planName = '❓ Unknown';
      if (sub.product_id === proPlusMonthly) {
        planName = '✅ Pro+ (Monthly)';
      } else if (sub.product_id === proPlusYearly) {
        planName = '✅ Pro+ (Yearly)';
      } else if (sub.product_id === proMonthly) {
        planName = '✅ Pro (Monthly)';
      } else if (sub.product_id === proYearly) {
        planName = '✅ Pro (Yearly)';
      }

      console.log('  → Identified Plan:', planName);
      console.log('');

      if (planName.includes('Unknown')) {
        console.log('⚠️  WARNING: Product ID does not match any configured plan!');
        console.log('   Check your .env.local configuration.');
        console.log('');
      }
    }

    console.log('═'.repeat(80));
    console.log('\nCONFIGURED PRODUCT KEYS:');
    console.log('  Pro (Monthly):', proMonthly);
    console.log('  Pro (Yearly):', proYearly);
    console.log('  Pro+ (Monthly):', proPlusMonthly);
    console.log('  Pro+ (Yearly):', proPlusYearly);
    console.log('');

    console.log('NEXT STEPS:');
    console.log('1. Note the Subscription ID and Product ID from above');
    console.log('2. Check your database payment table for this subscription_id');
    console.log('3. Verify the product_id in database matches the Product ID from Creem');
    console.log('4. If mismatch, update database:');
    console.log("   UPDATE payment SET product_id = '<Product ID from Creem>'");
    console.log("   WHERE subscription_id = '<Subscription ID from Creem>';");
  } catch (error) {
    console.error('❌ Error fetching from Creem:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
    process.exit(1);
  }
}

fetchCreemSubscriptions();
