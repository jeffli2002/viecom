/**
 * Check what Creem actually has for subscriptions
 * Tests both production and test mode
 */

import { resolve } from 'path';
import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: resolve(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL!;
const CREEM_API_KEY = process.env.CREEM_API_KEY!;

const sql = postgres(DATABASE_URL);

async function checkCreemSubscription(subscriptionId: string, testMode: boolean) {
  const baseUrl = 'https://api.creem.io/v1/subscriptions';

  try {
    const response = await fetch(`${baseUrl}/${subscriptionId}`, {
      headers: {
        Authorization: `Bearer ${CREEM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        found: false,
        status: null,
        mode: testMode ? 'TEST' : 'PROD',
        error: response.status,
      };
    }

    const data = await response.json();
    return {
      found: true,
      status: data.status,
      mode: testMode ? 'TEST' : 'PROD',
      priceId: data.product?.id || data.price_id,
      customerId: data.customer?.id || data.customer,
    };
  } catch (error) {
    return { found: false, status: null, mode: testMode ? 'TEST' : 'PROD', error: 'fetch_error' };
  }
}

async function listAllCreemSubscriptions(testMode: boolean) {
  const baseUrl = 'https://api.creem.io/v1/subscriptions';

  try {
    const response = await fetch(baseUrl, {
      headers: {
        Authorization: `Bearer ${CREEM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, error: response.status, subscriptions: [] };
    }

    const data = await response.json();
    return {
      success: true,
      subscriptions: data.data || data.subscriptions || [],
      mode: testMode ? 'TEST' : 'PROD',
    };
  } catch (error) {
    return { success: false, error: 'fetch_error', subscriptions: [] };
  }
}

async function main() {
  console.log('🔍 Checking Creem subscriptions...\n');

  // Get all subscriptions from DB
  const dbSubs = await sql`
    SELECT subscription_id, status, price_id, user_id, created_at
    FROM payment 
    WHERE provider = 'creem' 
    ORDER BY created_at DESC
    LIMIT 5
  `;

  console.log(`📊 Database (latest 5 subscriptions):`);
  console.table(
    dbSubs.map((s) => ({
      'Subscription ID': s.subscription_id?.substring(0, 25),
      'DB Status': s.status,
      Plan: s.price_id,
      Created: new Date(s.created_at).toISOString().split('T')[0],
    }))
  );

  // Check what Creem has (LIST ALL)
  console.log('\n🌐 Checking Creem API (LIST ALL subscriptions)...\n');

  const prodList = await listAllCreemSubscriptions(false);
  const testList = await listAllCreemSubscriptions(true);

  console.log(`\n📋 PRODUCTION MODE:`);
  if (prodList.success) {
    console.log(`   Found: ${prodList.subscriptions.length} subscriptions`);
    if (prodList.subscriptions.length > 0) {
      console.table(
        prodList.subscriptions.slice(0, 5).map((s: any) => ({
          'Subscription ID': s.id?.substring(0, 25),
          Status: s.status,
          Customer: s.customer?.id?.substring(0, 20) || s.customer?.substring(0, 20),
          Product: s.product?.id?.substring(0, 20) || s.price_id?.substring(0, 20),
        }))
      );
    }
  } else {
    console.log(`   ❌ Error: ${prodList.error}`);
  }

  console.log(`\n📋 TEST MODE:`);
  if (testList.success) {
    console.log(`   Found: ${testList.subscriptions.length} subscriptions`);
    if (testList.subscriptions.length > 0) {
      console.table(
        testList.subscriptions.slice(0, 5).map((s: any) => ({
          'Subscription ID': s.id?.substring(0, 25),
          Status: s.status,
          Customer: s.customer?.id?.substring(0, 20) || s.customer?.substring(0, 20),
          Product: s.product?.id?.substring(0, 20) || s.price_id?.substring(0, 20),
        }))
      );
    }
  } else {
    console.log(`   ❌ Error: ${testList.error}`);
  }

  // Check individual subscriptions from DB
  console.log('\n\n🔍 Checking individual DB subscriptions in Creem...\n');

  for (const dbSub of dbSubs.slice(0, 3)) {
    if (!dbSub.subscription_id) continue;

    console.log(`Checking ${dbSub.subscription_id} (DB status: ${dbSub.status})...`);

    const prodResult = await checkCreemSubscription(dbSub.subscription_id, false);
    const testResult = await checkCreemSubscription(dbSub.subscription_id, true);

    console.log(
      `  PROD: ${prodResult.found ? `✓ Found (${prodResult.status})` : `✗ Not found (${prodResult.error})`}`
    );
    console.log(
      `  TEST: ${testResult.found ? `✓ Found (${testResult.status})` : `✗ Not found (${testResult.error})`}`
    );

    if (prodResult.found || testResult.found) {
      const result = prodResult.found ? prodResult : testResult;
      console.log(`  → Creem Status: ${result.status}`);
      console.log(`  → DB Status: ${dbSub.status}`);
      console.log(`  → ${result.status === dbSub.status ? '✅ MATCH' : '❌ MISMATCH'}`);
    }
    console.log();
  }

  console.log('\n' + '='.repeat(60));
  console.log('💡 RECOMMENDATION:');
  console.log('='.repeat(60));

  const totalCreem = (prodList.subscriptions.length || 0) + (testList.subscriptions.length || 0);
  const totalDb = dbSubs.length;

  if (prodList.subscriptions.length > 0 && testList.subscriptions.length === 0) {
    console.log('⚠️  Your subscriptions are in PRODUCTION mode');
    console.log('   But NEXT_PUBLIC_CREEM_TEST_MODE="true" in .env.local');
    console.log('   This is why the sync script found nothing!');
    console.log('\n   FIX: Set NEXT_PUBLIC_CREEM_TEST_MODE="false" in .env.local');
  } else if (testList.subscriptions.length > 0 && prodList.subscriptions.length === 0) {
    console.log('✅ Your subscriptions are in TEST mode (correct)');
  } else if (totalCreem > totalDb) {
    console.log(`⚠️  Creem has ${totalCreem} subscriptions but DB has ${totalDb}`);
    console.log('   Some subscriptions might be missing from your database!');
  }

  await sql.end();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
