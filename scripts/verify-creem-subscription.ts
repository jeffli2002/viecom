/**
 * Script to verify subscription data between Creem API and local database
 *
 * This helps diagnose mismatches where Creem shows Pro+ but database/frontend shows Pro
 */

import { db } from '@/server/db';
import { payment } from '@/server/db/schema';
import { config } from 'dotenv';
import { and, eq } from 'drizzle-orm';

config({ path: '.env.local' });

const CREEM_API_KEY = process.env.CREEM_API_KEY;
const CREEM_API_URL = 'https://api.creem.io/v1';

if (!CREEM_API_KEY) {
  console.error('❌ CREEM_API_KEY not found in environment variables');
  process.exit(1);
}

interface CreemSubscription {
  id: string;
  customer_id: string;
  product_id: string;
  status: string;
  interval: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

async function fetchCreemSubscriptions(): Promise<CreemSubscription[]> {
  console.log('📡 Fetching subscriptions from Creem API...\n');

  const response = await fetch(`${CREEM_API_URL}/subscriptions`, {
    headers: {
      Authorization: `Bearer ${CREEM_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Creem API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

async function compareSubscriptions() {
  try {
    // Fetch from Creem
    const creemSubs = await fetchCreemSubscriptions();

    console.log(`Found ${creemSubs.length} subscription(s) in Creem:\n`);

    for (const creemSub of creemSubs) {
      console.log('═'.repeat(80));
      console.log('🌐 CREEM SUBSCRIPTION DATA:');
      console.log('  ID:', creemSub.id);
      console.log('  Customer ID:', creemSub.customer_id);
      console.log('  Product ID:', creemSub.product_id);
      console.log('  Status:', creemSub.status);
      console.log('  Interval:', creemSub.interval);
      console.log('  Period:', creemSub.current_period_start, 'to', creemSub.current_period_end);
      console.log('  Cancel at Period End:', creemSub.cancel_at_period_end);

      // Determine plan based on product_id
      const proPlusMonthly = process.env.CREEM_PROPLUS_PLAN_PRODUCT_KEY_MONTHLY;
      const proPlusYearly = process.env.CREEM_PROPLUS_PLAN_PRODUCT_KEY_YEARLY;
      const proMonthly = process.env.CREEM_PRO_PLAN_PRODUCT_KEY_MONTHLY;
      const proYearly = process.env.CREEM_PRO_PLAN_PRODUCT_KEY_YEARLY;

      let expectedPlan = 'unknown';
      if (creemSub.product_id === proPlusMonthly || creemSub.product_id === proPlusYearly) {
        expectedPlan = 'Pro+';
      } else if (creemSub.product_id === proMonthly || creemSub.product_id === proYearly) {
        expectedPlan = 'Pro';
      }

      console.log('  → Expected Plan:', expectedPlan);
      console.log('');

      // Find matching subscription in database
      const dbSub = await db.query.payment.findFirst({
        where: and(eq(payment.subscriptionId, creemSub.id), eq(payment.provider, 'creem')),
      });

      if (dbSub) {
        console.log('💾 DATABASE SUBSCRIPTION DATA:');
        console.log('  ID:', dbSub.id);
        console.log('  User ID:', dbSub.userId);
        console.log('  Subscription ID:', dbSub.subscriptionId);
        console.log('  Product ID:', dbSub.productId);
        console.log('  Price ID:', dbSub.priceId);
        console.log('  Status:', dbSub.status);
        console.log('  Interval:', dbSub.interval);
        console.log('');

        // Check for mismatch
        const productMismatch = dbSub.productId !== creemSub.product_id;
        const statusMismatch = dbSub.status !== creemSub.status;

        if (productMismatch || statusMismatch) {
          console.log('⚠️  MISMATCH DETECTED:');
          if (productMismatch) {
            console.log(
              `  ❌ Product ID: DB has "${dbSub.productId}" but Creem has "${creemSub.product_id}"`
            );
          }
          if (statusMismatch) {
            console.log(`  ❌ Status: DB has "${dbSub.status}" but Creem has "${creemSub.status}"`);
          }
          console.log('');
          console.log('📝 SUGGESTED FIX:');
          console.log(`  UPDATE payment`);
          console.log(`  SET product_id = '${creemSub.product_id}',`);
          console.log(`      status = '${creemSub.status}'`);
          console.log(`  WHERE id = '${dbSub.id}';`);
        } else {
          console.log('✅ Database matches Creem data');
        }
      } else {
        console.log('⚠️  NOT FOUND IN DATABASE');
        console.log('  This subscription exists in Creem but not in your local database.');
        console.log('  You may need to sync it from a webhook event or checkout success.');
      }

      console.log('');
    }

    // Also check for database subscriptions not in Creem
    const dbSubs = await db.query.payment.findMany({
      where: and(eq(payment.provider, 'creem'), eq(payment.type, 'subscription')),
    });

    const creemSubIds = new Set(creemSubs.map((s) => s.id));
    const orphanedSubs = dbSubs.filter(
      (s) => s.subscriptionId && !creemSubIds.has(s.subscriptionId)
    );

    if (orphanedSubs.length > 0) {
      console.log('═'.repeat(80));
      console.log(
        `⚠️  Found ${orphanedSubs.length} subscription(s) in database but NOT in Creem:\n`
      );
      for (const orphan of orphanedSubs) {
        console.log(`  - Subscription ID: ${orphan.subscriptionId}`);
        console.log(`    User ID: ${orphan.userId}`);
        console.log(`    Status: ${orphan.status}`);
        console.log(`    Product ID: ${orphan.productId}`);
        console.log('');
      }
      console.log('These may be deleted/expired subscriptions that should be marked as canceled.');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
    process.exit(1);
  }
}

console.log('🔍 Verifying Creem Subscription Data\n');
console.log('Environment Variables:');
console.log(
  '  CREEM_PRO_PLAN_PRODUCT_KEY_MONTHLY:',
  process.env.CREEM_PRO_PLAN_PRODUCT_KEY_MONTHLY
);
console.log(
  '  CREEM_PROPLUS_PLAN_PRODUCT_KEY_MONTHLY:',
  process.env.CREEM_PROPLUS_PLAN_PRODUCT_KEY_MONTHLY
);
console.log('  CREEM_PRO_PLAN_PRODUCT_KEY_YEARLY:', process.env.CREEM_PRO_PLAN_PRODUCT_KEY_YEARLY);
console.log(
  '  CREEM_PROPLUS_PLAN_PRODUCT_KEY_YEARLY:',
  process.env.CREEM_PROPLUS_PLAN_PRODUCT_KEY_YEARLY
);
console.log('');

compareSubscriptions();
