import { resolve } from 'node:path';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { generatedAsset, session, user } from '../src/server/db/schema';
import * as fs from 'fs';

// Force immediate output after imports
console.log('Script starting...');
process.stdout.write('Loading environment...\n');

// Load .env.local file FIRST
process.stdout.write('Loading environment variables...\n');
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

process.stdout.write(`Database URL check: ${databaseUrl ? 'Found' : 'NOT FOUND'}\n`);

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

async function checkUserIPs() {
  const output: string[] = [];
  const log = (msg: string) => {
    console.log(msg);
    output.push(msg);
  };
  
  const client = postgres(databaseUrl);
  const db = drizzle(client);

  try {
    log('=== 任务ID用户邮箱和IP地址查询 ===\n');
    log('查询的任务ID:');
    taskIds.forEach((id, index) => {
      log(`  ${index + 1}. ${id}`);
    });
    log('');

    log('正在连接数据库...');
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

    log(`✓ 数据库已连接，找到 ${allAssets.length} 条资产记录`);
    log('正在搜索匹配的任务ID...\n');

    const foundAssets: Array<{
      id: string;
      userId: string;
      userEmail: string | null;
      userName: string | null;
      createdAt: Date;
      status: string;
      taskId: string;
    }> = [];

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

    log(`找到 ${foundAssets.length} 条匹配的资产记录\n`);

    if (foundAssets.length === 0) {
      log('❌ 没有找到匹配的任务ID');
      log('\n可能的原因:');
      log('1. 这些任务ID不存在于数据库中');
      log('2. 任务ID存储格式不同');
      log('3. metadata字段结构不同');
      await client.end();
      fs.writeFileSync('task-ips-result.txt', output.join('\n'), 'utf-8');
      log('\n结果已保存到 task-ips-result.txt');
      return;
    }

    log('='.repeat(80));
    log('用户信息和IP地址:');
    log('='.repeat(80));

    const results: Array<{
      taskId: string;
      userEmail: string | null;
      userName: string | null;
      userId: string;
      ipAddresses: string[];
      createdAt: Date;
    }> = [];

    for (const asset of foundAssets) {
      log(`\n📋 任务ID: ${asset.taskId}`);
      log(`   用户邮箱: ${asset.userEmail || 'N/A'}`);
      log(`   用户名: ${asset.userName || 'N/A'}`);
      log(`   用户ID: ${asset.userId}`);
      log(`   生成时间: ${asset.createdAt.toISOString()}`);
      log(`   状态: ${asset.status}`);

      const timeWindowStart = new Date(asset.createdAt);
      timeWindowStart.setHours(timeWindowStart.getHours() - 1);

      const timeWindowEnd = new Date(asset.createdAt);
      timeWindowEnd.setHours(timeWindowEnd.getHours() + 1);

      // 查找生成时间前后1小时内的会话
      const userSessions = await db
        .select({
          ipAddress: session.ipAddress,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        })
        .from(session)
        .where(eq(session.userId, asset.userId))
        .orderBy(session.createdAt);

      const relevantSessions = userSessions.filter((sess) => {
        return (
          (sess.createdAt >= timeWindowStart && sess.createdAt <= timeWindowEnd) ||
          (sess.updatedAt >= timeWindowStart && sess.updatedAt <= timeWindowEnd)
        );
      });

      const ipAddresses = new Set<string>();
      relevantSessions.forEach((sess) => {
        if (sess.ipAddress) {
          ipAddresses.add(sess.ipAddress);
        }
      });

      // 如果没有找到时间窗口内的会话，使用最近的会话
      if (ipAddresses.size === 0 && userSessions.length > 0) {
        userSessions.slice(0, 5).forEach((sess) => {
          if (sess.ipAddress) {
            ipAddresses.add(sess.ipAddress);
          }
        });
      }

      const ipList = Array.from(ipAddresses);
      log(`   IP地址: ${ipList.length > 0 ? ipList.join(', ') : '未找到'}`);

      results.push({
        taskId: asset.taskId,
        userEmail: asset.userEmail,
        userName: asset.userName,
        userId: asset.userId,
        ipAddresses: ipList,
        createdAt: asset.createdAt,
      });
    }

    log(`\n${'='.repeat(80)}`);
    log('汇总结果:');
    log('='.repeat(80));

    results.forEach((result, index) => {
      log(`\n${index + 1}. 任务ID: ${result.taskId}`);
      log(`   用户邮箱: ${result.userEmail || 'N/A'}`);
      log(`   用户名: ${result.userName || 'N/A'}`);
      log(`   用户ID: ${result.userId}`);
      log(`   IP地址: ${result.ipAddresses.length > 0 ? result.ipAddresses.join(', ') : '未找到'}`);
      log(`   生成时间: ${result.createdAt.toISOString()}`);
    });

    log(`\n${'='.repeat(80)}`);
    await client.end();
    
    // 保存结果到文件
    fs.writeFileSync('task-ips-result.txt', output.join('\n'), 'utf-8');
    log('\n✓ 结果已保存到 task-ips-result.txt 文件');
  } catch (error) {
    const errorMsg = `错误: ${error instanceof Error ? error.message : String(error)}`;
    log(errorMsg);
    console.error('详细错误:', error);
    try {
      await client.end();
    } catch (_e) {
      // Ignore
    }
    fs.writeFileSync('task-ips-result.txt', output.join('\n'), 'utf-8');
    throw error;
  }
}

checkUserIPs()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('致命错误:', error);
    process.exit(1);
  });

