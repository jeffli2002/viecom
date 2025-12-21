/**
 * Query user email and IP addresses for given task IDs
 * Usage: tsx scripts/query-task-ips.ts
 */

import { resolve } from 'node:path';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { generatedAsset, session, user } from '../src/server/db/schema';

// Load environment variables
console.log('[1/8] Loading environment variables...');
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL environment variable is not set!');
  console.error('Please check your .env.local file.');
  process.exit(1);
}
console.log('[2/8] Database URL configured');

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

async function main() {
  console.log('[3/8] Creating database connection...');
  const client = postgres(databaseUrl);
  const db = drizzle(client);

  try {
    console.log('[4/8] Querying all assets from database...');
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

    console.log(`[5/8] Found ${allAssets.length} total assets, searching for matching task IDs...`);

    const foundAssets: Array<{
      taskId: string;
      userEmail: string | null;
      userName: string | null;
      userId: string;
      createdAt: Date;
      status: string;
    }> = [];

    for (const asset of allAssets) {
      if (asset.metadata && typeof asset.metadata === 'object') {
        const metadata = asset.metadata as Record<string, unknown>;
        const taskId = metadata.taskId;

        if (typeof taskId === 'string' && taskIds.includes(taskId)) {
          foundAssets.push({
            taskId: taskId,
            userEmail: asset.userEmail,
            userName: asset.userName,
            userId: asset.userId,
            createdAt: asset.createdAt,
            status: asset.status,
          });
        }
      }
    }

    console.log(`[6/8] Found ${foundAssets.length} matching assets\n`);

    if (foundAssets.length === 0) {
      console.log('❌ No assets found with the specified task IDs.');
      console.log('\nThis could mean:');
      console.log('1. The task IDs do not exist in the database');
      console.log('2. The task IDs are stored in a different format');
      console.log('3. The metadata field structure is different');
      await client.end();
      return;
    }

    console.log('='.repeat(80));
    console.log('查询结果: 用户邮箱和IP地址');
    console.log('='.repeat(80));
    console.log('');

    console.log('[7/8] Querying IP addresses for each user...\n');

    for (const asset of foundAssets) {
      console.log(`任务ID: ${asset.taskId}`);
      console.log(`  用户邮箱: ${asset.userEmail || 'N/A'}`);
      console.log(`  用户名: ${asset.userName || 'N/A'}`);
      console.log(`  用户ID: ${asset.userId}`);
      console.log(`  状态: ${asset.status}`);
      console.log(`  生成时间: ${asset.createdAt.toISOString()}`);

      // Calculate time window
      const timeWindowStart = new Date(asset.createdAt);
      timeWindowStart.setHours(timeWindowStart.getHours() - 1);
      const timeWindowEnd = new Date(asset.createdAt);
      timeWindowEnd.setHours(timeWindowEnd.getHours() + 1);

      // Query sessions
      const userSessions = await db
        .select({
          ipAddress: session.ipAddress,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        })
        .from(session)
        .where(eq(session.userId, asset.userId));

      // Find IPs within time window
      const relevantIPs = new Set<string>();
      for (const sess of userSessions) {
        if (
          sess.ipAddress &&
          ((sess.createdAt >= timeWindowStart && sess.createdAt <= timeWindowEnd) ||
            (sess.updatedAt >= timeWindowStart && sess.updatedAt <= timeWindowEnd))
        ) {
          relevantIPs.add(sess.ipAddress);
        }
      }

      // If no IPs in time window, use most recent IPs
      if (relevantIPs.size === 0 && userSessions.length > 0) {
        const sortedSessions = [...userSessions].sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
        for (const sess of sortedSessions.slice(0, 5)) {
          if (sess.ipAddress) {
            relevantIPs.add(sess.ipAddress);
          }
        }
      }

      const ipList = Array.from(relevantIPs);
      console.log(`  IP地址: ${ipList.length > 0 ? ipList.join(', ') : '未找到'}`);
      console.log('');
    }

    console.log('[8/8] Query completed successfully');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error(error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    throw error;
  } finally {
    await client.end();
  }
}

// Execute
main()
  .then(() => {
    console.log('\nScript completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nFatal error:', error);
    process.exit(1);
  });





