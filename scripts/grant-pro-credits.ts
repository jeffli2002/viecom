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

async function grantProCredits() {
  const email = process.argv[2] || 'jefflee2002@gmail.com';
  const targetCredits = 500; // Pro plan monthly credits

  try {
    console.log(`\n=== 为 ${email} 授予 Pro 计划积分 (${targetCredits}) ===\n`);

    // 1. 查找用户和活跃订阅
    const userInfo = await sql`
      SELECT 
        u.id as user_id,
        u.email,
        p.id as subscription_id,
        p.subscription_id as creem_subscription_id,
        p.price_id,
        p.product_id,
        p.status,
        p.interval,
        uc.balance as current_balance
      FROM "user" u
      LEFT JOIN payment p ON p.user_id = u.id AND p.type = 'subscription' AND p.status = 'active'
      LEFT JOIN user_credits uc ON uc.user_id = u.id
      WHERE u.email = ${email}
      ORDER BY p.created_at DESC
      LIMIT 1
    `;

    if (userInfo.length === 0) {
      console.error('用户不存在:', email);
      process.exit(1);
    }

    const user = userInfo[0];
    console.log('用户信息:');
    console.table(userInfo);

    if (!user.subscription_id) {
      console.error('用户没有活跃订阅');
      process.exit(1);
    }

    // 2. 检查是否已经授予过积分
    const existingGrants = await sql`
      SELECT 
        ct.id,
        ct.amount,
        ct.balance_after,
        ct.description,
        ct.reference_id,
        ct.created_at
      FROM credit_transactions ct
      WHERE ct.user_id = ${user.user_id}
        AND ct.source = 'subscription'
        AND (
          ct.reference_id LIKE ${`creem_${user.creem_subscription_id}_initial_%`} OR
          ct.reference_id LIKE ${`creem_${user.creem_subscription_id}_renewal_%`}
        )
      ORDER BY ct.created_at DESC
    `;

    console.log('\n已存在的订阅积分授予记录:');
    if (existingGrants.length > 0) {
      console.table(existingGrants);
      const totalGranted = existingGrants.reduce((sum, txn) => sum + (txn.amount || 0), 0);
      console.log(`\n已授予总额: ${totalGranted} 积分`);
      console.log(`目标积分: ${targetCredits} 积分`);

      if (totalGranted >= targetCredits) {
        console.log('\n✅ 积分已足够，无需再次授予');
        return;
      }

      const creditsToGrant = targetCredits - totalGranted;
      console.log(`\n需要授予: ${creditsToGrant} 积分`);
    } else {
      console.log('无已存在的授予记录');
      console.log(`\n需要授予: ${targetCredits} 积分`);
    }

    // 3. 授予积分
    const subscriptionId = user.creem_subscription_id || user.subscription_id;
    const referenceId = `creem_${subscriptionId}_initial_${Date.now()}`;
    const currentBalance = user.current_balance || 0;
    const creditsToGrant =
      existingGrants.length > 0
        ? targetCredits - existingGrants.reduce((sum, txn) => sum + (txn.amount || 0), 0)
        : targetCredits;
    const newBalance = currentBalance + creditsToGrant;

    console.log('\n授予积分...');
    console.log(`当前余额: ${currentBalance}`);
    console.log(`授予金额: ${creditsToGrant}`);
    console.log(`新余额: ${newBalance}`);

    // 更新积分账户
    await sql`
      INSERT INTO user_credits (id, user_id, balance, total_earned, total_spent, frozen_balance, created_at, updated_at)
      VALUES (${randomUUID()}, ${user.user_id}, ${newBalance}, ${creditsToGrant}, 0, 0, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE
      SET 
        balance = user_credits.balance + ${creditsToGrant},
        total_earned = user_credits.total_earned + ${creditsToGrant},
        updated_at = NOW()
    `;

    // 记录交易
    await sql`
      INSERT INTO credit_transactions (
        id,
        user_id,
        type,
        amount,
        balance_after,
        source,
        description,
        reference_id,
        metadata,
        created_at
      )
      VALUES (
        ${randomUUID()},
        ${user.user_id},
        'earn',
        ${creditsToGrant},
        ${newBalance},
        'subscription',
        'Pro subscription credits (manual grant)',
        ${referenceId},
        ${JSON.stringify({
          planId: 'pro',
          planIdentifier: user.price_id || 'pro',
          subscriptionId,
          provider: 'creem',
          isRenewal: false,
          manualGrant: true,
        })},
        NOW()
      )
    `;

    console.log('\n✅ 积分授予成功！');

    // 4. 验证最终状态
    const finalStatus = await sql`
      SELECT 
        u.email,
        uc.balance,
        uc.total_earned,
        uc.total_spent
      FROM "user" u
      LEFT JOIN user_credits uc ON uc.user_id = u.id
      WHERE u.email = ${email}
    `;
    console.log('\n最终积分状态:');
    console.table(finalStatus);

    // 5. 显示最近的交易记录
    const recentTransactions = await sql`
      SELECT 
        ct.type,
        ct.amount,
        ct.balance_after,
        ct.source,
        ct.description,
        ct.reference_id,
        ct.created_at
      FROM credit_transactions ct
      WHERE ct.user_id = ${user.user_id}
      ORDER BY ct.created_at DESC
      LIMIT 5
    `;
    console.log('\n最近的交易记录（最近 5 条）:');
    console.table(recentTransactions);

    console.log('\n========================================');
    console.log(`✅ 已为 ${email} 授予 ${creditsToGrant} Pro 计划积分`);
    console.log('========================================\n');
  } catch (error) {
    console.error('执行失败:', error);
    process.exit(1);
  }
}

grantProCredits();
