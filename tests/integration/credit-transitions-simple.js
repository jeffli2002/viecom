#!/usr/bin/env node

/**
 * Subscription Credit Transition Tests (Simple JavaScript version)
 * Tests ALL upgrade/downgrade scenarios for correct credit granting
 */

console.log('💳 Subscription Credit Transition Tests\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ ${message}`);
    passedTests++;
  } else {
    console.error(`❌ ${message}`);
    failedTests++;
  }
}

// Credit configuration from payment.config.ts
const CREDIT_CONFIG = {
  free: { monthly: 0, yearly: 0, onSignup: 30 },
  pro: { monthly: 500, yearly: 6000, onSubscribe: 0 },
  proplus: { monthly: 900, yearly: 10800, onSubscribe: 0 },
};

const SCENARIOS = [
  // FREE TO PAID
  { id: 'free-to-pro-monthly', from: { plan: 'free', credits: 30 }, to: { plan: 'pro', interval: 'month' }, expected: { grant: 500, total: 530 } },
  { id: 'free-to-pro-yearly', from: { plan: 'free', credits: 30 }, to: { plan: 'pro', interval: 'year' }, expected: { grant: 6000, total: 6030 } },
  { id: 'free-to-proplus-monthly', from: { plan: 'free', credits: 30 }, to: { plan: 'proplus', interval: 'month' }, expected: { grant: 900, total: 930 } },
  { id: 'free-to-proplus-yearly', from: { plan: 'free', credits: 30 }, to: { plan: 'proplus', interval: 'year' }, expected: { grant: 10800, total: 10830 } },

  // PRO MONTHLY TRANSITIONS
  { id: 'pro-monthly-to-pro-yearly', from: { plan: 'pro', interval: 'month', credits: 200 }, to: { plan: 'pro', interval: 'year' }, expected: { grant: 6000, total: 6200 } },
  { id: 'pro-monthly-to-proplus-monthly', from: { plan: 'pro', interval: 'month', credits: 200 }, to: { plan: 'proplus', interval: 'month' }, expected: { grant: 900, total: 1100 } },
  { id: 'pro-monthly-to-proplus-yearly', from: { plan: 'pro', interval: 'month', credits: 200 }, to: { plan: 'proplus', interval: 'year' }, expected: { grant: 10800, total: 11000 } },

  // PRO YEARLY TRANSITIONS
  { id: 'pro-yearly-to-pro-monthly', from: { plan: 'pro', interval: 'year', credits: 3000 }, to: { plan: 'pro', interval: 'month' }, expected: { grant: 500, total: 3500 } },
  { id: 'pro-yearly-to-proplus-monthly', from: { plan: 'pro', interval: 'year', credits: 3000 }, to: { plan: 'proplus', interval: 'month' }, expected: { grant: 900, total: 3900 } },
  { id: 'pro-yearly-to-proplus-yearly', from: { plan: 'pro', interval: 'year', credits: 3000 }, to: { plan: 'proplus', interval: 'year' }, expected: { grant: 10800, total: 13800 } },

  // PRO+ MONTHLY TRANSITIONS
  { id: 'proplus-monthly-to-pro-monthly', from: { plan: 'proplus', interval: 'month', credits: 400 }, to: { plan: 'pro', interval: 'month' }, expected: { grant: 500, total: 900 } },
  { id: 'proplus-monthly-to-pro-yearly', from: { plan: 'proplus', interval: 'month', credits: 400 }, to: { plan: 'pro', interval: 'year' }, expected: { grant: 6000, total: 6400 } },
  { id: 'proplus-monthly-to-proplus-yearly', from: { plan: 'proplus', interval: 'month', credits: 400 }, to: { plan: 'proplus', interval: 'year' }, expected: { grant: 10800, total: 11200 } },

  // PRO+ YEARLY TRANSITIONS
  { id: 'proplus-yearly-to-pro-monthly', from: { plan: 'proplus', interval: 'year', credits: 5000 }, to: { plan: 'pro', interval: 'month' }, expected: { grant: 500, total: 5500 } },
  { id: 'proplus-yearly-to-pro-yearly', from: { plan: 'proplus', interval: 'year', credits: 5000 }, to: { plan: 'pro', interval: 'year' }, expected: { grant: 6000, total: 11000 } },
  { id: 'proplus-yearly-to-proplus-monthly', from: { plan: 'proplus', interval: 'year', credits: 5000 }, to: { plan: 'proplus', interval: 'month' }, expected: { grant: 900, total: 5900 } },

  // CANCELLATION TO FREE
  { id: 'pro-monthly-to-free', from: { plan: 'pro', interval: 'month', credits: 250 }, to: { plan: 'free' }, expected: { grant: 0, total: 250 } },
  { id: 'pro-yearly-to-free', from: { plan: 'pro', interval: 'year', credits: 2000 }, to: { plan: 'free' }, expected: { grant: 0, total: 2000 } },
  { id: 'proplus-monthly-to-free', from: { plan: 'proplus', interval: 'month', credits: 350 }, to: { plan: 'free' }, expected: { grant: 0, total: 350 } },
  { id: 'proplus-yearly-to-free', from: { plan: 'proplus', interval: 'year', credits: 4000 }, to: { plan: 'free' }, expected: { grant: 0, total: 4000 } },
];

function getCreditsForTransition(from, to) {
  // Cancellation to free: No new credits
  if (to.plan === 'free') return 0;

  // Reactivation: No new credits
  if (from.plan === to.plan && from.interval === to.interval) return 0;

  // New subscription from free or plan change
  if (to.interval === 'year') {
    return CREDIT_CONFIG[to.plan].yearly;
  }
  return CREDIT_CONFIG[to.plan].monthly;
}

console.log(`Testing ${SCENARIOS.length} credit transition scenarios\n`);

for (const scenario of SCENARIOS) {
  const fromDesc = scenario.from.interval
    ? `${scenario.from.plan.toUpperCase()} ${scenario.from.interval}`
    : scenario.from.plan.toUpperCase();

  const toDesc = scenario.to.interval
    ? `${scenario.to.plan.toUpperCase()} ${scenario.to.interval}`
    : scenario.to.plan.toUpperCase();

  console.log(`\n🔄 ${fromDesc} → ${toDesc}`);

  const granted = getCreditsForTransition(scenario.from, scenario.to);
  const total = scenario.from.credits + granted;

  assert(
    granted === scenario.expected.grant,
    `Credits granted: ${granted} (expected: ${scenario.expected.grant})`
  );

  assert(
    total === scenario.expected.total,
    `Total credits: ${total} (expected: ${scenario.expected.total})`
  );
}

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Results: ${passedTests} passed, ${failedTests} failed`);
console.log(`🎯 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log('\n✨ All credit transition tests passed! ✨\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed ⚠️\n');
  process.exit(1);
}
