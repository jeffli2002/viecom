/**
 * Test script for Resend email forwarding
 *
 * This script simulates a Resend webhook event to test the forwarding functionality
 *
 * Usage: pnpm tsx scripts/test-resend-forward.ts
 */

import { env } from '../src/env';

async function testResendForward() {
  console.log('🧪 Testing Resend Email Forwarding...\n');

  // Check required environment variables
  console.log('📋 Checking environment variables:');
  console.log(`  RESEND_API_KEY: ${env.RESEND_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`  RESEND_FROM_EMAIL: ${env.RESEND_FROM_EMAIL || '❌ Missing'}`);
  console.log(`  RESEND_FORWARD_TO_EMAIL: ${env.RESEND_FORWARD_TO_EMAIL || '❌ Missing'}`);
  console.log(
    `  RESEND_WEBHOOK_SECRET: ${env.RESEND_WEBHOOK_SECRET ? '✅ Set (optional)' : '⚠️  Not set (optional)'}\n`
  );

  if (!env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is required');
    process.exit(1);
  }

  if (!env.RESEND_FROM_EMAIL) {
    console.error('❌ RESEND_FROM_EMAIL is required');
    process.exit(1);
  }

  if (!env.RESEND_FORWARD_TO_EMAIL) {
    console.error('❌ RESEND_FORWARD_TO_EMAIL is required');
    process.exit(1);
  }

  // Get the webhook URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const webhookUrl = `${appUrl}/api/webhooks/resend`;

  console.log(`🌐 Webhook URL: ${webhookUrl}\n`);

  // Create a mock webhook event
  const mockEvent = {
    type: 'email.received',
    created_at: new Date().toISOString(),
    data: {
      email_id: `test-email-id-${Date.now()}`,
      created_at: new Date().toISOString(),
      from: 'test-sender@example.com',
      to: ['support@viecom.pro'],
      bcc: [],
      cc: [],
      message_id: '<test-message-id>',
      subject: 'Test Email - Resend Forwarding Test',
      attachments: [],
    },
  };

  console.log('📧 Mock webhook event:');
  console.log(JSON.stringify(mockEvent, null, 2));
  console.log('\n');

  try {
    console.log('📤 Sending test webhook request...\n');

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(env.RESEND_WEBHOOK_SECRET && {
          'resend-signature': 'test-signature', // In real scenario, this would be properly signed
        }),
      },
      body: JSON.stringify(mockEvent),
    });

    const responseData = await response.json();

    console.log(`📥 Response Status: ${response.status}`);
    console.log('📥 Response Body:');
    console.log(JSON.stringify(responseData, null, 2));
    console.log('\n');

    if (response.ok) {
      console.log('✅ Webhook endpoint is working!');
      console.log('\n📝 Note: This is a mock event. To test with a real email:');
      console.log('   1. Send an email to support@viecom.pro');
      console.log('   2. Check if it gets forwarded to', env.RESEND_FORWARD_TO_EMAIL);
      console.log('   3. Check server logs for processing details');
    } else {
      console.error('❌ Webhook endpoint returned an error');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error testing webhook:', error);
    console.error('\n💡 Make sure:');
    console.error('   1. Development server is running (pnpm dev)');
    console.error('   2. Webhook URL is accessible');
    console.error('   3. Environment variables are set correctly');
    process.exit(1);
  }
}

// Run the test
testResendForward().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
