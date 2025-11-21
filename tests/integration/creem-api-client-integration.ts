import crypto from 'node:crypto';
import { CreemApiClient } from '../../packages/creem-subscription/core/api-client';

const TEST_API_KEY = 'creem_test_mock_key_123456';
const TEST_WEBHOOK_SECRET = 'test_webhook_secret_123';

console.log('🧪 CreemApiClient Integration Tests\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ ${message}`);
    passedTests++;
  } else {
    console.error(`❌ ${message}`);
    failedTests++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('📋 Test Suite: Constructor & Configuration\n');

  try {
    const testClient = new CreemApiClient({
      apiKey: TEST_API_KEY,
      webhookSecret: TEST_WEBHOOK_SECRET,
    });

    assert(
      testClient['config'].testMode === true,
      'Test mode auto-detected from creem_test_ prefix'
    );

    assert(
      testClient['config'].baseUrl === 'https://test-api.creem.io',
      'Test API URL configured correctly'
    );

    assert(testClient['config'].timeout === 30000, 'Default timeout is 30000ms');
  } catch (error) {
    console.error('❌ Configuration test failed:', error);
    failedTests++;
  }

  console.log('\n📋 Test Suite: Production Mode Detection\n');

  try {
    const prodClient = new CreemApiClient({
      apiKey: 'creem_live_123456',
      webhookSecret: TEST_WEBHOOK_SECRET,
    });

    assert(
      prodClient['config'].testMode === false,
      'Production mode detected from creem_live_ prefix'
    );

    assert(
      prodClient['config'].baseUrl === 'https://api.creem.io',
      'Production API URL configured correctly'
    );
  } catch (error) {
    console.error('❌ Production mode test failed:', error);
    failedTests++;
  }

  console.log('\n📋 Test Suite: Custom Configuration\n');

  try {
    const customClient = new CreemApiClient({
      apiKey: TEST_API_KEY,
      webhookSecret: TEST_WEBHOOK_SECRET,
      baseUrl: 'https://custom.creem.io',
      timeout: 60000,
    });

    assert(
      customClient['config'].baseUrl === 'https://custom.creem.io',
      'Custom base URL configured'
    );

    assert(customClient['config'].timeout === 60000, 'Custom timeout configured');
  } catch (error) {
    console.error('❌ Custom configuration test failed:', error);
    failedTests++;
  }

  console.log('\n📋 Test Suite: Error Handling\n');

  try {
    let errorThrown = false;
    try {
      new CreemApiClient({
        apiKey: '',
        webhookSecret: TEST_WEBHOOK_SECRET,
      });
    } catch (error) {
      errorThrown = true;
      assert(
        (error as Error).message.includes('API key is required'),
        'Error thrown for missing API key'
      );
    }

    assert(errorThrown, 'Constructor throws error for empty API key');
  } catch (error) {
    console.error('❌ Error handling test failed:', error);
    failedTests++;
  }

  console.log('\n📋 Test Suite: Webhook Signature Verification\n');

  try {
    const client = new CreemApiClient({
      apiKey: TEST_API_KEY,
      webhookSecret: TEST_WEBHOOK_SECRET,
    });

    const payload = '{"event":"subscription.created","data":{"id":"sub_123"}}';
    const hmac = crypto.createHmac('sha256', TEST_WEBHOOK_SECRET);
    const validSignature = hmac.update(payload).digest('hex');

    const isValid = client.verifyWebhookSignature(payload, validSignature);
    assert(isValid === true, 'Valid webhook signature verified');

    const isInvalid = client.verifyWebhookSignature(payload, 'invalid_signature');
    assert(isInvalid === false, 'Invalid webhook signature rejected');

    const wrongSecretHmac = crypto.createHmac('sha256', 'wrong_secret');
    const wrongSignature = wrongSecretHmac.update(payload).digest('hex');
    const isWrong = client.verifyWebhookSignature(payload, wrongSignature);
    assert(isWrong === false, 'Signature with wrong secret rejected');
  } catch (error) {
    console.error('❌ Webhook signature test failed:', error);
    failedTests++;
  }

  console.log('\n📋 Test Suite: Webhook Event Parsing\n');

  try {
    const client = new CreemApiClient({
      apiKey: TEST_API_KEY,
      webhookSecret: TEST_WEBHOOK_SECRET,
    });

    const validPayload =
      '{"event":"subscription.created","data":{"id":"sub_123","status":"active"}}';
    const parsed = client.parseWebhookEvent(validPayload);

    assert(parsed.event === 'subscription.created', 'Event type parsed correctly');

    assert((parsed.data as any).id === 'sub_123', 'Event data parsed correctly');

    let parseError = false;
    try {
      client.parseWebhookEvent('{invalid json}');
    } catch (error) {
      parseError = true;
      assert(
        (error as Error).message.includes('Invalid webhook event payload'),
        'Error thrown for invalid JSON'
      );
    }

    assert(parseError, 'Invalid JSON throws error');
  } catch (error) {
    console.error('❌ Webhook parsing test failed:', error);
    failedTests++;
  }

  console.log('\n📋 Test Suite: Custom Logger\n');

  try {
    const logs: string[] = [];
    const customLogger = {
      debug: (msg: string) => logs.push(`DEBUG: ${msg}`),
      info: (msg: string) => logs.push(`INFO: ${msg}`),
      warn: (msg: string) => logs.push(`WARN: ${msg}`),
      error: (msg: string) => logs.push(`ERROR: ${msg}`),
    };

    const client = new CreemApiClient(
      {
        apiKey: TEST_API_KEY,
        webhookSecret: TEST_WEBHOOK_SECRET,
      },
      customLogger
    );

    assert(client['logger'] === customLogger, 'Custom logger configured correctly');
  } catch (error) {
    console.error('❌ Custom logger test failed:', error);
    failedTests++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results Summary:`);
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log(`   📈 Total: ${passedTests + failedTests}`);
  console.log(
    `   🎯 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`
  );

  if (failedTests === 0) {
    console.log('\n✨ All tests passed! ✨\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed ⚠️\n');
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('\n💥 Test suite crashed:', error);
  process.exit(1);
});
