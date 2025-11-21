/**
 * Comprehensive Creem API Key Diagnosis Script
 *
 * This script validates the API key format and tests various Creem API endpoints
 * to identify the root cause of 403 Forbidden errors.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

const CREEM_API_KEY = process.env.CREEM_API_KEY || '';
const CREEM_TEST_MODE = process.env.NEXT_PUBLIC_CREEM_TEST_MODE === 'true';

// Known subscription and customer IDs from previous attempts
const TEST_SUBSCRIPTION_ID = 'sub_5EM6IgULEBVjEtMx5OH0TT';
const TEST_CUSTOMER_ID = 'cus_PEH36FMRzBtU2oQY4s2ynH'; // from previous logs

console.log('=== Creem API Key Diagnostics ===\n');

// Step 1: Validate API Key Format
console.log('Step 1: API Key Format Validation');
console.log('-----------------------------------');

function validateApiKeyFormat(apiKey: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check for empty or undefined
  if (!apiKey) {
    issues.push('API key is empty or undefined');
    return { valid: false, issues };
  }

  // Check for whitespace
  if (apiKey !== apiKey.trim()) {
    issues.push('API key has leading/trailing whitespace');
  }

  // Check for line breaks
  if (apiKey.includes('\n') || apiKey.includes('\r')) {
    issues.push('API key contains line breaks');
  }

  // Check for expected prefix
  const expectedPrefix = CREEM_TEST_MODE ? 'creem_test_' : 'creem_live_';
  if (!apiKey.startsWith(expectedPrefix)) {
    issues.push(
      `API key should start with '${expectedPrefix}' but starts with '${apiKey.substring(0, 11)}'`
    );
  }

  // Check length (typical API keys are 30-50 chars)
  if (apiKey.length < 20) {
    issues.push(`API key seems too short (${apiKey.length} characters)`);
  }

  // Check for common copy-paste errors
  if (apiKey.includes(' ')) {
    issues.push('API key contains spaces');
  }

  // Display key info
  console.log(`Key prefix: ${apiKey.substring(0, 11)}...`);
  console.log(`Key length: ${apiKey.length} characters`);
  console.log(`Test mode: ${CREEM_TEST_MODE}`);
  console.log(`Expected prefix: ${expectedPrefix}`);

  if (issues.length === 0) {
    console.log('✅ API key format looks valid\n');
    return { valid: true, issues: [] };
  } else {
    console.log('❌ API key format issues detected:');
    issues.forEach((issue) => console.log(`   - ${issue}`));
    console.log('');
    return { valid: false, issues };
  }
}

const keyValidation = validateApiKeyFormat(CREEM_API_KEY);

// Step 2: Check Environment Mismatch
console.log('Step 2: Environment Mismatch Detection');
console.log('---------------------------------------');

function checkEnvironmentMismatch(apiKey: string, subscriptionId: string): void {
  const isTestKey = apiKey.startsWith('creem_test_');
  const isLiveKey = apiKey.startsWith('creem_live_');
  const hasTestPrefix = subscriptionId.includes('test_');

  console.log(`API Key type: ${isTestKey ? 'TEST' : isLiveKey ? 'LIVE' : 'UNKNOWN'}`);
  console.log(`Subscription ID: ${subscriptionId}`);
  console.log(`Subscription has test prefix: ${hasTestPrefix ? 'YES' : 'NO'}`);

  if (isTestKey && !hasTestPrefix) {
    console.log('⚠️  WARNING: Test API key but production subscription ID');
    console.log('   This is the likely cause of 403 Forbidden!');
    console.log('   Test keys can only access test mode resources.');
  } else if (isLiveKey && hasTestPrefix) {
    console.log('⚠️  WARNING: Live API key but test subscription ID');
  } else {
    console.log('✅ Environment appears consistent\n');
  }
  console.log('');
}

checkEnvironmentMismatch(CREEM_API_KEY, TEST_SUBSCRIPTION_ID);

// Step 3: Test API Endpoints
console.log('Step 3: Testing Creem API Endpoints');
console.log('------------------------------------');

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  error?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

async function testEndpoint(endpoint: string, method = 'GET', body?: unknown): Promise<TestResult> {
  const baseUrl = CREEM_TEST_MODE ? 'https://sandbox.creem.io/v1' : 'https://api.creem.io/v1';

  const url = `${baseUrl}${endpoint}`;

  try {
    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${CREEM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const responseText = await response.text();

    let responseBody: unknown;
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = responseText;
    }

    return {
      endpoint,
      method,
      status: response.status,
      success: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseBody,
      error: !response.ok ? `HTTP ${response.status}: ${response.statusText}` : undefined,
    };
  } catch (error) {
    return {
      endpoint,
      method,
      status: 0,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runApiTests(): Promise<void> {
  const tests: Promise<TestResult>[] = [
    // Test 1: List products (should work for any valid key)
    testEndpoint('/products', 'GET'),

    // Test 2: Get specific subscription (the problematic one)
    testEndpoint(`/subscriptions/${TEST_SUBSCRIPTION_ID}`, 'GET'),

    // Test 3: List all subscriptions
    testEndpoint('/subscriptions', 'GET'),

    // Test 4: List customers
    testEndpoint('/customers', 'GET'),

    // Test 5: Get specific customer
    testEndpoint(`/customers/${TEST_CUSTOMER_ID}`, 'GET'),

    // Test 6: Try to create a test checkout (write operation)
    testEndpoint('/checkouts', 'POST', {
      productId: 'test_product',
      requestId: `test_${Date.now()}`,
      customer: { email: 'test@example.com' },
      successUrl: 'https://example.com/success',
    }),
  ];

  const results = await Promise.all(tests);

  console.log('Test Results:');
  console.log('-------------');

  results.forEach((result, index) => {
    console.log(`\nTest ${index + 1}: ${result.method} ${result.endpoint}`);
    console.log(`Status: ${result.status} ${result.success ? '✅' : '❌'}`);

    if (result.error) {
      console.log(`Error: ${result.error}`);
    }

    if (result.body && typeof result.body === 'object') {
      console.log('Response:', JSON.stringify(result.body, null, 2));
    }
  });

  // Analysis
  console.log('\n=== Analysis ===');
  const allFailed = results.every((r) => !r.success);
  const allForbidden = results.every((r) => r.status === 403);
  const someFailed = results.some((r) => !r.success);
  const someSucceeded = results.some((r) => r.success);

  if (allFailed && allForbidden) {
    console.log('❌ ALL requests returned 403 Forbidden');
    console.log('   Possible causes:');
    console.log('   1. API key has no permissions (but Creem has no permission settings)');
    console.log('   2. API key is in wrong workspace/organization');
    console.log('   3. API key is test mode but resources are production (or vice versa)');
    console.log('   4. Account-level restriction or API key revoked');
    console.log('   5. Wrong base URL (test vs production endpoint)');
  } else if (someSucceeded && someFailed) {
    console.log('⚠️  MIXED results - some succeeded, some failed');
    console.log('   This suggests selective permissions or resource visibility issues');
    console.log('   \nSucceeded:');
    results
      .filter((r) => r.success)
      .forEach((r) => {
        console.log(`   ✅ ${r.method} ${r.endpoint}`);
      });
    console.log('   \nFailed:');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   ❌ ${r.method} ${r.endpoint} (${r.status})`);
      });
  } else if (someSucceeded) {
    console.log('✅ Some requests succeeded');
    console.log('   API key has at least partial access');
  }
}

// Step 4: Test with Creem SDK
console.log('\nStep 4: Testing with Creem SDK');
console.log('-------------------------------');

async function testCreemSdk(): Promise<void> {
  try {
    const { Creem } = await import('creem');

    // Test both server indices
    for (const serverIdx of [0, 1]) {
      console.log(
        `\nTesting with serverIdx: ${serverIdx} (${serverIdx === 0 ? 'production' : 'sandbox'})`
      );

      const creem = new Creem({ serverIdx });

      try {
        const result = await creem.retrieveSubscription({
          subscriptionId: TEST_SUBSCRIPTION_ID,
          xApiKey: CREEM_API_KEY,
        });

        console.log(`✅ SUCCESS with serverIdx ${serverIdx}`);
        console.log('Subscription:', JSON.stringify(result, null, 2));
      } catch (error) {
        console.log(`❌ FAILED with serverIdx ${serverIdx}`);
        console.log('Error:', error instanceof Error ? error.message : String(error));
      }
    }
  } catch (error) {
    console.log('❌ Could not load Creem SDK');
    console.log('Error:', error instanceof Error ? error.message : String(error));
  }
}

// Run all diagnostics
async function runDiagnostics(): Promise<void> {
  if (!keyValidation.valid) {
    console.log('⚠️  API key format issues detected. Fix these first before continuing.\n');
  }

  await runApiTests();
  await testCreemSdk();

  console.log('\n=== Recommendations ===');
  console.log('Based on the test results:');
  console.log('1. If ALL requests fail with 403:');
  console.log('   - Verify you copied the API key correctly from Creem dashboard');
  console.log('   - Check if subscription was created in a different workspace/project');
  console.log('   - Try creating a NEW test subscription via the API');
  console.log('   - Contact Creem support to verify API key permissions');
  console.log('');
  console.log('2. If test key fails but environment shows mismatch:');
  console.log('   - Use a LIVE API key to access production subscriptions');
  console.log('   - Or create test mode subscriptions with the test key');
  console.log('');
  console.log('3. If SDK works with different serverIdx:');
  console.log('   - Update NEXT_PUBLIC_CREEM_TEST_MODE environment variable');
  console.log('');
  console.log('4. Next steps:');
  console.log('   - Run: npm run diagnose-create-subscription');
  console.log('   - This will test if API key can CREATE resources');
}

runDiagnostics().catch(console.error);
