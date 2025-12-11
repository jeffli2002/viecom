/**
 * Check IP addresses for suspicious users to detect duplicate account registration
 *
 * Usage: pnpm tsx scripts/check-suspicious-users-ip.ts
 */

import { resolve } from 'node:path';
import { config } from 'dotenv';

// Load .env.local file FIRST
config({ path: resolve(process.cwd(), '.env.local') });

// Set SKIP_ENV_VALIDATION to avoid env.ts validation when importing modules
process.env.SKIP_ENV_VALIDATION = 'true';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Please check your .env.local file.');
  process.exit(1);
}

import { session, user } from '@/server/db/schema';
import { neon } from '@neondatabase/serverless';
import { and, eq, gte, lte } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(databaseUrl);
const db = drizzle(sql);

const SUSPICIOUS_USERS = [
  {
    email: 'kogofaj648@westcms.com',
    userId: 'bK5Gt8prtjfNeXOET5EK3CKUUVL7npuL',
    name: 'Hihi',
  },
  {
    email: 'jotaniy139@wwlmail.com',
    userId: 'JQnLeLXEG79QuwdZuPJa2MQWvL1QeXOQ',
    name: 'Jiha',
  },
  {
    email: 'dopebeh211@wwlmail.com',
    userId: 'e9VMNvfwgOIrg1arA26DJ5lO3nRae4fu',
    name: 'dope',
  },
];

async function checkUserIPs() {
  console.log('🔍 Checking IP addresses for suspicious users...\n');

  const userIPMap = new Map<
    string,
    Array<{ ip: string | null; createdAt: Date; userAgent: string | null }>
  >();

  for (const suspiciousUser of SUSPICIOUS_USERS) {
    console.log(`\n📋 User: ${suspiciousUser.name} (${suspiciousUser.email})`);
    console.log(`   User ID: ${suspiciousUser.userId}`);

    // Get user creation time
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.id, suspiciousUser.userId))
      .limit(1);

    if (userRecord.length === 0) {
      console.log('   ⚠️  User not found in database');
      continue;
    }

    const userCreatedAt = userRecord[0].createdAt;
    console.log(`   Created at: ${userCreatedAt.toISOString()}`);

    // Get all sessions for this user
    // Check sessions from user creation time to 7 days after
    const sevenDaysAfter = new Date(userCreatedAt);
    sevenDaysAfter.setDate(sevenDaysAfter.getDate() + 7);

    const sessions = await db
      .select()
      .from(session)
      .where(
        and(
          eq(session.userId, suspiciousUser.userId),
          gte(session.createdAt, userCreatedAt),
          lte(session.createdAt, sevenDaysAfter)
        )
      )
      .orderBy(session.createdAt);

    console.log(`   📍 Found ${sessions.length} session(s) within 7 days of registration:`);

    const ips: Array<{ ip: string | null; createdAt: Date; userAgent: string | null }> = [];
    const uniqueIPs = new Set<string>();

    sessions.forEach((sess, idx) => {
      console.log(`      ${idx + 1}. IP: ${sess.ipAddress || 'N/A'}`);
      console.log(`         Created: ${sess.createdAt.toISOString()}`);
      console.log(`         User Agent: ${sess.userAgent?.substring(0, 80) || 'N/A'}...`);

      if (sess.ipAddress) {
        uniqueIPs.add(sess.ipAddress);
        ips.push({
          ip: sess.ipAddress,
          createdAt: sess.createdAt,
          userAgent: sess.userAgent,
        });
      }
    });

    console.log(`   🔢 Unique IP addresses: ${uniqueIPs.size}`);
    if (uniqueIPs.size > 0) {
      console.log(`   IPs: ${Array.from(uniqueIPs).join(', ')}`);
    }

    userIPMap.set(suspiciousUser.userId, ips);
  }

  // Cross-check IP addresses
  console.log('\n\n🔗 Cross-checking IP addresses across users...\n');

  const allIPs = new Map<
    string,
    Array<{ userId: string; email: string; name: string; createdAt: Date }>
  >();

  for (const [userId, ips] of userIPMap.entries()) {
    const userInfo = SUSPICIOUS_USERS.find((u) => u.userId === userId);
    if (!userInfo) continue;

    for (const ipData of ips) {
      if (!ipData.ip) continue;

      if (!allIPs.has(ipData.ip)) {
        allIPs.set(ipData.ip, []);
      }

      allIPs.get(ipData.ip)?.push({
        userId,
        email: userInfo.email,
        name: userInfo.name,
        createdAt: ipData.createdAt,
      });
    }
  }

  // Find shared IPs
  const sharedIPs = Array.from(allIPs.entries()).filter(([_, users]) => users.length > 1);

  if (sharedIPs.length > 0) {
    console.log('⚠️  FOUND SHARED IP ADDRESSES (Possible duplicate accounts):\n');
    sharedIPs.forEach(([ip, users]) => {
      console.log(`   IP: ${ip}`);
      console.log(`   Used by ${users.length} user(s):`);
      users.forEach((u) => {
        console.log(`      - ${u.name} (${u.email})`);
        console.log(`        User ID: ${u.userId}`);
        console.log(`        Session created: ${u.createdAt.toISOString()}`);
      });
      console.log('');
    });
  } else {
    console.log('✅ No shared IP addresses found.');
    console.log(
      "   (This doesn't necessarily mean they're different users - they might use VPNs or different networks)"
    );
  }

  // Summary
  console.log('\n\n📊 Summary:');
  console.log(`   Total users checked: ${SUSPICIOUS_USERS.length}`);
  console.log(`   Total unique IPs found: ${allIPs.size}`);
  console.log(`   Shared IPs: ${sharedIPs.length}`);

  if (sharedIPs.length > 0) {
    console.log('\n⚠️  RECOMMENDATION: These accounts likely belong to the same user.');
    console.log('   Consider banning or flagging these accounts for review.');
  }

  process.exit(0);
}

checkUserIPs().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
