#!/usr/bin/env node

/**
 * Comprehensive Creem API Capability Test
 * 
 * This script tests what operations the API key can and cannot perform:
 * 1. List products
 * 2. List customers
 * 3. Retrieve specific subscription
 * 4. List all subscriptions
 * 5. Create a test checkout
 * 
 * Usage: node scripts/test-creem-api-capabilities.mjs
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local file explicitly
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const CREEM_API_KEY = process.env.CREEM_API_KEY;
const CREEM_TEST_MODE = process.env.NEXT_PUBLIC_CREEM_TEST_MODE === 'true';
const SUBSCRIPTION_ID = 'sub_5EM6IgULEBVjEtMx5OH0TT'; // The subscription ID from the diagnostic

// Creem uses the same API endpoint for both test and production
// The mode is determined by the API key prefix (creem_test_ vs creem_live_)
const BASE_URL = 'https://api.creem.io/v1';

console.log('='.repeat(80));
console.log('CREEM API CAPABILITY TEST');
console.log('='.repeat(80));
console.log(`API Key: ${CREEM_API_KEY ? CREEM_API_KEY.substring(0, 20) + '...' : 'NOT SET'}`);
console.log(`Test Mode: ${CREEM_TEST_MODE}`);
console.log(`Base URL: ${BASE_URL}`);
console.log(`Subscription ID to test: ${SUBSCRIPTION_ID}`);
console.log('='.repeat(80));
console.log();

if (!CREEM_API_KEY) {
  console.error('❌ CREEM_API_KEY not found in environment variables');
  process.exit(1);
}

/**
 * Helper function to make API calls
 */
async function makeApiCall(endpoint, method = 'GET', body = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${CREEM_API_KEY}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`\n📡 ${method} ${url}`);
  
  try {
    const response = await fetch(url, options);
    const statusEmoji = response.ok ? '✅' : '❌';
    console.log(`${statusEmoji} Status: ${response.status} ${response.statusText}`);
    
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { _raw: text };
    }
    
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data,
    };
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return {
      ok: false,
      status: 0,
      statusText: error.message,
      data: null,
    };
  }
}

/**
 * Test 1: List Products
 */
async function testListProducts() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 1: List Products');
  console.log('='.repeat(80));
  console.log('This tests if the API key has read access to products in the account.');
  
  const result = await makeApiCall('/products');
  
  if (result.ok) {
    console.log('✅ SUCCESS: Can list products');
    if (Array.isArray(result.data)) {
      console.log(`📦 Found ${result.data.length} product(s)`);
      result.data.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name || product.id} (${product.id})`);
      });
    } else if (result.data.data && Array.isArray(result.data.data)) {
      console.log(`📦 Found ${result.data.data.length} product(s)`);
      result.data.data.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name || product.id} (${product.id})`);
      });
    } else {
      console.log('📦 Response:', JSON.stringify(result.data, null, 2));
    }
  } else {
    console.log(`❌ FAILED: Cannot list products (${result.status})`);
    console.log('Response:', JSON.stringify(result.data, null, 2));
  }
  
  return result;
}

/**
 * Test 2: List Customers
 */
async function testListCustomers() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 2: List Customers');
  console.log('='.repeat(80));
  console.log('This tests if the API key has read access to customers in the account.');
  
  const result = await makeApiCall('/customers');
  
  if (result.ok) {
    console.log('✅ SUCCESS: Can list customers');
    if (Array.isArray(result.data)) {
      console.log(`👥 Found ${result.data.length} customer(s)`);
      result.data.forEach((customer, index) => {
        console.log(`   ${index + 1}. ${customer.email || customer.id} (${customer.id})`);
      });
    } else if (result.data.data && Array.isArray(result.data.data)) {
      console.log(`👥 Found ${result.data.data.length} customer(s)`);
      result.data.data.forEach((customer, index) => {
        console.log(`   ${index + 1}. ${customer.email || customer.id} (${customer.id})`);
      });
    } else {
      console.log('👥 Response:', JSON.stringify(result.data, null, 2));
    }
  } else {
    console.log(`❌ FAILED: Cannot list customers (${result.status})`);
    console.log('Response:', JSON.stringify(result.data, null, 2));
  }
  
  return result;
}

/**
 * Test 3: List All Subscriptions
 */
async function testListSubscriptions() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 3: List All Subscriptions');
  console.log('='.repeat(80));
  console.log('This tests if the API key has read access to subscriptions in the account.');
  
  const result = await makeApiCall('/subscriptions');
  
  if (result.ok) {
    console.log('✅ SUCCESS: Can list subscriptions');
    if (Array.isArray(result.data)) {
      console.log(`📋 Found ${result.data.length} subscription(s)`);
      result.data.forEach((sub, index) => {
        console.log(`   ${index + 1}. ${sub.id} - Status: ${sub.status}`);
      });
    } else if (result.data.data && Array.isArray(result.data.data)) {
      console.log(`📋 Found ${result.data.data.length} subscription(s)`);
      result.data.data.forEach((sub, index) => {
        console.log(`   ${index + 1}. ${sub.id} - Status: ${sub.status}`);
      });
    } else {
      console.log('📋 Response:', JSON.stringify(result.data, null, 2));
    }
  } else {
    console.log(`❌ FAILED: Cannot list subscriptions (${result.status})`);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    
    if (result.status === 403) {
      console.log('\n⚠️  403 FORBIDDEN ERROR DETECTED');
      console.log('This means the API key does NOT have permission to list subscriptions.');
      console.log('Possible causes:');
      console.log('  1. API key has limited scope (e.g., only checkout creation)');
      console.log('  2. API key is from a different project than the subscription');
      console.log('  3. API key permissions were restricted when regenerated');
    }
  }
  
  return result;
}

/**
 * Test 4: Retrieve Specific Subscription
 */
async function testRetrieveSubscription() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 4: Retrieve Specific Subscription');
  console.log('='.repeat(80));
  console.log(`This tests if the API key can retrieve subscription: ${SUBSCRIPTION_ID}`);
  
  const result = await makeApiCall(`/subscriptions/${SUBSCRIPTION_ID}`);
  
  if (result.ok) {
    console.log('✅ SUCCESS: Can retrieve this subscription');
    console.log('📄 Subscription details:', JSON.stringify(result.data, null, 2));
  } else {
    console.log(`❌ FAILED: Cannot retrieve this subscription (${result.status})`);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    
    if (result.status === 404) {
      console.log('\n⚠️  404 NOT FOUND ERROR DETECTED');
      console.log('This means one of the following:');
      console.log('  1. The subscription ID is incorrect');
      console.log('  2. The subscription exists in a different environment (test vs production)');
      console.log('  3. The subscription exists in a different Creem project/account');
      console.log('  4. The subscription was deleted');
      
      // Check if subscription ID format suggests test vs production
      if (SUBSCRIPTION_ID.includes('test_')) {
        console.log('\n💡 The subscription ID contains "test_" - it\'s a test mode subscription');
        console.log(`   Current API key mode: ${CREEM_TEST_MODE ? 'TEST' : 'PRODUCTION'}`);
        if (!CREEM_TEST_MODE) {
          console.log('   ⚠️  MISMATCH: Using production API key for test subscription!');
        }
      } else {
        console.log('\n💡 The subscription ID does NOT contain "test_" - it might be production');
        console.log(`   Current API key mode: ${CREEM_TEST_MODE ? 'TEST' : 'PRODUCTION'}`);
        if (CREEM_TEST_MODE) {
          console.log('   ⚠️  MISMATCH: Using test API key for production subscription!');
        }
      }
    }
  }
  
  return result;
}

/**
 * Test 5: Create Test Checkout (Write Operation)
 */
async function testCreateCheckout() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 5: Create Test Checkout');
  console.log('='.repeat(80));
  console.log('This tests if the API key has write permissions (create checkouts).');
  
  const PRO_MONTHLY_PRODUCT = process.env.CREEM_PRO_PLAN_PRODUCT_KEY_MONTHLY;
  
  if (!PRO_MONTHLY_PRODUCT) {
    console.log('⚠️  SKIPPED: CREEM_PRO_PLAN_PRODUCT_KEY_MONTHLY not configured');
    return { ok: false, skipped: true };
  }
  
  const testCheckoutRequest = {
    productId: PRO_MONTHLY_PRODUCT,
    requestId: `test_checkout_${Date.now()}`,
    successUrl: 'http://localhost:3000/success',
    metadata: {
      test: 'capability_test',
    },
    customer: {
      email: 'test@example.com',
    },
  };
  
  console.log('Checkout request:', JSON.stringify(testCheckoutRequest, null, 2));
  
  const result = await makeApiCall('/checkouts', 'POST', testCheckoutRequest);
  
  if (result.ok) {
    console.log('✅ SUCCESS: Can create checkouts');
    console.log('🎟️  Checkout created:', JSON.stringify(result.data, null, 2));
    console.log('\n⚠️  NOTE: This is a real checkout. You may want to delete it from the Creem dashboard.');
  } else {
    console.log(`❌ FAILED: Cannot create checkouts (${result.status})`);
    console.log('Response:', JSON.stringify(result.data, null, 2));
  }
  
  return result;
}

/**
 * Run all tests
 */
async function runAllTests() {
  const results = {
    products: await testListProducts(),
    customers: await testListCustomers(),
    subscriptions: await testListSubscriptions(),
    specificSubscription: await testRetrieveSubscription(),
    createCheckout: await testCreateCheckout(),
  };
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  console.log('\nAPI Key Capabilities:');
  console.log(`  List Products:           ${results.products.ok ? '✅ YES' : '❌ NO'}`);
  console.log(`  List Customers:          ${results.customers.ok ? '✅ YES' : '❌ NO'}`);
  console.log(`  List Subscriptions:      ${results.subscriptions.ok ? '✅ YES' : '❌ NO'}`);
  console.log(`  Retrieve Subscription:   ${results.specificSubscription.ok ? '✅ YES' : '❌ NO'}`);
  console.log(`  Create Checkout:         ${results.createCheckout.skipped ? '⚠️  SKIPPED' : results.createCheckout.ok ? '✅ YES' : '❌ NO'}`);
  
  console.log('\n' + '='.repeat(80));
  console.log('DIAGNOSIS');
  console.log('='.repeat(80));
  
  // Analyze results
  if (!results.subscriptions.ok && results.subscriptions.status === 403) {
    console.log('\n🔴 CRITICAL ISSUE: 403 Forbidden when listing subscriptions');
    console.log('\nPossible Root Causes:');
    console.log('  1. API key has limited scope (read-only or specific resources)');
    console.log('  2. API key was regenerated with restricted permissions');
    console.log('  3. API key belongs to a different project in the Creem account');
    console.log('  4. Creem account has multiple projects and the key is scoped to one');
    console.log('\nRecommended Actions:');
    console.log('  1. Check Creem dashboard: Settings → API Keys');
    console.log('  2. Verify the API key shows "Full Access" or "Read/Write"');
    console.log('  3. Check if there are multiple projects in your Creem account');
    console.log('  4. Try creating a NEW API key with full permissions');
    console.log('  5. Contact Creem support to verify API key scope');
  }
  
  if (!results.specificSubscription.ok && results.specificSubscription.status === 404) {
    console.log('\n🔴 CRITICAL ISSUE: 404 Not Found for specific subscription');
    console.log('\nPossible Root Causes:');
    console.log('  1. Test/Production mode mismatch');
    console.log('  2. Subscription in different Creem project');
    console.log('  3. Subscription ID is incorrect or was deleted');
    console.log('\nRecommended Actions:');
    console.log('  1. Log into Creem dashboard and verify the subscription exists');
    console.log('  2. Check which project/account the subscription is under');
    console.log('  3. Verify test mode setting matches subscription environment');
    console.log('  4. Try listing all subscriptions from the Creem dashboard');
  }
  
  if (results.products.ok && results.customers.ok && !results.subscriptions.ok) {
    console.log('\n⚠️  PARTIAL ACCESS DETECTED');
    console.log('The API key can access some resources but not subscriptions.');
    console.log('This strongly suggests the API key has SCOPED permissions.');
  }
  
  if (!results.products.ok && !results.customers.ok && !results.subscriptions.ok) {
    console.log('\n🔴 CRITICAL ISSUE: API key has NO read access to any resources');
    console.log('The API key might be invalid, revoked, or from wrong environment.');
    console.log('\nRecommended Actions:');
    console.log('  1. Verify you copied the API key correctly');
    console.log('  2. Check if the API key was revoked in Creem dashboard');
    console.log('  3. Regenerate a new API key with full permissions');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('Environment Configuration Check:');
  console.log('='.repeat(80));
  console.log(`CREEM_API_KEY: ${CREEM_API_KEY ? '✅ Set' : '❌ Not Set'}`);
  console.log(`NEXT_PUBLIC_CREEM_TEST_MODE: ${process.env.NEXT_PUBLIC_CREEM_TEST_MODE || 'false'}`);
  console.log(`Detected Mode: ${CREEM_TEST_MODE ? 'TEST' : 'PRODUCTION'}`);
  console.log(`API Key Type: ${CREEM_API_KEY.startsWith('creem_test_') ? 'TEST' : CREEM_API_KEY.startsWith('creem_live_') ? 'PRODUCTION' : 'UNKNOWN'}`);
  
  if (CREEM_TEST_MODE && !CREEM_API_KEY.startsWith('creem_test_')) {
    console.log('\n⚠️  WARNING: Test mode is enabled but API key does not start with "creem_test_"');
  }
  if (!CREEM_TEST_MODE && !CREEM_API_KEY.startsWith('creem_live_')) {
    console.log('\n⚠️  WARNING: Production mode but API key does not start with "creem_live_"');
  }
  
  console.log('\n' + '='.repeat(80));
}

// Run the tests
runAllTests().catch(console.error);
