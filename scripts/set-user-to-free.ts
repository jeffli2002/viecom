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

async function setUserToFree() {
  const email = 'jefflee2002@gmail.com';

  try {
    console.log(`\n=== 将 ${email} 设置为 Free 计划 ===\n`);

    // 1. 查看当前订阅状态
    console.log('1. 查看当前订阅状态...');
    const currentSubscriptions = await sql`
      SELECT 
        u.email,
        p.id as subscription_id,
        p.subscription_id as creem_subscription_id,
        p.price_id,
        p.product_id,
        p.status,
        p.interval,
        p.period_start,
        p.period_end,
        p.cancel_at_period_end,
        p.created_at
      FROM "user" u
      LEFT JOIN payment p ON p.user_id = u.id
      WHERE u.email = ${email}
      ORDER BY p.created_at DESC
    `;

    console.table(currentSubscriptions);

    // 2. 取消所有活跃订阅
    console.log('\n2. 取消所有活跃订阅...');
    const updateResult = await sql`
      WITH target_user AS (
        SELECT id, email
        FROM "user"
        WHERE email = ${email}
        LIMIT 1
      )
      UPDATE payment
      SET 
        status = 'canceled',
        cancel_at_period_end = false,
        updated_at = NOW()
      WHERE user_id IN (SELECT id FROM target_user)
        AND type = 'subscription'
        AND status IN ('active', 'trialing', 'past_due')
      RETURNING id, status, updated_at
    `;

    console.log(`已更新 ${updateResult.length} 条订阅记录`);
    if (updateResult.length > 0) {
      console.table(updateResult);
    }

    // 3. 验证更新结果
    console.log('\n3. 验证更新结果...');
    const updatedSubscriptions = await sql`
      SELECT 
        u.email,
        p.id as subscription_id,
        p.subscription_id as creem_subscription_id,
        p.price_id,
        p.product_id,
        p.status,
        p.interval,
        p.period_start,
        p.period_end,
        p.cancel_at_period_end,
        p.updated_at
      FROM "user" u
      LEFT JOIN payment p ON p.user_id = u.id AND p.type = 'subscription'
      WHERE u.email = ${email}
      ORDER BY p.created_at DESC
    `;

    console.table(updatedSubscriptions);

    // 4. 显示用户当前积分状态
    console.log('\n4. 用户当前积分状态...');
    const creditStatus = await sql`
      SELECT 
        u.email,
        uc.balance,
        uc.total_earned,
        uc.total_spent,
        uc.updated_at as credits_updated_at
      FROM "user" u
      LEFT JOIN user_credits uc ON uc.user_id = u.id
      WHERE u.email = ${email}
    `;

    console.table(creditStatus);

    console.log('\n========================================');
    console.log(`✅ 已将 ${email} 设置为 Free 计划`);
    console.log('所有活跃订阅已取消');
    console.log('========================================\n');
  } catch (error) {
    console.error('执行失败:', error);
    process.exit(1);
  }
}

setUserToFree();
