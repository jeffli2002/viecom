import { resolve } from 'node:path';
import { grantSubscriptionCredits } from '@/lib/creem/subscription-credits';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const userId = process.argv[2];
const planId = process.argv[3] || 'pro';
const subscriptionId = process.argv[4] || `manual_${Date.now()}`;

if (!userId) {
  console.error('Usage: pnpm tsx scripts/grant-credits-once.ts <userId> [planId] [subscriptionId]');
  process.exit(1);
}

grantSubscriptionCredits(userId, planId, subscriptionId)
  .then((granted) => {
    console.log('Grant result:', granted);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
