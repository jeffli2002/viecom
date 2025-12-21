// Query IP addresses for specific user IDs
// Run with: node scripts/query-user-ips.mjs
// 
// IMPORTANT: Edit the userIds array below with the user IDs from step 1

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

// 从第一步的结果中获取的用户ID列表（请根据第一步的输出填入）
// 格式: ['user-id-1', 'user-id-2', ...]
const userIds = [];

async function queryUserIPs() {
  console.log('='.repeat(80));
  console.log('第二步: 查询用户IP地址');
  console.log('='.repeat(80));
  console.log('');

  if (userIds.length === 0) {
    console.log('⚠️  请先在脚本中配置要查询的用户ID列表');
    console.log('请编辑 scripts/query-user-ips.mjs 文件，在 userIds 数组中填入第一步获取的用户ID\n');
    process.exit(0);
  }

  console.log(`需要查询的用户数量: ${userIds.length}`);
  console.log('用户ID列表:');
  userIds.forEach((id, index) => {
    console.log(`  ${index + 1}. ${id}`);
  });
  console.log('');

  const sql = postgres(databaseUrl);

  try {
    console.log('正在连接数据库...');
    console.log('正在查询用户信息和IP地址...\n');

    for (const userId of userIds) {
      // Get user info
      const userInfo = await sql`
        SELECT id, email, name, created_at
        FROM "user"
        WHERE id = ${userId}
        LIMIT 1
      `;

      if (userInfo.length === 0) {
        console.log(`⚠️  用户ID ${userId} 不存在\n`);
        continue;
      }

      const userRecord = userInfo[0];
      console.log('='.repeat(80));
      console.log(`用户: ${userRecord.email || 'N/A'} (${userRecord.name || 'N/A'})`);
      console.log(`用户ID: ${userId}`);
      console.log(`注册时间: ${new Date(userRecord.created_at).toISOString()}`);
      console.log('='.repeat(80));

      // Get all sessions for this user
      const userSessions = await sql`
        SELECT 
          id,
          ip_address,
          user_agent,
          created_at,
          updated_at
        FROM session
        WHERE user_id = ${userId}
        ORDER BY created_at ASC
      `;

      console.log(`\n找到 ${userSessions.length} 条会话记录\n`);

      if (userSessions.length === 0) {
        console.log('❌ 该用户没有会话记录，无法获取IP地址\n');
        continue;
      }

      // Extract unique IP addresses with details
      const ipMap = new Map();

      userSessions.forEach((sess) => {
        if (sess.ip_address) {
          if (!ipMap.has(sess.ip_address)) {
            ipMap.set(sess.ip_address, {
              ip: sess.ip_address,
              firstSeen: new Date(sess.created_at),
              lastSeen: new Date(sess.created_at),
              count: 0,
            });
          }
          const ipInfo = ipMap.get(sess.ip_address);
          ipInfo.count++;
          const sessCreated = new Date(sess.created_at);
          if (sessCreated < ipInfo.firstSeen) {
            ipInfo.firstSeen = sessCreated;
          }
          if (sessCreated > ipInfo.lastSeen) {
            ipInfo.lastSeen = sessCreated;
          }
        }
      });

      const ipDetails = Array.from(ipMap.values())
        .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());

      console.log(`IP地址数量: ${ipDetails.length}\n`);

      ipDetails.forEach((detail, index) => {
        console.log(`${index + 1}. IP地址: ${detail.ip}`);
        console.log(`   首次使用: ${detail.firstSeen.toISOString()}`);
        console.log(`   最后使用: ${detail.lastSeen.toISOString()}`);
        console.log(`   会话次数: ${detail.count}`);
        console.log('');
      });

      const ipList = ipDetails.map(d => d.ip).join(', ');
      console.log(`所有IP地址列表: ${ipList}\n`);
    }

    console.log('='.repeat(80));
    console.log('第二步完成');
    console.log('='.repeat(80));
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

queryUserIPs();
