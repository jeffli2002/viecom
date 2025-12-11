/**
 * Simple test script for Resend webhook endpoint
 *
 * Usage: node scripts/test-resend-webhook.js
 *
 * Make sure the dev server is running first: pnpm dev
 */

const webhookUrl = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/resend`
  : 'http://localhost:3000/api/webhooks/resend';

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

console.log('🧪 Testing Resend Email Forwarding Webhook...\n');
console.log(`🌐 Webhook URL: ${webhookUrl}\n`);
console.log('📧 Mock webhook event:');
console.log(JSON.stringify(mockEvent, null, 2));
console.log('\n');

fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(mockEvent),
})
  .then(async (response) => {
    const data = await response.json();
    console.log(`📥 Response Status: ${response.status}`);
    console.log('📥 Response Body:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n');

    if (response.ok) {
      console.log('✅ Webhook endpoint is working!');
      console.log('\n📝 Note: This is a mock event. To test with a real email:');
      console.log('   1. Send an email to support@viecom.pro');
      console.log('   2. Check if it gets forwarded to 994235892@qq.com');
      console.log('   3. Check server logs for processing details');
    } else {
      console.error('❌ Webhook endpoint returned an error');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Error testing webhook:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. Development server is running (pnpm dev)');
    console.error('   2. Webhook URL is accessible');
    console.error('   3. Environment variables are set correctly');
    process.exit(1);
  });
