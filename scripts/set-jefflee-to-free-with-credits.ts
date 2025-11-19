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

async function setUserToFreeWithCredits() {
  const email = 'jefflee2002@gmail.com';
  const targetCredits = 100;

  try {
    console.log(`\n=== 将 ${email} 设置为 Free 计划，积分设置为 ${targetCredits} ===\n`);

    // 1. 查看当前状态
    console.log('1. 查看当前状态...');
    const currentStatus = await sql`
      SELECT 
        u.email,
        u.id as user_id,
        p.id as subscription_id,
        p.subscription_id as creem_subscription_id,
        p.price_id,
        p.status,
        p.interval,
        uc.balance,
        uc.total_earned,
        uc.total_spent
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
    const currentBalance = currentStatus[0].balance || 0;

    console.log(`\n当前积分余额: ${currentBalance}`);
    console.log(`目标积分余额: ${targetCredits}`);

    // 2. 取消所有活跃订阅
    console.log('\n2. 取消所有活跃订阅...');
    const updateResult = await sql`
      UPDATE payment
      SET 
        status = 'canceled',
        cancel_at_period_end = false,
        updated_at = NOW()
      WHERE user_id = ${userId}
        AND type = 'subscription'
        AND status IN ('active', 'trialing', 'past_due')
      RETURNING id, status, updated_at
    `;
    console.log(`已更新 ${updateResult.length} 条订阅记录`);
    if (updateResult.length > 0) {
      console.table(updateResult);
    }

    // 3. 获取旧余额（在更新之前）
    const oldBalance = currentBalance;
    const creditDifference = targetCredits - oldBalance;

    // 4. 更新或创建积分账户
    console.log('\n3. 更新积分余额...');
    await sql`
      INSERT INTO user_credits (id, user_id, balance, total_earned, total_spent, frozen_balance, created_at, updated_at)
      VALUES (${randomUUID()}, ${userId}, ${targetCredits}, ${targetCredits}, 0, 0, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE
      SET 
        balance = ${targetCredits},
        updated_at = NOW()
    `;
    console.log(`✅ 积分余额已更新为 ${targetCredits}`);

    // 5. 记录积分调整交易（如果有变化）
    if (creditDifference !== 0) {
      console.log('\n4. 记录积分调整交易...');
      const transactionType =
        creditDifference > 0 ? 'earn' : creditDifference < 0 ? 'spend' : 'admin_adjust';
      const referenceId = `admin_set_credits_${userId}_${Date.now()}`;
      const description = `Admin adjustment: Set credits to ${targetCredits} (downgrade from pro+ to free)`;

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
          created_at
        )
        VALUES (
          ${randomUUID()},
          ${userId},
          ${transactionType},
          ${Math.abs(creditDifference)},
          ${targetCredits},
          'admin',
          ${description},
          ${referenceId},
          NOW()
        )
      `;
      console.log(`✅ 已记录交易: ${transactionType} ${Math.abs(creditDifference)} 积分`);
    } else {
      console.log('\n4. 积分无变化，无需记录交易');
    }

    // 6. 验证最终状态
    console.log('\n5. 验证最终状态...');
    const finalStatus = await sql`
      SELECT 
        u.email,
        u.id as user_id,
        p.id as subscription_id,
        p.status as subscription_status,
        p.price_id,
        uc.balance,
        uc.total_earned,
        uc.total_spent,
        uc.updated_at as credits_updated_at
      FROM "user" u
      LEFT JOIN payment p ON p.user_id = u.id AND p.type = 'subscription' AND p.status = 'active'
      LEFT JOIN user_credits uc ON uc.user_id = u.id
      WHERE u.email = ${email}
    `;
    console.table(finalStatus);

    // 7. 显示最近的交易记录
    console.log('\n6. 最近的交易记录（最近 5 条）...');
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
      WHERE ct.user_id = ${userId}
      ORDER BY ct.created_at DESC
      LIMIT 5
    `;
    console.table(recentTransactions);

    console.log('\n========================================');
    console.log(`✅ 已将 ${email} 设置为 Free 计划`);
    console.log(`✅ 积分已设置为 ${targetCredits}`);
    console.log('========================================\n');
  } catch (error) {
    console.error('执行失败:', error);
    process.exit(1);
  }
}

setUserToFreeWithCredits();
