import { resolve } from 'node:path';
import { config } from 'dotenv';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
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

const taskIds = ['4e1de0e2442ea7190aa196148834d0be', '5a0d054faafdf3c99bca745d2dd5f1ac'];

async function checkUserIPs() {
  try {
    console.log('Checking IP addresses for task IDs...\n');
    console.log('Task IDs to check:');
    taskIds.forEach((id, index) => {
      console.log(`  ${index + 1}. ${id}`);
    });
    console.log('');

    // First, get the assets and user IDs
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

    if (foundAssets.length === 0) {
      console.log('❌ No assets found with these task IDs.');
      process.exit(0);
    }

    console.log('='.repeat(80));
    console.log('USER INFORMATION:');
    console.log('='.repeat(80));

    const userIPs: Map<
      string,
      Array<{ ipAddress: string | null; createdAt: Date; taskId: string }>
    > = new Map();

    // For each user, find their sessions around the generation time
    for (const asset of foundAssets) {
      console.log(`\n📋 Task ID: ${asset.taskId}`);
      console.log(`   User: ${asset.userEmail || 'N/A'} (${asset.userId})`);
      console.log(`   Generation Time: ${asset.createdAt.toISOString()}`);

      // Look for sessions within 1 hour before and after generation
      const timeWindowStart = new Date(asset.createdAt);
      timeWindowStart.setHours(timeWindowStart.getHours() - 1);

      const timeWindowEnd = new Date(asset.createdAt);
      timeWindowEnd.setHours(timeWindowEnd.getHours() + 1);

      const userSessions = await db
        .select({
          id: session.id,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        })
        .from(session)
        .where(
          and(
            eq(session.userId, asset.userId),
            gte(session.createdAt, timeWindowStart),
            lte(session.createdAt, timeWindowEnd)
          )
        )
        .orderBy(desc(session.createdAt))
        .limit(10);

      // Also check for sessions that were active during generation time
      const activeSessions = await db
        .select({
          id: session.id,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        })
        .from(session)
        .where(
          and(
            eq(session.userId, asset.userId),
            gte(session.updatedAt, timeWindowStart),
            lte(session.updatedAt, timeWindowEnd)
          )
        )
        .orderBy(desc(session.updatedAt))
        .limit(10);

      // Combine and deduplicate
      const allSessions = [...userSessions, ...activeSessions];
      const uniqueSessions = new Map<string, (typeof userSessions)[0]>();
      for (const sess of allSessions) {
        if (!uniqueSessions.has(sess.id)) {
          uniqueSessions.set(sess.id, sess);
        }
      }

      const sessions = Array.from(uniqueSessions.values());

      if (sessions.length > 0) {
        console.log(`   📍 Found ${sessions.length} session(s) around generation time:`);

        const ips: Array<{ ipAddress: string | null; createdAt: Date; taskId: string }> = [];

        sessions.forEach((sess, idx) => {
          console.log(`      ${idx + 1}. IP: ${sess.ipAddress || 'N/A'}`);
          console.log(`         Created: ${sess.createdAt.toISOString()}`);
          console.log(`         Updated: ${sess.updatedAt.toISOString()}`);
          console.log(`         User Agent: ${sess.userAgent?.substring(0, 60) || 'N/A'}...`);

          if (sess.ipAddress) {
            ips.push({
              ipAddress: sess.ipAddress,
              createdAt: sess.createdAt,
              taskId: asset.taskId,
            });
          }
        });

        if (!userIPs.has(asset.userId)) {
          userIPs.set(asset.userId, []);
        }
        userIPs.get(asset.userId)?.push(...ips);
      } else {
        console.log('   ⚠️  No sessions found around generation time');

        // Try to find any recent sessions for this user
        const recentSessions = await db
          .select({
            id: session.id,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
          })
          .from(session)
          .where(eq(session.userId, asset.userId))
          .orderBy(desc(session.createdAt))
          .limit(5);

        if (recentSessions.length > 0) {
          console.log(
            `   📍 Found ${recentSessions.length} recent session(s) (not in time window):`
          );
          recentSessions.forEach((sess, idx) => {
            console.log(`      ${idx + 1}. IP: ${sess.ipAddress || 'N/A'}`);
            console.log(`         Created: ${sess.createdAt.toISOString()}`);

            if (sess.ipAddress) {
              if (!userIPs.has(asset.userId)) {
                userIPs.set(asset.userId, []);
              }
              userIPs.get(asset.userId)?.push({
                ipAddress: sess.ipAddress,
                createdAt: sess.createdAt,
                taskId: asset.taskId,
              });
            }
          });
        } else {
          console.log('   ❌ No sessions found for this user at all');
        }
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('IP ADDRESS COMPARISON:');
    console.log('='.repeat(80));

    const allIPs: Array<{
      userId: string;
      userEmail: string | null;
      ipAddress: string;
      taskId: string;
    }> = [];

    userIPs.forEach((ips, userId) => {
      const asset = foundAssets.find((a) => a.userId === userId);
      ips.forEach((ip) => {
        if (ip.ipAddress) {
          allIPs.push({
            userId,
            userEmail: asset?.userEmail || null,
            ipAddress: ip.ipAddress,
            taskId: ip.taskId,
          });
        }
      });
    });

    if (allIPs.length === 0) {
      console.log('\n❌ No IP addresses found for these users.');
      console.log('This could mean:');
      console.log('1. Sessions were not created/updated around generation time');
      console.log('2. IP addresses are not being captured');
      console.log('3. Sessions have expired or been deleted');
    } else {
      // Group by IP address
      const ipGroups = new Map<string, typeof allIPs>();
      for (const entry of allIPs) {
        if (!ipGroups.has(entry.ipAddress)) {
          ipGroups.set(entry.ipAddress, []);
        }
        ipGroups.get(entry.ipAddress)?.push(entry);
      }

      console.log(
        `\n📊 Found ${allIPs.length} IP address record(s) across ${ipGroups.size} unique IP(s)\n`
      );

      ipGroups.forEach((entries, ip) => {
        const uniqueUsers = new Set(entries.map((e) => e.userId));
        console.log(`\n📍 IP Address: ${ip}`);
        console.log(`   Used by ${uniqueUsers.size} user(s):`);
        entries.forEach((entry) => {
          console.log(`      - ${entry.userEmail || 'N/A'} (${entry.userId})`);
          console.log(`        Task ID: ${entry.taskId}`);
        });
      });

      // Check if both users share the same IP
      const _uniqueIPs = Array.from(ipGroups.keys());
      const user1IPs = allIPs
        .filter((ip) => ip.userId === foundAssets[0]?.userId)
        .map((ip) => ip.ipAddress);
      const user2IPs = allIPs
        .filter((ip) => ip.userId === foundAssets[1]?.userId)
        .map((ip) => ip.ipAddress);

      const sharedIPs = user1IPs.filter((ip) => user2IPs.includes(ip));

      console.log(`\n${'='.repeat(80)}`);
      console.log('CONCLUSION:');
      console.log('='.repeat(80));

      if (sharedIPs.length > 0) {
        console.log('\n⚠️  WARNING: Both users share the same IP address(es)!');
        sharedIPs.forEach((ip) => {
          console.log(`   Shared IP: ${ip}`);
        });
        console.log('\nThis could indicate:');
        console.log('- Same person using multiple accounts');
        console.log('- Shared network/VPN');
        console.log('- Same location/device');
      } else {
        console.log('\n✅ The two users have DIFFERENT IP addresses');
        console.log(`   User 1 IPs: ${user1IPs.length > 0 ? user1IPs.join(', ') : 'None found'}`);
        console.log(`   User 2 IPs: ${user2IPs.length > 0 ? user2IPs.join(', ') : 'None found'}`);
      }
    }

    console.log(`\n${'='.repeat(80)}`);
  } catch (error) {
    console.error('Error checking IP addresses:', error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

checkUserIPs();
