import { creemService } from '@/lib/creem/creem-service';

/**
 * Test webhook processing locally without hitting the API
 * This simulates what happens when Creem sends a webhook
 */

const testWebhookEvent = {
  id: 'evt_6KvzXx9vLEc7pW2gzneTVE',
  eventType: 'checkout.completed',
  created_at: 1763769479017,
  object: {
    id: 'ch_7lZSdrnpd2jIpih08mBF7s',
    object: 'checkout',
    request_id: 'checkout_myZwkau1DoG2GXcibytBYmmwRXX8Mw6L_1763769437929',
    order: {
      object: 'order',
      id: 'ord_qBvIAixMvcjpUgk25ca6l',
      customer: 'cust_7ECJrW5ALvuCieDX4W3mOQ',
      product: 'prod_7dyQB04IzFilLT5nDGZBD1',
      amount: 500,
      currency: 'USD',
      sub_total: 500,
      tax_amount: 0,
      amount_due: 500,
      amount_paid: 500,
      status: 'paid',
      type: 'onetime',
      transaction: 'tran_rjaiAlyZNdpn7QoUJgMJa',
      created_at: '2025-11-21T23:57:25.549Z',
      updated_at: '2025-11-21T23:57:25.549Z',
      mode: 'test',
    },
    product: {
      id: 'prod_7dyQB04IzFilLT5nDGZBD1',
      object: 'product',
      name: '1000 credits',
      description: '1000 credits one time ',
      price: 500,
      currency: 'USD',
      billing_type: 'onetime',
      billing_period: 'once',
      status: 'active',
      tax_mode: 'exclusive',
      tax_category: 'saas',
      default_success_url: '',
      created_at: '2025-11-14T09:05:44.233Z',
      updated_at: '2025-11-14T09:05:44.233Z',
      mode: 'test',
    },
    units: 1,
    success_url:
      'https://viecom-git-payment-jeff-lees-projects-92a56a05.vercel.app/dashboard?payment=success',
    customer: {
      id: 'cust_7ECJrW5ALvuCieDX4W3mOQ',
      object: 'customer',
      email: 'jefflee2002@gmail.com',
      name: 'Lei Li',
      country: 'CN',
      created_at: '2025-11-15T03:53:27.273Z',
      updated_at: '2025-11-15T03:53:27.273Z',
      mode: 'test',
    },
    status: 'completed',
    metadata: {
      type: 'credit_pack',
      userId: 'myZwkau1DoG2GXcibytBYmmwRXX8Mw6L',
      userEmail: 'jefflee2002@gmail.com',
    },
    mode: 'test',
  },
};

async function testWebhook() {
  console.log('🧪 Testing webhook event processing...\n');
  console.log('Event:', JSON.stringify(testWebhookEvent, null, 2));
  console.log('\n' + '='.repeat(80) + '\n');

  try {
    const result = await creemService.handleWebhookEvent(testWebhookEvent as any);

    console.log('✅ Webhook processed successfully!');
    console.log('\nResult:', JSON.stringify(result, null, 2));

    // Check if it's a credit pack purchase
    if (result && typeof result === 'object' && 'type' in result) {
      if (result.type === 'credit_pack_purchase') {
        console.log('\n✅ Correctly identified as credit pack purchase');
        console.log('Extracted data:');
        console.log('  - userId:', result.userId);
        console.log('  - credits:', result.credits);
        console.log('  - productName:', result.productName);
        console.log('  - productId:', result.productId);
        console.log('  - orderId:', result.orderId);
        console.log('  - checkoutId:', result.checkoutId);

        if (!result.userId) {
          console.error('\n❌ ERROR: userId is missing!');
        }

        if (!result.credits || result.credits <= 0) {
          console.error('\n❌ ERROR: credits is missing or invalid!');
          console.error('   Expected: 1000');
          console.error('   Got:', result.credits);
        }

        if (result.userId && result.credits && result.credits > 0) {
          console.log('\n✅ All required fields are present and valid!');
          console.log(
            '   This webhook would grant',
            result.credits,
            'credits to user',
            result.userId
          );
        }
      } else {
        console.log('\n⚠️  Identified as:', result.type);
        console.log('   Expected: credit_pack_purchase');
      }
    } else {
      console.error('\n❌ Invalid result format:', result);
    }
  } catch (error) {
    console.error('❌ Webhook processing failed!');
    console.error('\nError:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

testWebhook()
  .then(() => {
    console.log('\n' + '='.repeat(80));
    console.log('🏁 Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
