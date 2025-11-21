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

async function cancelProPlus() {
  const email = 'jefflee2002@gmail.com';

  try {
    console.log(`\n=== 取消 ${email} 的 Pro+ 订阅，保留 Pro 订阅 ===\n`);

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
        AND p.type = 'subscription'
      ORDER BY p.created_at DESC
    `;

    console.table(currentSubscriptions);

    // 2. 取消所有 Pro+ 订阅
    console.log('\n2. 取消所有 Pro+ 订阅...');
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
        AND (
          product_id = 'prod_4s8si1GkKRtU0HuUEWz6ry'
          OR product_id = 'prod_4SM5v4tktYr2rNXZnH70Fh'
          OR price_id = 'proplus'
        )
      RETURNING id, subscription_id, price_id, product_id, status, updated_at
    `;

    console.log(`已取消 ${updateResult.length} 个 Pro+ 订阅`);
    if (updateResult.length > 0) {
      console.table(updateResult);
    }

    // 3. 验证最终状态
    console.log('\n3. 最终订阅状态...');
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
      LEFT JOIN payment p ON p.user_id = u.id AND p.type = 'subscription'
      WHERE u.email = ${email}
      ORDER BY 
        CASE WHEN p.status = 'active' THEN 1 ELSE 2 END,
        p.created_at DESC
    `;

    console.table(finalStatus);

    console.log('\n========================================');
    console.log('✅ 操作完成');
    console.log('========================================\n');
  } catch (error) {
    console.error('执行失败:', error);
    process.exit(1);
  }
}

cancelProPlus();
