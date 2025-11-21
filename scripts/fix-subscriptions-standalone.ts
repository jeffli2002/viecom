/**
 * Standalone script to fix multiple active subscriptions
 * This version loads env directly without validation
 */

import { existsSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';
import postgres from 'postgres';

// Load .env.local
const envPath = resolve(process.cwd(), '.env.local');
if (!existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  process.exit(1);
}

config({ path: envPath });

const DATABASE_URL = process.env.DATABASE_URL;
const CREEM_API_KEY = process.env.CREEM_API_KEY;
const CREEM_TEST_MODE = process.env.NEXT_PUBLIC_CREEM_TEST_MODE === 'true';

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

if (!CREEM_API_KEY) {
  console.error('❌ CREEM_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('✅ Environment loaded');
console.log(`📊 Creem Test Mode: ${CREEM_TEST_MODE ? 'ON' : 'OFF'}\n`);

// Initialize database
const sql = postgres(DATABASE_URL);

// Creem API helper
async function getCreemSubscription(subscriptionId: string) {
  const baseUrl = CREEM_TEST_MODE
    ? 'https://api.creem.io/v1/subscriptions'
    : 'https://api.creem.io/v1/subscriptions';

  const response = await fetch(`${baseUrl}/${subscriptionId}`, {
    headers: {
      Authorization: `Bearer ${CREEM_API_KEY}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function cancelCreemSubscription(subscriptionId: string) {
  const baseUrl = CREEM_TEST_MODE
    ? 'https://api.creem.io/v1/subscriptions'
    : 'https://api.creem.io/v1/subscriptions';

  const response = await fetch(`${baseUrl}/${subscriptionId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${CREEM_API_KEY}`,
    },
  });

  return response.ok;
}

function normalizeStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'active',
    trialing: 'trialing',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'incomplete_expired',
    past_due: 'past_due',
    unpaid: 'unpaid',
    paused: 'paused',
  };

  return statusMap[status?.toLowerCase()] || status;
}

async function main() {
  console.log('🔧 Starting subscription cleanup...\n');

  // Get all Creem subscriptions
  const subscriptions = await sql`
    SELECT * FROM payment 
    WHERE provider = 'creem' 
    ORDER BY user_id, created_at DESC
  `;

  console.log(`Found ${subscriptions.length} Creem subscriptions\n`);

  // Group by user
  const userSubs = new Map<string, typeof subscriptions>();
  for (const sub of subscriptions) {
    if (!userSubs.has(sub.user_id)) {
      userSubs.set(sub.user_id, []);
    }
    userSubs.get(sub.user_id)!.push(sub);
  }

  console.log(`Found ${userSubs.size} unique users\n`);

  let syncCount = 0;
  let cancelCount = 0;
  let errorCount = 0;

  for (const [userId, subs] of userSubs.entries()) {
    console.log(`${'='.repeat(60)}`);
    console.log(`User: ${userId}`);
    console.log(`Subscriptions: ${subs.length}`);
    console.log(`${'='.repeat(60)}\n`);

    // Sync each subscription with Creem
    const syncedSubs: Array<{ sub: (typeof subs)[0]; creemStatus: string | null }> = [];

    for (const sub of subs) {
      if (!sub.subscription_id) {
        console.log(`  ⚠️  No subscription_id for ${sub.id}`);
        continue;
      }

      try {
        console.log(`  Checking ${sub.subscription_id} (DB: ${sub.status})...`);

        const creemData = await getCreemSubscription(sub.subscription_id);

        if (!creemData) {
          console.log(`    ❌ Not found in Creem - marking as canceled`);

          if (sub.status !== 'canceled') {
            await sql`
              UPDATE payment 
              SET status = 'canceled', updated_at = NOW() 
              WHERE id = ${sub.id}
            `;
            syncCount++;
          }

          syncedSubs.push({ sub, creemStatus: 'canceled' });
          continue;
        }

        const creemStatus = normalizeStatus(creemData.status || 'active');
        console.log(`    Creem: ${creemStatus}`);

        if (sub.status !== creemStatus) {
          console.log(`    🔧 Updating: ${sub.status} → ${creemStatus}`);

          await sql`
            UPDATE payment 
            SET status = ${creemStatus}, updated_at = NOW() 
            WHERE id = ${sub.id}
          `;

          syncCount++;
        } else {
          console.log(`    ✓ Already in sync`);
        }

        syncedSubs.push({ sub: { ...sub, status: creemStatus }, creemStatus });
      } catch (error) {
        console.error(`    ❌ Error:`, error);
        errorCount++;
        syncedSubs.push({ sub, creemStatus: null });
      }
    }

    // Find active subscriptions
    const activeSubs = syncedSubs.filter(
      (s) =>
        s.creemStatus === 'active' || s.creemStatus === 'trialing' || s.creemStatus === 'past_due'
    );

    if (activeSubs.length <= 1) {
      console.log(`  ✓ Correct state (${activeSubs.length} active)\n`);
      continue;
    }

    // Multiple active - keep most recent
    console.log(`  ⚠️  MULTIPLE ACTIVE: ${activeSubs.length}`);
    console.log(`  🔧 Keeping most recent...\n`);

    activeSubs.sort(
      (a, b) => new Date(b.sub.created_at).getTime() - new Date(a.sub.created_at).getTime()
    );

    const keep = activeSubs[0];
    const cancel = activeSubs.slice(1);

    console.log(`  ✅ KEEPING: ${keep.sub.subscription_id} (${keep.sub.price_id})`);

    for (const c of cancel) {
      console.log(`\n  ❌ CANCELING: ${c.sub.subscription_id} (${c.sub.price_id})`);

      try {
        if (c.sub.subscription_id) {
          const canceled = await cancelCreemSubscription(c.sub.subscription_id);
          console.log(`     ${canceled ? '✓' : '⚠️'} Creem: ${canceled ? 'canceled' : 'failed'}`);
        }

        await sql`
          UPDATE payment 
          SET status = 'canceled', cancel_at_period_end = false, updated_at = NOW() 
          WHERE id = ${c.sub.id}
        `;

        console.log(`     ✓ DB: canceled`);
        cancelCount++;
      } catch (error) {
        console.error(`     ❌ Error:`, error);
        errorCount++;
      }
    }

    console.log();
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`Subscriptions: ${subscriptions.length}`);
  console.log(`✅ Synced: ${syncCount}`);
  console.log(`❌ Canceled duplicates: ${cancelCount}`);
  console.log(`⚠️  Errors: ${errorCount}`);
  console.log(`\n✅ Done!`);

  await sql.end();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
