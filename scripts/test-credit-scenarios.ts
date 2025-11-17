import { resolve } from 'node:path';
import { config } from 'dotenv';
import { getCreditsForPlan, resolvePlanByProductId } from '../src/lib/creem/plan-utils';

// Load .env.local file BEFORE importing plan-utils
config({ path: resolve(process.cwd(), '.env.local') });

interface TestScenario {
  name: string;
  oldPlan: {
    productId?: string;
    planId?: string;
    interval: 'month' | 'year';
  };
  newPlan: {
    productId?: string;
    planId?: string;
    interval: 'month' | 'year';
  };
  expectedCreditChange: number;
  expectedBehavior: string;
  isRenewal?: boolean; // 标记是否为续费场景
}

const scenarios: TestScenario[] = [
  // Free -> Paid scenarios
  {
    name: 'Free -> Pro (月付)',
    oldPlan: { planId: 'free', interval: 'month' },
    newPlan: { productId: 'prod_kUzMsZPgszRro3jOiUrfd', interval: 'month' },
    expectedCreditChange: 500, // Pro 月付积分
    expectedBehavior: '立即授予全额积分',
  },
  {
    name: 'Free -> Pro (年付)',
    oldPlan: { planId: 'free', interval: 'month' },
    newPlan: { productId: 'prod_7VQbOmypdWBKd8k1W4aiH2', interval: 'year' },
    expectedCreditChange: 6000, // Pro 年付积分 (500 * 12)
    expectedBehavior: '立即授予全额积分',
  },
  {
    name: 'Free -> Pro+ (月付)',
    oldPlan: { planId: 'free', interval: 'month' },
    newPlan: { productId: 'prod_4s8si1GkKRtU0HuUEWz6ry', interval: 'month' },
    expectedCreditChange: 900, // Pro+ 月付积分
    expectedBehavior: '立即授予全额积分',
  },
  {
    name: 'Free -> Pro+ (年付)',
    oldPlan: { planId: 'free', interval: 'month' },
    newPlan: { productId: 'prod_4SM5v4tktYr2rNXZnH70Fh', interval: 'year' },
    expectedCreditChange: 10800, // Pro+ 年付积分 (900 * 12)
    expectedBehavior: '立即授予全额积分',
  },
  // Upgrade scenarios
  {
    name: 'Pro (月付) -> Pro+ (月付)',
    oldPlan: { productId: 'prod_kUzMsZPgszRro3jOiUrfd', interval: 'month' },
    newPlan: { productId: 'prod_4s8si1GkKRtU0HuUEWz6ry', interval: 'month' },
    expectedCreditChange: 400, // 900 - 500
    expectedBehavior: '立即授予积分差额',
  },
  {
    name: 'Pro (月付) -> Pro (年付)',
    oldPlan: { productId: 'prod_kUzMsZPgszRro3jOiUrfd', interval: 'month' },
    newPlan: { productId: 'prod_7VQbOmypdWBKd8k1W4aiH2', interval: 'year' },
    expectedCreditChange: 5500, // 6000 - 500
    expectedBehavior: '立即授予积分差额',
  },
  {
    name: 'Pro (月付) -> Pro+ (年付)',
    oldPlan: { productId: 'prod_kUzMsZPgszRro3jOiUrfd', interval: 'month' },
    newPlan: { productId: 'prod_4SM5v4tktYr2rNXZnH70Fh', interval: 'year' },
    expectedCreditChange: 10300, // 10800 - 500
    expectedBehavior: '立即授予积分差额',
  },
  // Downgrade scenarios (should schedule for period end)
  {
    name: 'Pro+ (月付) -> Pro (月付)',
    oldPlan: { productId: 'prod_4s8si1GkKRtU0HuUEWz6ry', interval: 'month' },
    newPlan: { productId: 'prod_kUzMsZPgszRro3jOiUrfd', interval: 'month' },
    expectedCreditChange: -400, // 500 - 900 (负数表示降级)
    expectedBehavior: '计划结束时生效，授予新计划全额积分',
  },
  {
    name: 'Pro (年付) -> Pro (月付)',
    oldPlan: { productId: 'prod_7VQbOmypdWBKd8k1W4aiH2', interval: 'year' },
    newPlan: { productId: 'prod_kUzMsZPgszRro3jOiUrfd', interval: 'month' },
    expectedCreditChange: -5500, // 500 - 6000 (负数表示降级)
    expectedBehavior: '计划结束时生效，授予新计划全额积分',
  },
  {
    name: 'Pro+ (年付) -> Pro (月付)',
    oldPlan: { productId: 'prod_4SM5v4tktYr2rNXZnH70Fh', interval: 'year' },
    newPlan: { productId: 'prod_kUzMsZPgszRro3jOiUrfd', interval: 'month' },
    expectedCreditChange: -10300, // 500 - 10800 (负数表示降级)
    expectedBehavior: '计划结束时生效，授予新计划全额积分',
  },
  // Renewal scenarios (续费时授予全额积分，而不是差额)
  {
    name: 'Pro (月付) 续费',
    oldPlan: { productId: 'prod_kUzMsZPgszRro3jOiUrfd', interval: 'month' },
    newPlan: { productId: 'prod_kUzMsZPgszRro3jOiUrfd', interval: 'month' },
    expectedCreditChange: 500, // 续费时授予全额积分，不是差额
    expectedBehavior: '授予全额积分（续费）',
    isRenewal: true,
  },
  {
    name: 'Pro+ (年付) 续费',
    oldPlan: { productId: 'prod_4SM5v4tktYr2rNXZnH70Fh', interval: 'year' },
    newPlan: { productId: 'prod_4SM5v4tktYr2rNXZnH70Fh', interval: 'year' },
    expectedCreditChange: 10800, // 续费时授予全额积分，不是差额
    expectedBehavior: '授予全额积分（续费）',
    isRenewal: true,
  },
];

// Build product ID mapping from environment variables
function buildProductIdMapping() {
  const mapping: Record<string, { id: 'pro' | 'proplus'; interval: 'month' | 'year' }> = {};

  if (process.env.CREEM_PRO_PLAN_PRODUCT_KEY_MONTHLY) {
    mapping[process.env.CREEM_PRO_PLAN_PRODUCT_KEY_MONTHLY] = { id: 'pro', interval: 'month' };
  }
  if (process.env.CREEM_PRO_PLAN_PRODUCT_KEY_YEARLY) {
    mapping[process.env.CREEM_PRO_PLAN_PRODUCT_KEY_YEARLY] = { id: 'pro', interval: 'year' };
  }
  if (process.env.CREEM_PROPLUS_PLAN_PRODUCT_KEY_MONTHLY) {
    mapping[process.env.CREEM_PROPLUS_PLAN_PRODUCT_KEY_MONTHLY] = {
      id: 'proplus',
      interval: 'month',
    };
  }
  if (process.env.CREEM_PROPLUS_PLAN_PRODUCT_KEY_YEARLY) {
    mapping[process.env.CREEM_PROPLUS_PLAN_PRODUCT_KEY_YEARLY] = {
      id: 'proplus',
      interval: 'year',
    };
  }

  return mapping;
}

function resolvePlanCredits(plan: TestScenario['oldPlan'] | TestScenario['newPlan']): number {
  let identifier = plan.productId || plan.planId || 'free';
  let interval = plan.interval;

  // If it's a productId, resolve it first using environment variables
  if (identifier.startsWith('prod_')) {
    const mapping = buildProductIdMapping();
    const mapped = mapping[identifier];
    if (mapped) {
      identifier = mapped.id;
      interval = mapped.interval;
    } else {
      // Try resolvePlanByProductId as fallback
      const resolved = resolvePlanByProductId(identifier, plan.interval);
      if (resolved) {
        identifier = resolved.plan.id;
        interval = resolved.interval;
      } else {
        console.warn(`[Test] Cannot resolve productId: ${identifier}`);
        return 0;
      }
    }
  }

  const creditInfo = getCreditsForPlan(identifier, interval);
  return creditInfo.amount;
}

async function testScenario(scenario: TestScenario): Promise<boolean> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`测试场景: ${scenario.name}`);
  console.log(`${'='.repeat(60)}`);

  const oldCredits = resolvePlanCredits(scenario.oldPlan);
  const newCredits = resolvePlanCredits(scenario.newPlan);
  let actualCreditChange = newCredits - oldCredits;

  // For renewals, grant full credits instead of difference
  if (scenario.isRenewal) {
    actualCreditChange = newCredits; // 续费时授予全额积分
  }

  console.log(
    `旧计划: ${scenario.oldPlan.productId || scenario.oldPlan.planId} (${scenario.oldPlan.interval})`
  );
  console.log(`  - 积分: ${oldCredits}`);
  console.log(
    `新计划: ${scenario.newPlan.productId || scenario.newPlan.planId} (${scenario.newPlan.interval})`
  );
  console.log(`  - 积分: ${newCredits}`);
  console.log(`\n预期积分变化: ${scenario.expectedCreditChange}`);
  console.log(`实际积分变化: ${actualCreditChange}`);
  console.log(`预期行为: ${scenario.expectedBehavior}`);

  // For downgrades, the expected change should be negative
  // But the actual behavior is: grant full credits for new plan at period end
  const isDowngrade = !scenario.isRenewal && actualCreditChange < 0;

  if (isDowngrade) {
    console.log('\n⚠️  降级场景: 积分变化应在当前计划结束时生效');
    console.log(`   当前计划结束时，将授予新计划全额积分: ${newCredits}`);
    console.log(`   实际积分变化: ${actualCreditChange} (立即) -> ${newCredits} (计划结束时)`);
  }

  if (scenario.isRenewal) {
    console.log(`\n🔄 续费场景: 授予全额积分（${newCredits}），而不是差额`);
  }

  const matches = actualCreditChange === scenario.expectedCreditChange;

  if (matches) {
    console.log('\n✅ 测试通过: 积分变化计算正确');
  } else {
    console.log('\n❌ 测试失败: 积分变化不匹配');
    console.log(`   差异: ${actualCreditChange - scenario.expectedCreditChange}`);
  }

  return matches;
}

async function runAllTests() {
  console.log('\n🧪 开始测试各种订阅场景的积分变化\n');

  let passed = 0;
  let failed = 0;

  for (const scenario of scenarios) {
    const result = await testScenario(scenario);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('测试总结');
  console.log(`${'='.repeat(60)}`);
  console.log(`总测试数: ${scenarios.length}`);
  console.log(`通过: ${passed} ✅`);
  console.log(`失败: ${failed} ❌`);
  console.log(`${'='.repeat(60)}\n`);

  return failed === 0;
}

// Run tests
runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
