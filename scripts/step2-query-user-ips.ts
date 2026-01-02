import { resolve } from 'node:path';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { session, user } from '../src/server/db/schema';

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

// 从第一步的结果中获取的用户ID列表（请根据第一步的输出填入）
// 格式: ['user-id-1', 'user-id-2', ...]
const userIds: string[] = [];
// 如果需要按邮箱查询，可以使用下面的配置
// const userEmails: string[] = [];

async function queryUserIPs() {
  try {
    console.log('='.repeat(80));
    console.log('第二步: 查询用户IP地址');
    console.log('='.repeat(80));
    console.log('');

    if (userIds.length === 0) {
      console.log('⚠️  请先在脚本中配置要查询的用户ID列表');
      console.log('请编辑此脚本，在 userIds 数组中填入第一步获取的用户ID\n');
      process.exit(0);
    }

    console.log(`需要查询的用户数量: ${userIds.length}`);
    console.log('用户ID列表:');
    userIds.forEach((id, index) => {
      console.log(`  ${index + 1}. ${id}`);
    });
    console.log('');

    console.log('正在连接数据库...');
    console.log('正在查询用户信息和IP地址...\n');

    for (const userId of userIds) {
      // Get user info
      const userInfo = await db
        .select({
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (userInfo.length === 0) {
        console.log(`⚠️  用户ID ${userId} 不存在\n`);
        continue;
      }

      const userRecord = userInfo[0];
      console.log('='.repeat(80));
      console.log(`用户: ${userRecord.email || 'N/A'} (${userRecord.name || 'N/A'})`);
      console.log(`用户ID: ${userId}`);
      console.log(`注册时间: ${userRecord.createdAt.toISOString()}`);
      console.log('='.repeat(80));

      // Get all sessions for this user
      const userSessions = await db
        .select({
          id: session.id,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        })
        .from(session)
        .where(eq(session.userId, userId))
        .orderBy(session.createdAt);

      console.log(`\n找到 ${userSessions.length} 条会话记录\n`);

      if (userSessions.length === 0) {
        console.log('❌ 该用户没有会话记录，无法获取IP地址\n');
        continue;
      }

      // Extract unique IP addresses
      const ipAddresses = new Set<string>();
      const ipDetails: Array<{
        ip: string;
        firstSeen: Date;
        lastSeen: Date;
        sessionCount: number;
      }> = [];

      const ipMap = new Map<string, { firstSeen: Date; lastSeen: Date; count: number }>();

      userSessions.forEach((sess) => {
        if (sess.ipAddress) {
          ipAddresses.add(sess.ipAddress);
          if (!ipMap.has(sess.ipAddress)) {
            ipMap.set(sess.ipAddress, {
              firstSeen: sess.createdAt,
              lastSeen: sess.createdAt,
              count: 0,
            });
          }
          const ipInfo = ipMap.get(sess.ipAddress)!;
          ipInfo.count++;
          if (sess.createdAt < ipInfo.firstSeen) {
            ipInfo.firstSeen = sess.createdAt;
          }
          if (sess.createdAt > ipInfo.lastSeen) {
            ipInfo.lastSeen = sess.createdAt;
          }
        }
      });

      // Convert to array
      ipMap.forEach((info, ip) => {
        ipDetails.push({
          ip,
          firstSeen: info.firstSeen,
          lastSeen: info.lastSeen,
          sessionCount: info.count,
        });
      });

      // Sort by last seen (most recent first)
      ipDetails.sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());

      console.log(`IP地址数量: ${ipDetails.length}\n`);

      ipDetails.forEach((detail, index) => {
        console.log(`${index + 1}. IP地址: ${detail.ip}`);
        console.log(`   首次使用: ${detail.firstSeen.toISOString()}`);
        console.log(`   最后使用: ${detail.lastSeen.toISOString()}`);
        console.log(`   会话次数: ${detail.sessionCount}`);
        console.log('');
      });

      console.log(`所有IP地址列表: ${Array.from(ipAddresses).join(', ')}\n`);
    }

    console.log('='.repeat(80));
    console.log('第二步完成');
    console.log('='.repeat(80));
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

queryUserIPs();
















