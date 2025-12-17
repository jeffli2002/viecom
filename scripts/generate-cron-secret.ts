/**
 * Generate a secure random secret for CRON_SECRET
 * Usage: pnpm tsx scripts/generate-cron-secret.ts
 */

import { randomBytes } from 'node:crypto';

const secret = randomBytes(32).toString('base64');

console.log('\n🔐 Generated CRON_SECRET:');
console.log('='.repeat(60));
console.log(secret);
console.log('='.repeat(60));
console.log('\n📝 Copy this value to your .env.local file:');
console.log(`CRON_SECRET="${secret}"\n`);
console.log('💡 This secret is used to secure cron job endpoints.');
console.log('   Make sure to use the same value when calling cron endpoints:\n');
console.log('   curl -X POST https://your-domain.com/api/cron/check-missing-signup-credits \\');
console.log(`     -H "Authorization: Bearer ${secret}"\n`);
