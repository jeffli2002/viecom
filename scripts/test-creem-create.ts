/**
 * Test Creem API Key Write Capabilities
 *
 * This script attempts to CREATE resources via Creem API to verify
 * if the API key has write permissions. If this succeeds but reads fail,
 * it suggests a workspace/organization isolation issue.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

const CREEM_API_KEY = process.env.CREEM_API_KEY || '';
const CREEM_TEST_MODE = process.env.NEXT_PUBLIC_CREEM_TEST_MODE === 'true';

console.log('=== Test Creem API Write Capabilities ===\n');

async function testCreateCheckout(): Promise<void> {
  console.log('Test 1: Create Checkout Session');
  console.log('--------------------------------');

  const baseUrl = CREEM_TEST_MODE ? 'https://sandbox.creem.io/v1' : 'https://api.creem.io/v1';

  const testCheckout = {
    productId: 'test_product_123', // Will fail but shows if API accepts request
    requestId: `test_checkout_${Date.now()}`,
    customer: {
      email: 'test-api-validation@example.com',
    },
    successUrl: 'https://example.com/success',
    metadata: {
      test: 'api_write_validation',
    },
  };

  try {
    const response = await fetch(`${baseUrl}/checkouts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CREEM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCheckout),
    });

    const responseText = await response.text();
    let responseBody: unknown;

    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = responseText;
    }

    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(responseBody, null, 2));

    if (response.status === 403) {
      console.log('\n❌ 403 Forbidden on CREATE operation');
      console.log('   This confirms API key lacks permissions for ALL operations');
      console.log('   (not just specific resources)');
    } else if (response.status === 400 || response.status === 404) {
      console.log('\n✅ API key has write permissions!');
      console.log('   (Got validation error, which means request was accepted)');
      console.log('   This suggests the 403 on subscriptions is due to:');
      console.log('   - Subscription exists in different workspace/project');
      console.log('   - Subscription is in different environment (test vs live)');
    } else if (response.ok) {
      console.log('\n✅ Checkout created successfully!');
      console.log('   API key has full write permissions');
    }
  } catch (error) {
    console.log('Error:', error instanceof Error ? error.message : String(error));
  }
}

async function testCreateCustomer(): Promise<void> {
  console.log('\n\nTest 2: Create Customer');
  console.log('------------------------');

  const baseUrl = CREEM_TEST_MODE ? 'https://sandbox.creem.io/v1' : 'https://api.creem.io/v1';

  const testCustomer = {
    email: `test-${Date.now()}@example.com`,
    metadata: {
      test: 'api_write_validation',
    },
  };

  try {
    const response = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CREEM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCustomer),
    });

    const responseText = await response.text();
    let responseBody: unknown;

    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = responseText;
    }

    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(responseBody, null, 2));

    if (response.status === 403) {
      console.log('\n❌ 403 Forbidden on customer creation');
    } else if (response.ok) {
      console.log('\n✅ Customer created successfully!');
      console.log('   Attempting to retrieve customer...');

      const customerId = (responseBody as { id?: string })?.id;
      if (customerId) {
        await testRetrieveCustomer(customerId);
      }
    }
  } catch (error) {
    console.log('Error:', error instanceof Error ? error.message : String(error));
  }
}

async function testRetrieveCustomer(customerId: string): Promise<void> {
  const baseUrl = CREEM_TEST_MODE ? 'https://sandbox.creem.io/v1' : 'https://api.creem.io/v1';

  try {
    const response = await fetch(`${baseUrl}/customers/${customerId}`, {
      headers: {
        Authorization: `Bearer ${CREEM_API_KEY}`,
      },
    });

    const responseText = await response.text();
    let responseBody: unknown;

    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = responseText;
    }

    console.log(`\n   Retrieve Status: ${response.status}`);

    if (response.ok) {
      console.log('   ✅ Can retrieve own created customer');
    } else {
      console.log('   ❌ Cannot retrieve own created customer!');
      console.log('   This would be very unusual...');
    }
  } catch (error) {
    console.log('   Error:', error instanceof Error ? error.message : String(error));
  }
}

async function runTests(): Promise<void> {
  await testCreateCheckout();
  await testCreateCustomer();

  console.log('\n\n=== Summary ===');
  console.log('If CREATE operations return 403:');
  console.log('  → API key fundamentally lacks permissions');
  console.log('  → Need to regenerate API key or contact Creem support');
  console.log('');
  console.log('If CREATE succeeds but GET existing resources fails:');
  console.log('  → Resources exist in different workspace/environment');
  console.log('  → Need to use correct API key for that workspace');
  console.log('  → Or create new subscriptions with current API key');
}

runTests().catch(console.error);
