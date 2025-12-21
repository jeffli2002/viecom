// Query task IDs and get user emails
// Run with: node scripts/query-task-emails.mjs

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import postgres from 'postgres';

// Load .env.local manually
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const envFile = readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value.trim();
        }
      }
    });
  } catch (error) {
    console.error('Warning: Could not load .env.local file:', error.message);
  }
}

loadEnv();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Please check your .env.local file.');
  process.exit(1);
}

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
  console.log('='.repeat(80));
  console.log('第一步: 查询任务ID对应的用户邮箱账号');
  console.log('='.repeat(80));
  console.log('\n查询的任务ID:');
  taskIds.forEach((id, index) => {
    console.log(`  ${index + 1}. ${id}`);
  });
  console.log('');

  const sql = postgres(databaseUrl);

  try {
    console.log('正在连接数据库...');
    
    // Query assets with matching task IDs using SQL
    const allAssets = [];
    
    for (const taskId of taskIds) {
      const results = await sql`
        SELECT 
          ga.id,
          ga.user_id,
          ga.created_at,
          ga.status,
          ga.metadata,
          u.email,
          u.name
        FROM generated_asset ga
        LEFT JOIN "user" u ON ga.user_id = u.id
        WHERE ga.metadata->>'taskId' = ${taskId}
      `;
      allAssets.push(...results);
    }

    console.log(`✓ 找到 ${allAssets.length} 条匹配的记录\n`);

    if (allAssets.length === 0) {
      console.log('❌ 没有找到匹配的任务ID');
      console.log('\n可能的原因:');
      console.log('1. 这些任务ID不存在于数据库中');
      console.log('2. 任务ID存储格式不同');
      console.log('3. metadata字段结构不同');
      await sql.end();
      process.exit(0);
    }

    // Display results
    allAssets.forEach((asset, index) => {
      const metadata = asset.metadata || {};
      const taskId = metadata.taskId || 'N/A';
      
      console.log(`${index + 1}. 任务ID: ${taskId}`);
      console.log(`   用户邮箱: ${asset.email || 'N/A'}`);
      console.log(`   用户名: ${asset.name || 'N/A'}`);
      console.log(`   用户ID: ${asset.user_id}`);
      console.log(`   状态: ${asset.status}`);
      console.log(`   创建时间: ${new Date(asset.created_at).toISOString()}`);
      console.log('');
    });

    // Summary by email
    console.log('='.repeat(80));
    console.log('按用户邮箱汇总:');
    console.log('='.repeat(80));
    
    const emailMap = new Map();
    allAssets.forEach((asset) => {
      const email = asset.email || 'N/A';
      const metadata = asset.metadata || {};
      const taskId = metadata.taskId;
      if (!emailMap.has(email)) {
        emailMap.set(email, []);
      }
      if (taskId) {
        emailMap.get(email).push(taskId);
      }
    });

    emailMap.forEach((taskIds, email) => {
      console.log(`\n${email}:`);
      console.log(`  任务ID数量: ${taskIds.length}`);
      console.log(`  任务ID: ${taskIds.join(', ')}`);
    });

    // Get unique user IDs for step 2
    const userIds = [...new Set(allAssets.map(a => a.user_id))];
    console.log('\n' + '='.repeat(80));
    console.log('第一步完成');
    console.log('='.repeat(80));
    console.log(`\n找到 ${userIds.length} 个不同的用户ID，用于第二步查询IP地址:`);
    console.log(`用户ID列表: ${userIds.join(', ')}\n`);
  } catch (error) {
    console.error('❌ 错误:', error.message);
    if (error.stack) {
      console.error('堆栈:', error.stack);
    }
    process.exit(1);
  } finally {
    await sql.end();
  }
}

queryTaskEmails();
