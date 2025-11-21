import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Please check your .env.local file.');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function setUserToPureFree() {
  const email = 'jefflee2002@gmail.com';

  try {
    console.log(`\n=== 将 ${email} 设置为纯 Free 计划用户（清除所有 scheduled plan）===\n`);

    // 1. 查看当前状态（包括 scheduled 字段）
    console.log('1. 查看当前状态...');
    const currentStatus = await sql`
      SELECT 
        u.email,
        u.id as user_id,
        p.id as subscription_id,
        p.subscription_id as creem_subscription_id,
        p.price_id,
        p.product_id,
        p.status,
        p.interval,
        p.period_start,
        p.period_end,
        p.cancel_at_period_end,
        p.scheduled_plan_id,
        p.scheduled_interval,
        p.scheduled_period_start,
        p.scheduled_period_end,
        p.scheduled_at,
        p.created_at,
        uc.balance
      FROM "user" u
      LEFT JOIN payment p ON p.user_id = u.id AND p.type = 'subscription'
      LEFT JOIN user_credits uc ON uc.user_id = u.id
      WHERE u.email = ${email}
      ORDER BY p.created_at DESC
    `;
    console.table(currentStatus);

    if (currentStatus.length === 0) {
      console.error('用户不存在:', email);
      process.exit(1);
    }

    const userId = currentStatus[0].user_id;

    // 2. 取消所有活跃订阅并清除所有 scheduled 字段
    console.log('\n2. 取消所有活跃订阅并清除 scheduled plan 字段...');
    const updateResult = await sql`
      UPDATE payment
      SET 
        status = 'canceled',
        cancel_at_period_end = false,
        scheduled_plan_id = NULL,
        scheduled_interval = NULL,
        scheduled_period_start = NULL,
        scheduled_period_end = NULL,
        scheduled_at = NULL,
        updated_at = NOW()
      WHERE user_id = ${userId}
        AND type = 'subscription'
        AND (
          status IN ('active', 'trialing', 'past_due')
          OR scheduled_plan_id IS NOT NULL
        )
      RETURNING 
        id, 
        status, 
        scheduled_plan_id,
        scheduled_interval,
        updated_at
    `;
    console.log(`已更新 ${updateResult.length} 条订阅记录`);
    if (updateResult.length > 0) {
      console.table(updateResult);
    }

    // 3. 确保所有订阅记录的 scheduled 字段都被清除（包括已取消的）
    console.log('\n3. 清除所有订阅记录的 scheduled 字段...');
    const clearScheduledResult = await sql`
      UPDATE payment
      SET 
        scheduled_plan_id = NULL,
        scheduled_interval = NULL,
        scheduled_period_start = NULL,
        scheduled_period_end = NULL,
        scheduled_at = NULL,
        updated_at = NOW()
      WHERE user_id = ${userId}
        AND type = 'subscription'
        AND (
          scheduled_plan_id IS NOT NULL
          OR scheduled_interval IS NOT NULL
          OR scheduled_period_start IS NOT NULL
          OR scheduled_period_end IS NOT NULL
          OR scheduled_at IS NOT NULL
        )
      RETURNING 
        id, 
        status,
        scheduled_plan_id,
        scheduled_interval,
        updated_at
    `;
    console.log(`已清除 ${clearScheduledResult.length} 条订阅记录的 scheduled 字段`);
    if (clearScheduledResult.length > 0) {
      console.table(clearScheduledResult);
    }

    // 4. 验证最终状态
    console.log('\n4. 验证最终状态...');
    const finalStatus = await sql`
      SELECT 
        u.email,
        u.id as user_id,
        p.id as subscription_id,
        p.subscription_id as creem_subscription_id,
        p.price_id,
        p.product_id,
        p.status,
        p.interval,
        p.period_start,
        p.period_end,
        p.cancel_at_period_end,
        p.scheduled_plan_id,
        p.scheduled_interval,
        p.scheduled_period_start,
        p.scheduled_period_end,
        p.scheduled_at,
        uc.balance,
        uc.total_earned,
        uc.total_spent,
        p.updated_at
      FROM "user" u
      LEFT JOIN payment p ON p.user_id = u.id AND p.type = 'subscription'
      LEFT JOIN user_credits uc ON uc.user_id = u.id
      WHERE u.email = ${email}
      ORDER BY p.created_at DESC
    `;
    console.table(finalStatus);

    // 5. 检查是否还有活跃订阅
    const activeSubscriptions = finalStatus.filter(
      (s: { status: string }) =>
        s.status === 'active' || s.status === 'trialing' || s.status === 'past_due'
    );
    const hasScheduledPlans = finalStatus.some(
      (s: { scheduled_plan_id: string | null }) => s.scheduled_plan_id !== null
    );

    console.log('\n========================================');
    if (activeSubscriptions.length === 0 && !hasScheduledPlans) {
      console.log(`✅ 已将 ${email} 设置为纯 Free 计划用户`);
      console.log('✅ 所有活跃订阅已取消');
      console.log('✅ 所有 scheduled plan 字段已清除');
    } else {
      console.warn(`⚠️  警告:`);
      if (activeSubscriptions.length > 0) {
        console.warn(`   - 仍有 ${activeSubscriptions.length} 个活跃订阅`);
      }
      if (hasScheduledPlans) {
        console.warn(`   - 仍有 scheduled plan 字段未清除`);
      }
    }
    console.log('========================================\n');
  } catch (error) {
    console.error('执行失败:', error);
    process.exit(1);
  }
}

setUserToPureFree();
