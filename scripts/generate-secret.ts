/**
 * Generate a secure random secret for Better Auth
 * Usage: npx tsx scripts/generate-secret.ts
 */

import { randomBytes } from 'node:crypto';

const secret = randomBytes(32).toString('base64');

console.log('\n🔐 Generated BETTER_AUTH_SECRET:');
console.log('='.repeat(60));
console.log(secret);
console.log('='.repeat(60));
console.log('\n📝 Copy this value to your .env.local file:');
console.log(`BETTER_AUTH_SECRET="${secret}"\n`);


