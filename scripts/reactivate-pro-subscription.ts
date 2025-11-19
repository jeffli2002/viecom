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

async function reactivateProSubscription() {
  const email = 'jefflee2002@gmail.com';

  try {
    console.log(`\n=== 恢复 ${email} 的 Pro 订阅为正常活跃状态 ===\n`);

    // 1. 查看当前 Pro 订阅状态
    console.log('1. 查看当前 Pro 订阅状态...');
    const proSubscriptions = await sql`
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
        p.created_at,
        p.updated_at
      FROM "user" u
      JOIN payment p ON p.user_id = u.id
      WHERE u.email = ${email}
        AND p.type = 'subscription'
        AND (
          p.product_id = 'prod_kUzMsZPgszRro3jOiUrfd'
          OR p.product_id = 'prod_7VQbOmypdWBKd8k1W4aiH2'
          OR p.price_id = 'pro'
        )
        AND p.status = 'active'
      ORDER BY p.created_at DESC
    `;

    console.log(`找到 ${proSubscriptions.length} 个活跃的 Pro 订阅`);
    if (proSubscriptions.length > 0) {
      console.table(proSubscriptions);
    } else {
      console.log('没有找到活跃的 Pro 订阅');
      return;
    }

    // 2. 更新 cancel_at_period_end 为 false
    console.log('\n2. 更新 cancel_at_period_end 为 false...');
    const updateResult = await sql`
      WITH target_user AS (
        SELECT id, email
        FROM "user"
        WHERE email = ${email}
        LIMIT 1
      )
      UPDATE payment
      SET 
        cancel_at_period_end = false,
        updated_at = NOW()
      WHERE user_id IN (SELECT id FROM target_user)
        AND type = 'subscription'
        AND status = 'active'
        AND (
          product_id = 'prod_kUzMsZPgszRro3jOiUrfd'
          OR product_id = 'prod_7VQbOmypdWBKd8k1W4aiH2'
          OR price_id = 'pro'
        )
      RETURNING id, subscription_id, price_id, product_id, status, cancel_at_period_end, updated_at
    `;

    console.log(`已更新 ${updateResult.length} 个 Pro 订阅`);
    if (updateResult.length > 0) {
      console.table(updateResult);
    }

    // 3. 验证最终状态
    console.log('\n3. 验证最终状态...');
    const finalStatus = await sql`
      SELECT 
        u.email,
        p.id as subscription_id,
        p.price_id,
        p.product_id,
        p.status,
        p.interval,
        p.period_start,
        p.period_end,
        p.cancel_at_period_end,
        p.updated_at
      FROM "user" u
      JOIN payment p ON p.user_id = u.id
      WHERE u.email = ${email}
        AND p.type = 'subscription'
        AND (
          p.product_id = 'prod_kUzMsZPgszRro3jOiUrfd'
          OR p.product_id = 'prod_7VQbOmypdWBKd8k1W4aiH2'
          OR p.price_id = 'pro'
        )
        AND p.status = 'active'
      ORDER BY p.created_at DESC
    `;

    console.table(finalStatus);

    console.log('\n========================================');
    console.log('✅ 操作完成：Pro 订阅已恢复为正常活跃状态');
    console.log('========================================\n');
  } catch (error) {
    console.error('执行失败:', error);
    process.exit(1);
  }
}

reactivateProSubscription();
