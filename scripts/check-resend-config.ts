/**
 * Check Resend Configuration and Webhook Setup
 * 
 * Usage: pnpm tsx scripts/check-resend-config.ts
 */

import { env } from '../src/env';

console.log('🔍 Checking Resend Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`  RESEND_API_KEY: ${env.RESEND_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`  RESEND_FROM_EMAIL: ${env.RESEND_FROM_EMAIL || '❌ Missing'}`);
console.log(`  RESEND_FORWARD_TO_EMAIL: ${env.RESEND_FORWARD_TO_EMAIL || '❌ Missing'}`);
console.log(`  RESEND_WEBHOOK_SECRET: ${env.RESEND_WEBHOOK_SECRET ? '✅ Set (optional)' : '⚠️  Not set (optional)'}`);
console.log(`  NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || '❌ Missing'}\n`);

// Check webhook endpoint
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const webhookUrl = `${appUrl}/api/webhooks/resend`;

console.log('🌐 Webhook Configuration:');
console.log(`  Webhook URL: ${webhookUrl}`);
console.log(`  Expected Production URL: https://www.viecom.pro/api/webhooks/resend\n`);

// Test webhook endpoint
console.log('🧪 Testing Webhook Endpoint...');
fetch(webhookUrl, {
  method: 'GET',
})
  .then(async (response) => {
    const data = await response.json();
    if (response.ok) {
      console.log('  ✅ Webhook endpoint is accessible');
      console.log(`  Response: ${JSON.stringify(data)}\n`);
    } else {
      console.log(`  ❌ Webhook endpoint returned error: ${response.status}`);
      console.log(`  Response: ${JSON.stringify(data)}\n`);
    }
  })
  .catch((error) => {
    console.log(`  ❌ Cannot access webhook endpoint: ${error.message}\n`);
  });

console.log('📝 Checklist for Resend Email Forwarding:\n');
console.log('1. ✅ DNS Records:');
console.log('   - MX record configured in Vercel/DNS provider');
console.log('   - MX record verified in Resend Dashboard\n');

console.log('2. ✅ Resend Dashboard Configuration:');
console.log('   - Domain verified (viecom.pro)');
console.log('   - Receiving enabled for domain');
console.log('   - Webhook created:');
console.log('     * URL: https://www.viecom.pro/api/webhooks/resend');
console.log('     * Event: email.received');
console.log('     * Status: Active\n');

console.log('3. ✅ Environment Variables (Production):');
console.log('   - RESEND_API_KEY set in Vercel');
console.log('   - RESEND_FROM_EMAIL set in Vercel');
console.log('   - RESEND_FORWARD_TO_EMAIL set in Vercel');
console.log('   - RESEND_WEBHOOK_SECRET set in Vercel (optional)\n');

console.log('4. ✅ Testing:');
console.log('   - Send test email to support@viecom.pro');
console.log('   - Check Resend Dashboard > Emails for received email');
console.log('   - Check Resend Dashboard > Webhooks for webhook events');
console.log('   - Check 994235892@qq.com inbox for forwarded email\n');

console.log('💡 Troubleshooting:');
console.log('   - Check Vercel logs for webhook requests');
console.log('   - Check Resend Dashboard > Webhooks for delivery status');
console.log('   - Verify MX record is active and has lowest priority');
console.log('   - Ensure webhook URL is publicly accessible (not localhost)');


