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

async function checkSubscription() {
  const email = 'jefflee2002@gmail.com';

  try {
    console.log(`\n=== 检查 ${email} 的订阅信息 ===\n`);

    // 查看活跃订阅
    const activeSubscriptions = await sql`
      SELECT 
        u.email,
        u.id as user_id,
        p.id as subscription_id,
        p.subscription_id as creem_subscription_id,
        p.price_id,
        p.product_id,
        p.status,
        p.interval,
        p.provider,
        p.period_start,
        p.period_end,
        p.cancel_at_period_end,
        p.created_at
      FROM "user" u
      JOIN payment p ON p.user_id = u.id
      WHERE u.email = ${email}
        AND p.type = 'subscription'
        AND p.status IN ('active', 'trialing', 'past_due')
      ORDER BY p.created_at DESC
    `;

    console.log('活跃订阅:');
    console.table(activeSubscriptions);

    if (activeSubscriptions.length === 0) {
      console.log('\n⚠️  没有找到活跃订阅');
    } else {
      console.log('\n✅ 找到活跃订阅，应该显示为 Pro 计划');
    }
  } catch (error) {
    console.error('执行失败:', error);
    process.exit(1);
  }
}

checkSubscription();
