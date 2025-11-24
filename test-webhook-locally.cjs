#!/usr/bin/env node

/**
 * Test webhook locally to see actual error
 * Run: node test-webhook-locally.js
 */

const crypto = require('node:crypto');

const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/creem';
const WEBHOOK_SECRET = 'whsec_1Fjrs44z8YRXHr0DKiA9z3';

const payload = {
  id: 'evt_RNsRiA7qspe9crHl7IuMj',
  eventType: 'subscription.update',
  created_at: 1763689492658,
  object: {
    id: 'sub_5EM6IgULEBVjEtMx5OH0TT',
    object: 'subscription',
    product: {
      id: 'prod_kUzMsZPgszRro3jOiUrfd',
      object: 'product',
      name: 'monthly Pro',
    },
    customer: {
      id: 'cust_7ECJrW5ALvuCieDX4W3mOQ',
      email: 'jefflee2002@gmail.com',
    },
    status: 'active',
    current_period_start_date: '2025-11-19T01:11:55.000Z',
    current_period_end_date: '2025-12-19T01:11:55.000Z',
    metadata: {
      planId: 'proplus',
      userId: 'myZwkau1DoG2GXcibytBYmmwRXX8Mw6L',
      userEmail: 'jefflee2002@gmail.com',
      currentPlan: 'pro',
    },
  },
};

const payloadString = JSON.stringify(payload);

// Generate signature
const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
const signature = hmac.update(payloadString).digest('hex');

console.log('Testing webhook locally...\n');
console.log('Payload:', `${payloadString.substring(0, 100)}...`);
console.log('Signature:', signature, '\n');

// Send webhook
fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-creem-signature': signature,
  },
  body: payloadString,
})
  .then(async (response) => {
    console.log('Response status:', response.status, response.statusText);
    const text = await response.text();
    console.log('Response body:', text || '(empty)');

    if (response.status === 500) {
      console.log('\n❌ 500 ERROR - Check your terminal running "pnpm dev" for error stack trace');
    } else if (response.status === 200) {
      console.log('\n✅ SUCCESS - Webhook processed');
    } else if (response.status === 401) {
      console.log('\n❌ 401 UNAUTHORIZED - Signature verification failed');
    }
  })
  .catch((error) => {
    console.error('Fetch error:', error.message);
    console.log('\nIs dev server running? Try: pnpm dev');
  });
