/**
 * Check all users created since a cutoff date for generation activity.
 * Shows whether they have credit accounts and any generated assets.
 *
 * Usage: pnpm tsx scripts/check-new-users-generation.ts [YYYY-MM-DD]
 */
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { generatedAsset, session, user, userCredits } from '../src/server/db/schema';

config({ path: resolve(process.cwd(), '.env.local') });
process.env.SKIP_ENV_VALIDATION = 'true';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required. Please populate .env.local');
  process.exit(1);
}

const cutoffArg = process.argv[2];
const cutoff = cutoffArg ? new Date(cutoffArg) : new Date('2025-12-28T00:00:00Z');

async function main() {
  console.log('=== New user generation check ===');
  console.log('Cutoff:', cutoff.toISOString());

  const client = postgres(databaseUrl);
  const db = drizzle(client);

  try {
    const users = await db
      .select({ id: user.id, email: user.email, name: user.name, createdAt: user.createdAt })
      .from(user)
      .where(gte(user.createdAt, cutoff))
      .orderBy(desc(user.createdAt));

    if (users.length === 0) {
      console.log('No users created since cutoff.');
      return;
    }

    console.log(`Found ${users.length} user(s) since cutoff\n`);

    let zeroAssetsCount = 0;
    for (const u of users) {
      const credits = await db
        .select({
          id: userCredits.id,
          balance: userCredits.balance,
          totalEarned: userCredits.totalEarned,
          totalSpent: userCredits.totalSpent,
        })
        .from(userCredits)
        .where(eq(userCredits.userId, u.id))
        .limit(1);

      const [credit] = credits;

      const assetCountRows = await db
        .select({ count: sql`COUNT(*)`.as('count') })
        .from(generatedAsset)
        .where(eq(generatedAsset.userId, u.id));

      const totalAssets = Number(assetCountRows[0]?.count || 0);
      const recentAssets = await db
        .select({
          id: generatedAsset.id,
          createdAt: generatedAsset.createdAt,
          status: generatedAsset.status,
          assetType: generatedAsset.assetType,
        })
        .from(generatedAsset)
        .where(eq(generatedAsset.userId, u.id))
        .orderBy(desc(generatedAsset.createdAt))
        .limit(3);

      if (totalAssets === 0) zeroAssetsCount++;

      console.log(`- ${u.email} (${u.id})`);
      console.log(`  Created: ${u.createdAt.toISOString()}`);
      console.log(
        `  Credits: ${credit ? `${credit.balance} (earned ${credit.totalEarned}, spent ${credit.totalSpent})` : 'NO ACCOUNT'}`
      );
      console.log(`  Assets: ${totalAssets}`);
      if (recentAssets.length > 0) {
        recentAssets.forEach((a, i) => {
          console.log(`    ${i + 1}. [${a.assetType}] ${a.status} @ ${a.createdAt.toISOString()}`);
        });
      }
    }

    console.log(`\nSummary: ${zeroAssetsCount}/${users.length} users have 0 assets`);
  } catch (error) {
    console.error('Error:', error);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch { /* ignore */ }
  }
}

main();

