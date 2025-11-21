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

async function checkSubscriptionProvider() {
  const email = 'jefflee2002@gmail.com';

  try {
    console.log(`\n=== 检查 ${email} 的订阅 provider 字段 ===\n`);

    // 查看所有订阅记录
    const subscriptions = await sql`
      SELECT 
        u.email,
        p.id as subscription_id,
        p.subscription_id as creem_subscription_id,
        p.price_id,
        p.product_id,
        p.status,
        p.provider,
        p.interval,
        p.created_at,
        p.updated_at
      FROM "user" u
      JOIN payment p ON p.user_id = u.id
      WHERE u.email = ${email}
        AND p.type = 'subscription'
      ORDER BY p.created_at DESC
    `;

    console.log(`找到 ${subscriptions.length} 个订阅记录:`);
    console.table(subscriptions);

    // 检查活跃订阅的 provider
    const activeSubscriptions = subscriptions.filter(
      (s) => s.status === 'active' || s.status === 'trialing' || s.status === 'past_due'
    );

    console.log(`\n活跃订阅: ${activeSubscriptions.length} 个`);
    if (activeSubscriptions.length > 0) {
      console.table(activeSubscriptions);

      const creemSubscriptions = activeSubscriptions.filter((s) => s.provider === 'creem');
      const nonCreemSubscriptions = activeSubscriptions.filter((s) => s.provider !== 'creem');

      console.log(`\nCreem 订阅: ${creemSubscriptions.length} 个`);
      if (creemSubscriptions.length > 0) {
        console.table(creemSubscriptions);
      }

      console.log(`\n非 Creem 订阅: ${nonCreemSubscriptions.length} 个`);
      if (nonCreemSubscriptions.length > 0) {
        console.table(nonCreemSubscriptions);
        console.log('\n⚠️  发现非 Creem 的活跃订阅，这可能导致 billing 页面显示错误');
      }
    }

    // 检查是否有 provider 为 null 的订阅
    const nullProviderSubscriptions = subscriptions.filter((s) => !s.provider);
    if (nullProviderSubscriptions.length > 0) {
      console.log(`\n⚠️  发现 ${nullProviderSubscriptions.length} 个 provider 为 null 的订阅:`);
      console.table(nullProviderSubscriptions);
    }
  } catch (error) {
    console.error('执行失败:', error);
    process.exit(1);
  }
}

checkSubscriptionProvider();
