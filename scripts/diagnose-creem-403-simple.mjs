import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local file explicitly
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const CREEM_API_KEY = process.env.CREEM_API_KEY;
const subscriptionId = 'sub_5EM6IgULEBVjEtMx5OH0TT';
const testMode = process.env.NEXT_PUBLIC_CREEM_TEST_MODE === 'true';
const proPlusProductId = process.env.CREEM_PROPLUS_PLAN_PRODUCT_KEY_MONTHLY;

console.log('=== Creem 403 Diagnostic ===\n');
console.log('Configuration:');
console.log('- API Key (first 10 chars):', CREEM_API_KEY?.substring(0, 10) + '...');
console.log('- Test Mode:', testMode);
console.log('- Subscription ID:', subscriptionId);
console.log('- Pro+ Product ID:', proPlusProductId);
console.log('\n');

async function test1() {
  console.log('Test 1: Retrieve subscription (GET)');
  try {
    const getResponse = await fetch(
      `https://api.creem.io/v1/subscriptions/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${CREEM_API_KEY}`,
        },
      }
    );

    console.log('Status:', getResponse.status, getResponse.statusText);
    
    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log('✅ SUCCESS - Can read subscription');
      console.log('Subscription details:');
      console.log('- Customer:', data.customer?.id || data.customerId);
      console.log('- Status:', data.status);
      console.log('- Product:', data.product?.id || data.productId);
      console.log('- Billing Period:', data.product?.billing_period || data.billingPeriod);
      console.log('- Current Period End:', data.current_period_end || data.currentPeriodEnd);
      console.log('- Cancel at Period End:', data.cancel_at_period_end || data.cancelAtPeriodEnd);
      return data;
    } else {
      const error = await getResponse.json().catch(() => ({}));
      console.log('❌ FAILED - Cannot read subscription');
      console.log('Error:', error);
      return null;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    return null;
  }
}

async function test2() {
  console.log('\nTest 2: List all subscriptions in account');
  try {
    const listResponse = await fetch('https://api.creem.io/v1/subscriptions', {
      headers: {
        Authorization: `Bearer ${CREEM_API_KEY}`,
      },
    });

    console.log('Status:', listResponse.status, listResponse.statusText);
    
    if (listResponse.ok) {
      const data = await listResponse.json();
      const subscriptions = data.data || data.subscriptions || [];
      console.log('✅ SUCCESS - Can list subscriptions');
      console.log('Total subscriptions:', subscriptions.length);
      
      const targetSub = subscriptions.find((s) => s.id === subscriptionId);
      if (targetSub) {
        console.log('✅ Target subscription FOUND in this account');
        return true;
      } else {
        console.log('❌ Target subscription NOT FOUND in this account');
        console.log('⚠️  This is the root cause - subscription belongs to different Creem account!');
        console.log('\nSubscriptions in this account:');
        subscriptions.forEach(s => {
          console.log(`  - ${s.id} (customer: ${s.customer?.id || s.customerId}, status: ${s.status})`);
        });
        return false;
      }
    } else {
      const error = await listResponse.json().catch(() => ({}));
      console.log('❌ FAILED');
      console.log('Error:', error);
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    return false;
  }
}

async function test3() {
  console.log('\nTest 3: Upgrade subscription (POST /upgrade)');
  try {
    const upgradeResponse = await fetch(
      `https://api.creem.io/v1/subscriptions/${subscriptionId}/upgrade`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CREEM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: proPlusProductId,
          update_behavior: 'proration-none',
        }),
      }
    );

    console.log('Status:', upgradeResponse.status, upgradeResponse.statusText);
    
    if (upgradeResponse.ok) {
      const data = await upgradeResponse.json();
      console.log('✅ SUCCESS - Upgrade worked!');
      console.log('Result:', data);
    } else {
      const error = await upgradeResponse.json().catch(() => ({}));
      console.log('❌ FAILED - Upgrade rejected');
      console.log('Error:', error);
      console.log('\n🔍 Possible causes:');
      console.log('1. API key belongs to different Creem account than subscription');
      console.log('2. Subscription is in test mode but API key is for production (or vice versa)');
      console.log('3. API key has read-only permissions');
      console.log('4. Subscription is in a state that prevents upgrades (e.g., canceled)');
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
}

async function main() {
  await test1();
  const ownershipOk = await test2();
  
  if (!ownershipOk) {
    console.log('\n❌ CRITICAL: Subscription not owned by this API key');
    console.log('\n📋 ACTION REQUIRED:');
    console.log('1. Log into Creem dashboard at https://app.creem.io');
    console.log('2. Navigate to API Keys section');
    console.log('3. Verify which account owns subscription:', subscriptionId);
    console.log('4. Generate new API key from the CORRECT account');
    console.log('5. Update CREEM_API_KEY in your .env file');
  } else {
    await test3();
  }
  
  console.log('\n=== End Diagnostic ===');
}

main().catch(console.error);
