import { resolve } from 'node:path';
import { config } from 'dotenv';
import { paymentConfig } from '../src/config/payment.config';
import { getCreditsForPlan, resolvePlanByProductId } from '../src/lib/creem/plan-utils';

// Load .env.local file BEFORE importing plan-utils
config({ path: resolve(process.cwd(), '.env.local') });

// Debug: Check if environment variables are loaded
console.log('Environment variables check:');
console.log('CREEM_PRO_PLAN_PRODUCT_KEY_MONTHLY:', process.env.CREEM_PRO_PLAN_PRODUCT_KEY_MONTHLY);
console.log(
  'CREEM_PROPLUS_PLAN_PRODUCT_KEY_MONTHLY:',
  process.env.CREEM_PROPLUS_PLAN_PRODUCT_KEY_MONTHLY
);
console.log('CREEM_PRO_PLAN_PRODUCT_KEY_YEARLY:', process.env.CREEM_PRO_PLAN_PRODUCT_KEY_YEARLY);
console.log(
  'CREEM_PROPLUS_PLAN_PRODUCT_KEY_YEARLY:',
  process.env.CREEM_PROPLUS_PLAN_PRODUCT_KEY_YEARLY
);
console.log('\nPayment config creem keys:');
console.log('proProductKeyMonthly:', paymentConfig.creem.proProductKeyMonthly);
console.log('proplusProductKeyMonthly:', paymentConfig.creem.proplusProductKeyMonthly);
console.log('proProductKeyYearly:', paymentConfig.creem.proProductKeyYearly);
console.log('proplusProductKeyYearly:', paymentConfig.creem.proplusProductKeyYearly);
console.log('\n');

// Test resolvePlanByProductId
const testProductIds = [
  'prod_kUzMsZPgszRro3jOiUrfd', // Pro monthly
  'prod_4s8si1GkKRtU0HuUEWz6ry', // Pro+ monthly
  'prod_7VQbOmypdWBKd8k1W4aiH2', // Pro yearly
  'prod_4SM5v4tktYr2rNXZnH70Fh', // Pro+ yearly
];

for (const productId of testProductIds) {
  const resolved = resolvePlanByProductId(productId, 'month');
  console.log(`ProductId: ${productId}`);
  console.log(`  Resolved: ${resolved ? `${resolved.plan.id} (${resolved.interval})` : 'null'}`);
  if (resolved) {
    const credits = getCreditsForPlan(resolved.plan.id, resolved.interval);
    console.log(`  Credits: ${credits.amount}`);
  }
  console.log('');
}
