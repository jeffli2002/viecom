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

async function checkCredits() {
  const email = 'jefflee2002@gmail.com';

  try {
    console.log(`\n=== 检查 ${email} 的积分状态 ===\n`);

    // 1. 查看用户基本信息
    console.log('1. 用户基本信息:');
    const userInfo = await sql`
      SELECT 
        u.id as user_id,
        u.email,
        u.created_at as user_created_at
      FROM "user" u
      WHERE u.email = ${email}
    `;
    console.table(userInfo);

    // 2. 查看用户当前积分余额
    console.log('\n2. 用户当前积分余额:');
    const creditBalance = await sql`
      SELECT 
        u.email,
        uc.id as credit_account_id,
        uc.balance,
        uc.total_earned,
        uc.total_spent,
        uc.frozen_balance,
        uc.created_at as credit_account_created_at,
        uc.updated_at as credit_account_updated_at
      FROM "user" u
      LEFT JOIN user_credits uc ON uc.user_id = u.id
      WHERE u.email = ${email}
    `;
    console.table(creditBalance);

    // 3. 查看最近的积分交易记录（最近 20 条）
    console.log('\n3. 最近的积分交易记录（最近 20 条）:');
    const recentTransactions = await sql`
      SELECT 
        u.email,
        ct.id as transaction_id,
        ct.type,
        ct.amount,
        ct.balance_after,
        ct.source,
        ct.description,
        ct.reference_id,
        ct.metadata,
        ct.created_at
      FROM "user" u
      JOIN credit_transactions ct ON ct.user_id = u.id
      WHERE u.email = ${email}
      ORDER BY ct.created_at DESC
      LIMIT 20
    `;
    console.table(recentTransactions);

    // 4. 查看订阅相关的积分交易记录
    console.log('\n4. 订阅相关的积分交易记录:');
    const subscriptionTransactions = await sql`
      SELECT 
        u.email,
        ct.id as transaction_id,
        ct.type,
        ct.amount,
        ct.balance_after,
        ct.source,
        ct.description,
        ct.reference_id,
        ct.metadata,
        ct.created_at
      FROM "user" u
      JOIN credit_transactions ct ON ct.user_id = u.id
      WHERE u.email = ${email}
        AND ct.source = 'subscription'
      ORDER BY ct.created_at DESC
      LIMIT 10
    `;
    console.table(subscriptionTransactions);

    // 5. 查看最近的订阅记录
    console.log('\n5. 最近的订阅记录:');
    const subscriptions = await sql`
      SELECT 
        u.email,
        p.id as payment_id,
        p.subscription_id,
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
      ORDER BY p.created_at DESC
      LIMIT 10
    `;
    console.table(subscriptions);

    // 6. 查看活跃订阅记录
    console.log('\n6. 活跃订阅记录:');
    const activeSubscriptions = await sql`
      SELECT 
        u.email,
        p.id as payment_id,
        p.subscription_id,
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
        AND p.status IN ('active', 'trialing')
      ORDER BY p.created_at DESC
    `;
    console.table(activeSubscriptions);

    // 7. 统计积分交易（按类型和来源）
    console.log('\n7. 积分交易统计（按类型和来源）:');
    const transactionStats = await sql`
      SELECT 
        ct.type,
        ct.source,
        COUNT(*) as transaction_count,
        SUM(ct.amount) as total_amount,
        MIN(ct.created_at) as first_transaction,
        MAX(ct.created_at) as last_transaction
      FROM "user" u
      JOIN credit_transactions ct ON ct.user_id = u.id
      WHERE u.email = ${email}
      GROUP BY ct.type, ct.source
      ORDER BY last_transaction DESC
    `;
    console.table(transactionStats);

    // 8. 检查是否有重复的积分授予
    console.log('\n8. 重复的积分授予检查:');
    const duplicateGrants = await sql`
      SELECT 
        ct.reference_id,
        COUNT(*) as duplicate_count,
        MIN(ct.created_at) as first_created,
        MAX(ct.created_at) as last_created,
        SUM(ct.amount) as total_amount
      FROM "user" u
      JOIN credit_transactions ct ON ct.user_id = u.id
      WHERE u.email = ${email}
        AND ct.reference_id IS NOT NULL
        AND ct.source = 'subscription'
      GROUP BY ct.reference_id
      HAVING COUNT(*) > 1
      ORDER BY last_created DESC
    `;
    if (duplicateGrants.length > 0) {
      console.table(duplicateGrants);
      console.warn('⚠️  发现重复的积分授予！');
    } else {
      console.log('✅ 未发现重复的积分授予');
    }

    // 9. 检查最近 1 小时内的积分交易
    console.log('\n9. 最近 1 小时内的积分交易:');
    const recentHourTransactions = await sql`
      SELECT 
        u.email,
        ct.id as transaction_id,
        ct.type,
        ct.amount,
        ct.balance_after,
        ct.source,
        ct.description,
        ct.reference_id,
        ct.metadata,
        ct.created_at
      FROM "user" u
      JOIN credit_transactions ct ON ct.user_id = u.id
      WHERE u.email = ${email}
        AND ct.created_at > NOW() - INTERVAL '1 hour'
      ORDER BY ct.created_at DESC
    `;
    if (recentHourTransactions.length > 0) {
      console.table(recentHourTransactions);
    } else {
      console.log('ℹ️  最近 1 小时内没有积分交易');
    }

    console.log('\n========================================');
    console.log('✅ 积分检查完成');
    console.log('========================================\n');
  } catch (error) {
    console.error('执行失败:', error);
    process.exit(1);
  }
}

checkCredits();
