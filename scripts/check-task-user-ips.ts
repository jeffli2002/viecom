import { resolve } from 'node:path';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { generatedAsset, session, user } from '../src/server/db/schema';

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

async function checkTaskUserIPs() {
  try {
    console.log('Checking user email and IP addresses for task IDs...\n');
    console.log('Task IDs to check:');
    taskIds.forEach((id, index) => {
      console.log(`  ${index + 1}. ${id}`);
    });
    console.log('');

    // Search for assets with these task IDs in metadata
    // Join with user table to get email
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
    console.log('RESULTS:');
    console.log('='.repeat(80));
    console.log(`\nFound ${foundAssets.length} out of ${taskIds.length} task IDs in database\n`);

    if (foundAssets.length === 0) {
      console.log('❌ No assets found with these task IDs.');
      console.log('\nThis could mean:');
      console.log('1. The task IDs are not stored in the database');
      console.log('2. The assets were generated in test mode');
      console.log('3. The task IDs are stored in a different format');
      await client.end();
      process.exit(0);
    }

    // For each found asset, get user IP addresses
    console.log('='.repeat(80));
    console.log('USER EMAIL AND IP ADDRESSES:');
    console.log('='.repeat(80));

    for (const asset of foundAssets) {
      console.log(`\n📋 Task ID: ${asset.taskId}`);
      console.log(`   User Email: ${asset.userEmail || 'N/A'}`);
      console.log(`   User Name: ${asset.userName || 'N/A'}`);
      console.log(`   User ID: ${asset.userId}`);
      console.log(`   Status: ${asset.status}`);
      console.log(`   Created At: ${asset.createdAt.toISOString()}`);

      // Calculate time window (1 hour before and after creation)
      const timeWindowStart = new Date(asset.createdAt);
      timeWindowStart.setHours(timeWindowStart.getHours() - 1);

      const timeWindowEnd = new Date(asset.createdAt);
      timeWindowEnd.setHours(timeWindowEnd.getHours() + 1);

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
        .where(eq(session.userId, asset.userId));

      // Find sessions within time window
      const relevantSessions = userSessions.filter((sess) => {
        return (
          (sess.createdAt >= timeWindowStart && sess.createdAt <= timeWindowEnd) ||
          (sess.updatedAt >= timeWindowStart && sess.updatedAt <= timeWindowEnd)
        );
      });

      const ipAddresses = new Set<string>();
      if (relevantSessions.length > 0) {
        console.log(`   📍 Found ${relevantSessions.length} session(s) around generation time:`);
        relevantSessions.forEach((sess, idx) => {
          console.log(`      ${idx + 1}. IP: ${sess.ipAddress || 'N/A'}`);
          console.log(`         Created: ${sess.createdAt.toISOString()}`);
          if (sess.ipAddress) {
            ipAddresses.add(sess.ipAddress);
          }
        });
      } else {
        // If no sessions in time window, use most recent sessions
        const recentSessions = userSessions
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5);
        
        if (recentSessions.length > 0) {
          console.log(`   📍 Found ${recentSessions.length} recent session(s) (outside time window):`);
          recentSessions.forEach((sess, idx) => {
            console.log(`      ${idx + 1}. IP: ${sess.ipAddress || 'N/A'}`);
            console.log(`         Created: ${sess.createdAt.toISOString()}`);
            if (sess.ipAddress) {
              ipAddresses.add(sess.ipAddress);
            }
          });
        } else {
          console.log(`   ⚠️  No sessions found for this user`);
        }
      }

      const ipList = Array.from(ipAddresses);
      if (ipList.length > 0) {
        console.log(`   ✅ IP Addresses: ${ipList.join(', ')}`);
      } else {
        console.log(`   ❌ No IP addresses found`);
      }
    }

    // Summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('SUMMARY:');
    console.log('='.repeat(80));
    console.log(`\nTotal tasks found: ${foundAssets.length}/${taskIds.length}\n`);

    foundAssets.forEach((asset, index) => {
      console.log(`${index + 1}. Task ID: ${asset.taskId}`);
      console.log(`   Email: ${asset.userEmail || 'N/A'}`);
      console.log(`   User ID: ${asset.userId}`);
    });

    console.log(`\n${'='.repeat(80)}`);
  } catch (error) {
    console.error('Error checking task user IPs:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

checkTaskUserIPs();













