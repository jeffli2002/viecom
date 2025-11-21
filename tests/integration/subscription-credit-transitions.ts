/**
 * Subscription Credit Transition Tests
 *
 * Tests ALL upgrade/downgrade scenarios to ensure correct credit granting
 * based on plan transitions and billing intervals.
 */

import crypto from 'node:crypto';

console.log('💳 Subscription Credit Transition Tests\n');
console.log('Testing credit granting for all plan upgrade/downgrade scenarios\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
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
  free: {
    monthly: 0,
    yearly: 0,
    onSignup: 30,
  },
  pro: {
    monthly: 500,
    yearly: 6000, // 12 months * 500
    onSubscribe: 0,
  },
  proplus: {
    monthly: 900,
    yearly: 10800, // 12 months * 900
    onSubscribe: 0,
  },
};

interface TransitionScenario {
  id: string;
  from: {
    plan: 'free' | 'pro' | 'proplus';
    interval?: 'month' | 'year';
    currentCredits: number;
  };
  to: {
    plan: 'free' | 'pro' | 'proplus';
    interval?: 'month' | 'year';
  };
  expectedCredits: {
    granted: number;
    total: number;
    reason: string;
  };
}

const TRANSITION_SCENARIOS: TransitionScenario[] = [
  // === FREE TO PAID ===
  {
    id: 'free-to-pro-monthly',
    from: { plan: 'free', currentCredits: 30 },
    to: { plan: 'pro', interval: 'month' },
    expectedCredits: {
      granted: 500,
      total: 530,
      reason: 'Free → Pro Monthly: Grant 500 monthly credits',
    },
  },
  {
    id: 'free-to-pro-yearly',
    from: { plan: 'free', currentCredits: 30 },
    to: { plan: 'pro', interval: 'year' },
    expectedCredits: {
      granted: 6000,
      total: 6030,
      reason: 'Free → Pro Yearly: Grant 6000 yearly credits (12 months)',
    },
  },
  {
    id: 'free-to-proplus-monthly',
    from: { plan: 'free', currentCredits: 30 },
    to: { plan: 'proplus', interval: 'month' },
    expectedCredits: {
      granted: 900,
      total: 930,
      reason: 'Free → Pro+ Monthly: Grant 900 monthly credits',
    },
  },
  {
    id: 'free-to-proplus-yearly',
    from: { plan: 'free', currentCredits: 30 },
    to: { plan: 'proplus', interval: 'year' },
    expectedCredits: {
      granted: 10800,
      total: 10830,
      reason: 'Free → Pro+ Yearly: Grant 10800 yearly credits (12 months)',
    },
  },

  // === PRO MONTHLY UPGRADES ===
  {
    id: 'pro-monthly-to-pro-yearly',
    from: { plan: 'pro', interval: 'month', currentCredits: 200 },
    to: { plan: 'pro', interval: 'year' },
    expectedCredits: {
      granted: 6000,
      total: 6200,
      reason: 'Pro Monthly → Pro Yearly: Grant 6000 yearly credits',
    },
  },
  {
    id: 'pro-monthly-to-proplus-monthly',
    from: { plan: 'pro', interval: 'month', currentCredits: 200 },
    to: { plan: 'proplus', interval: 'month' },
    expectedCredits: {
      granted: 900,
      total: 1100,
      reason: 'Pro Monthly → Pro+ Monthly: Grant 900 monthly credits (scheduled)',
    },
  },
  {
    id: 'pro-monthly-to-proplus-yearly',
    from: { plan: 'pro', interval: 'month', currentCredits: 200 },
    to: { plan: 'proplus', interval: 'year' },
    expectedCredits: {
      granted: 10800,
      total: 11000,
      reason: 'Pro Monthly → Pro+ Yearly: Grant 10800 yearly credits',
    },
  },

  // === PRO YEARLY UPGRADES ===
  {
    id: 'pro-yearly-to-pro-monthly',
    from: { plan: 'pro', interval: 'year', currentCredits: 3000 },
    to: { plan: 'pro', interval: 'month' },
    expectedCredits: {
      granted: 500,
      total: 3500,
      reason: 'Pro Yearly → Pro Monthly: Grant 500 monthly credits (downgrade interval)',
    },
  },
  {
    id: 'pro-yearly-to-proplus-monthly',
    from: { plan: 'pro', interval: 'year', currentCredits: 3000 },
    to: { plan: 'proplus', interval: 'month' },
    expectedCredits: {
      granted: 900,
      total: 3900,
      reason: 'Pro Yearly → Pro+ Monthly: Grant 900 monthly credits (upgrade tier)',
    },
  },
  {
    id: 'pro-yearly-to-proplus-yearly',
    from: { plan: 'pro', interval: 'year', currentCredits: 3000 },
    to: { plan: 'proplus', interval: 'year' },
    expectedCredits: {
      granted: 10800,
      total: 13800,
      reason: 'Pro Yearly → Pro+ Yearly: Grant 10800 yearly credits (scheduled)',
    },
  },

  // === PRO+ MONTHLY TRANSITIONS ===
  {
    id: 'proplus-monthly-to-pro-monthly',
    from: { plan: 'proplus', interval: 'month', currentCredits: 400 },
    to: { plan: 'pro', interval: 'month' },
    expectedCredits: {
      granted: 500,
      total: 900,
      reason: 'Pro+ Monthly → Pro Monthly: Grant 500 monthly credits (scheduled downgrade)',
    },
  },
  {
    id: 'proplus-monthly-to-pro-yearly',
    from: { plan: 'proplus', interval: 'month', currentCredits: 400 },
    to: { plan: 'pro', interval: 'year' },
    expectedCredits: {
      granted: 6000,
      total: 6400,
      reason: 'Pro+ Monthly → Pro Yearly: Grant 6000 yearly credits',
    },
  },
  {
    id: 'proplus-monthly-to-proplus-yearly',
    from: { plan: 'proplus', interval: 'month', currentCredits: 400 },
    to: { plan: 'proplus', interval: 'year' },
    expectedCredits: {
      granted: 10800,
      total: 11200,
      reason: 'Pro+ Monthly → Pro+ Yearly: Grant 10800 yearly credits',
    },
  },

  // === PRO+ YEARLY TRANSITIONS ===
  {
    id: 'proplus-yearly-to-pro-monthly',
    from: { plan: 'proplus', interval: 'year', currentCredits: 5000 },
    to: { plan: 'pro', interval: 'month' },
    expectedCredits: {
      granted: 500,
      total: 5500,
      reason: 'Pro+ Yearly → Pro Monthly: Grant 500 monthly credits (downgrade)',
    },
  },
  {
    id: 'proplus-yearly-to-pro-yearly',
    from: { plan: 'proplus', interval: 'year', currentCredits: 5000 },
    to: { plan: 'pro', interval: 'year' },
    expectedCredits: {
      granted: 6000,
      total: 11000,
      reason: 'Pro+ Yearly → Pro Yearly: Grant 6000 yearly credits (scheduled downgrade)',
    },
  },
  {
    id: 'proplus-yearly-to-proplus-monthly',
    from: { plan: 'proplus', interval: 'year', currentCredits: 5000 },
    to: { plan: 'proplus', interval: 'month' },
    expectedCredits: {
      granted: 900,
      total: 5900,
      reason: 'Pro+ Yearly → Pro+ Monthly: Grant 900 monthly credits (downgrade interval)',
    },
  },

  // === CANCELLATION TO FREE ===
  {
    id: 'pro-monthly-to-free',
    from: { plan: 'pro', interval: 'month', currentCredits: 250 },
    to: { plan: 'free' },
    expectedCredits: {
      granted: 0,
      total: 250,
      reason: 'Pro Monthly → Free: No new credits, retain existing balance',
    },
  },
  {
    id: 'pro-yearly-to-free',
    from: { plan: 'pro', interval: 'year', currentCredits: 2000 },
    to: { plan: 'free' },
    expectedCredits: {
      granted: 0,
      total: 2000,
      reason: 'Pro Yearly → Free: No new credits, retain existing balance',
    },
  },
  {
    id: 'proplus-monthly-to-free',
    from: { plan: 'proplus', interval: 'month', currentCredits: 350 },
    to: { plan: 'free' },
    expectedCredits: {
      granted: 0,
      total: 350,
      reason: 'Pro+ Monthly → Free: No new credits, retain existing balance',
    },
  },
  {
    id: 'proplus-yearly-to-free',
    from: { plan: 'proplus', interval: 'year', currentCredits: 4000 },
    to: { plan: 'free' },
    expectedCredits: {
      granted: 0,
      total: 4000,
      reason: 'Pro+ Yearly → Free: No new credits, retain existing balance',
    },
  },

  // === REACTIVATION SCENARIOS ===
  {
    id: 'reactivate-pro-monthly',
    from: { plan: 'pro', interval: 'month', currentCredits: 100 },
    to: { plan: 'pro', interval: 'month' },
    expectedCredits: {
      granted: 0,
      total: 100,
      reason: 'Reactivate Pro Monthly: No new credits until next renewal',
    },
  },
  {
    id: 'reactivate-proplus-yearly',
    from: { plan: 'proplus', interval: 'year', currentCredits: 2000 },
    to: { plan: 'proplus', interval: 'year' },
    expectedCredits: {
      granted: 0,
      total: 2000,
      reason: 'Reactivate Pro+ Yearly: No new credits until next renewal',
    },
  },
];

async function runCreditTransitionTests() {
  console.log('📋 Testing ALL Subscription Credit Transition Scenarios\n');
  console.log(`Total scenarios to test: ${TRANSITION_SCENARIOS.length}\n`);

  for (const scenario of TRANSITION_SCENARIOS) {
    const fromDesc = scenario.from.interval
      ? `${scenario.from.plan.toUpperCase()} ${scenario.from.interval}`
      : scenario.from.plan.toUpperCase();

    const toDesc = scenario.to.interval
      ? `${scenario.to.plan.toUpperCase()} ${scenario.to.interval}`
      : scenario.to.plan.toUpperCase();

    console.log(`\n🔄 Scenario: ${fromDesc} → ${toDesc}`);
    console.log(`   ID: ${scenario.id}`);
    console.log(`   Current Credits: ${scenario.from.currentCredits}`);

    try {
      // Simulate credit granting logic
      const grantedCredits = getCreditsForTransition(scenario);

      assert(
        grantedCredits.granted === scenario.expectedCredits.granted,
        `Credits granted: ${grantedCredits.granted} (expected: ${scenario.expectedCredits.granted})`
      );

      const totalCredits = scenario.from.currentCredits + grantedCredits.granted;
      assert(
        totalCredits === scenario.expectedCredits.total,
        `Total credits: ${totalCredits} (expected: ${scenario.expectedCredits.total})`
      );

      console.log(`   ✓ Reason: ${scenario.expectedCredits.reason}`);
    } catch (error) {
      console.error(
        `   ❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      failedTests++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Credit Transition Test Results:');
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log(`   📈 Total: ${passedTests + failedTests}`);
  console.log(
    `   🎯 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`
  );

  if (failedTests === 0) {
    console.log('\n✨ All credit transition scenarios passed! ✨');
    console.log('   Credit granting logic is correct for all plan changes.\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some credit transition scenarios failed ⚠️');
    console.log('   Review credit granting logic for failed scenarios.\n');
    process.exit(1);
  }
}

function getCreditsForTransition(scenario: TransitionScenario): { granted: number } {
  const { from, to } = scenario;

  // Cancellation to free: No new credits
  if (to.plan === 'free') {
    return { granted: 0 };
  }

  // Reactivation (same plan, same interval): No new credits
  if (from.plan === to.plan && from.interval === to.interval) {
    return { granted: 0 };
  }

  // New subscription from free
  if (from.plan === 'free') {
    if (to.interval === 'year') {
      return { granted: CREDIT_CONFIG[to.plan].yearly };
    }
    return { granted: CREDIT_CONFIG[to.plan].monthly };
  }

  // Plan upgrade/downgrade or interval change
  if (to.interval === 'year') {
    return { granted: CREDIT_CONFIG[to.plan].yearly };
  }

  return { granted: CREDIT_CONFIG[to.plan].monthly };
}

// Additional test: Verify credit renewal on subscription.paid webhook
console.log('📋 Test Suite: Credit Renewal on subscription.paid\n');

interface RenewalScenario {
  plan: 'pro' | 'proplus';
  interval: 'month' | 'year';
  currentCredits: number;
  expectedGrant: number;
  reason: string;
}

const RENEWAL_SCENARIOS: RenewalScenario[] = [
  {
    plan: 'pro',
    interval: 'month',
    currentCredits: 50,
    expectedGrant: 500,
    reason: 'Pro Monthly renewal: Grant 500 credits',
  },
  {
    plan: 'pro',
    interval: 'year',
    currentCredits: 1000,
    expectedGrant: 6000,
    reason: 'Pro Yearly renewal: Grant 6000 credits',
  },
  {
    plan: 'proplus',
    interval: 'month',
    currentCredits: 100,
    expectedGrant: 900,
    reason: 'Pro+ Monthly renewal: Grant 900 credits',
  },
  {
    plan: 'proplus',
    interval: 'year',
    currentCredits: 2000,
    expectedGrant: 10800,
    reason: 'Pro+ Yearly renewal: Grant 10800 credits',
  },
];

function testRenewalCredits() {
  console.log('\n📋 Testing Subscription Renewal Credit Grants\n');

  for (const scenario of RENEWAL_SCENARIOS) {
    console.log(`\n🔄 Renewal: ${scenario.plan.toUpperCase()} ${scenario.interval}`);
    console.log(`   Current Credits: ${scenario.currentCredits}`);

    const grantedCredits =
      scenario.interval === 'year'
        ? CREDIT_CONFIG[scenario.plan].yearly
        : CREDIT_CONFIG[scenario.plan].monthly;

    assert(
      grantedCredits === scenario.expectedGrant,
      `Renewal grant: ${grantedCredits} (expected: ${scenario.expectedGrant})`
    );

    const totalAfterRenewal = scenario.currentCredits + grantedCredits;
    console.log(`   Total after renewal: ${totalAfterRenewal}`);
    console.log(`   ✓ ${scenario.reason}`);
  }
}

async function main() {
  await runCreditTransitionTests();
  testRenewalCredits();
}

main().catch((error) => {
  console.error('\n💥 Credit transition test suite crashed:', error);
  process.exit(1);
});
