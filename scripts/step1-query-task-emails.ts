import { resolve } from 'node:path';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { generatedAsset, user } from '../src/server/db/schema';

// Load .env.local file FIRST
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Please check your .env.local file.');
  process.exit(1);
}

// Create database connection directly
const client = postgres(databaseUrl);
const db = drizzle(client);

const taskIds = [
  '902add2231e88cf4ec0ef304d7560cc0',
  '19d9247790f27f2120f5d3ee3ba91b6d',
  'a77b0132fef368fa07f82c1f9608867a',
  '413d63b2d66aba90cc7a916b4509b362',
  '6b5f81f34a8efa916279f9520a615c29',
  'f4baad63b02b0e8109706b428d68fba7',
  'cb36d52f434080c2f0aee7348fd586df',
  '27caa88eebe1612171009a87582f8f5c',
  '73c7043e1635c5ce708c7bea6158f5a9',
];

async function queryTaskEmails() {
  try {
    console.log('='.repeat(80));
    console.log('第一步: 查询任务ID对应的用户邮箱账号');
    console.log('='.repeat(80));
    console.log('\n查询的任务ID:');
    taskIds.forEach((id, index) => {
      console.log(`  ${index + 1}. ${id}`);
    });
    console.log('');

    // Search for assets with these task IDs in metadata
    // Join with user table to get email
    console.log('正在连接数据库...');
    const allAssets = await db
      .select({
        id: generatedAsset.id,
        userId: generatedAsset.userId,
        userEmail: user.email,
        userName: user.name,
        createdAt: generatedAsset.createdAt,
        status: generatedAsset.status,
        metadata: generatedAsset.metadata,
      })
      .from(generatedAsset)
      .leftJoin(user, eq(generatedAsset.userId, user.id));

    console.log(`✓ 数据库已连接，找到 ${allAssets.length} 条资产记录`);
    console.log('正在搜索匹配的任务ID...\n');

    const foundAssets: Array<{
      id: string;
      userId: string;
      userEmail: string | null;
      userName: string | null;
      createdAt: Date;
      status: string;
      taskId: string;
    }> = [];

    // Check each asset's metadata for task IDs
    for (const asset of allAssets) {
      if (asset.metadata && typeof asset.metadata === 'object') {
        const metadata = asset.metadata as Record<string, unknown>;
        const taskId = metadata.taskId;

        if (typeof taskId === 'string' && taskIds.includes(taskId)) {
          foundAssets.push({
            id: asset.id,
            userId: asset.userId,
            userEmail: asset.userEmail,
            userName: asset.userName,
            createdAt: asset.createdAt,
            status: asset.status,
            taskId: taskId,
          });
        }
      }
    }

    console.log('='.repeat(80));
    console.log('查询结果:');
    console.log('='.repeat(80));
    console.log(`\n找到 ${foundAssets.length} / ${taskIds.length} 个匹配的任务ID\n`);

    if (foundAssets.length === 0) {
      console.log('❌ 没有找到匹配的任务ID');
      console.log('\n可能的原因:');
      console.log('1. 这些任务ID不存在于数据库中');
      console.log('2. 任务ID存储格式不同');
      console.log('3. metadata字段结构不同');
      await client.end();
      process.exit(0);
    }

    // Display results
    foundAssets.forEach((asset, index) => {
      console.log(`\n${index + 1}. 任务ID: ${asset.taskId}`);
      console.log(`   用户邮箱: ${asset.userEmail || 'N/A'}`);
      console.log(`   用户名: ${asset.userName || 'N/A'}`);
      console.log(`   用户ID: ${asset.userId}`);
      console.log(`   资产ID: ${asset.id}`);
      console.log(`   状态: ${asset.status}`);
      console.log(`   创建时间: ${asset.createdAt.toISOString()}`);
    });

    // Summary by email
    console.log(`\n${'='.repeat(80)}`);
    console.log('按用户邮箱汇总:');
    console.log('='.repeat(80));

    const emailMap = new Map<string, string[]>();
    foundAssets.forEach((asset) => {
      const email = asset.userEmail || 'N/A';
      if (!emailMap.has(email)) {
        emailMap.set(email, []);
      }
      emailMap.get(email)?.push(asset.taskId);
    });

    emailMap.forEach((taskIds, email) => {
      console.log(`\n${email}:`);
      console.log(`  任务ID数量: ${taskIds.length}`);
      console.log(`  任务ID: ${taskIds.join(', ')}`);
    });

    console.log(`\n${'='.repeat(80)}`);
    console.log('第一步完成');
    console.log('='.repeat(80));

    // Save results for step 2
    const userIds = Array.from(new Set(foundAssets.map((a) => a.userId)));
    console.log(`\n找到 ${userIds.length} 个不同的用户ID，可以在第二步中查询这些用户的IP地址`);
    console.log(`用户ID列表: ${userIds.join(', ')}\n`);
  } catch (error) {
    console.error('❌ 错误:', error);
    if (error instanceof Error) {
      console.error('错误信息:', error.message);
      console.error('堆栈:', error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

queryTaskEmails();
















