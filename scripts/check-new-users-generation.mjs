// Check all users created since a cutoff date for generation activity (JS version)
// Usage: node scripts/check-new-users-generation.mjs [YYYY-MM-DD]
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required. Please populate .env.local');
  process.exit(1);
}
// Sanitize quotes that sometimes appear in .env files
databaseUrl = databaseUrl.replace(/^\s*["']+|["']+\s*$/g, '');

const cutoffArg = process.argv[2];
const cutoff = cutoffArg ? new Date(cutoffArg) : new Date('2025-12-28T00:00:00Z');

function fmt(d) {
  try {
    return new Date(d).toISOString();
  } catch {
    return String(d);
  }
}

async function main() {
  console.log('=== New user generation check (JS) ===');
  console.log('Cutoff:', cutoff.toISOString());

  const sql = postgres(databaseUrl, { prepare: false });
  try {
    const users = await sql`
      select id, email, name, created_at
      from "user"
      where created_at >= ${cutoff}
      order by created_at desc
    `;

    if (users.length === 0) {
      console.log('No users created since cutoff.');
      return;
    }

    console.log(`Found ${users.length} user(s) since cutoff\n`);

    let zeroAssetsCount = 0;
    for (const u of users) {
      const [credit] = await sql`
        select id, balance, total_earned, total_spent, frozen_balance
        from user_credits
        where user_id = ${u.id}
        limit 1
      `;

      const [assetCount] = await sql`
        select count(*)::int as count
        from generated_asset
        where user_id = ${u.id}
      `;

      const [bonusCount] = await sql`
        select count(*)::int as count
        from credit_transactions
        where user_id = ${u.id} and source = 'bonus'
      `;

      const [spendCount] = await sql`
        select count(*)::int as count
        from credit_transactions
        where user_id = ${u.id} and type = 'spend' and source = 'api_call' and created_at >= ${cutoff}
      `;

      const totalAssets = assetCount?.count ?? 0;
      if (totalAssets === 0) zeroAssetsCount++;

      const recentAssets = await sql`
        select id, asset_type, status, created_at
        from generated_asset
        where user_id = ${u.id}
        order by created_at desc
        limit 3
      `;

      console.log(`- ${u.email} (${u.id})`);
      console.log(`  Created: ${fmt(u.created_at)}`);
      if (credit) {
        const available = (credit.balance || 0) - (credit.frozen_balance || 0);
        console.log(
          `  Credits: ${credit.balance} (earned ${credit.total_earned}, spent ${credit.total_spent}, frozen ${credit.frozen_balance || 0}, available ${available})`
        );
      } else {
        console.log('  Credits: NO ACCOUNT');
      }
      console.log(`  Signup bonus tx: ${bonusCount?.count ?? 0}`);
      console.log(`  Spend tx (api_call) since cutoff: ${spendCount?.count ?? 0}`);
      console.log(`  Assets: ${totalAssets}`);
      for (let i = 0; i < recentAssets.length; i++) {
        const a = recentAssets[i];
        console.log(`    ${i + 1}. [${a.asset_type}] ${a.status} @ ${fmt(a.created_at)}`);
      }
    }

    console.log(`\nSummary: ${zeroAssetsCount}/${users.length} users have 0 assets`);
  } catch (error) {
    console.error('Error:', error);
    process.exitCode = 1;
  } finally {
    try { await sql.end({ timeout: 5 }); } catch {}
  }
}

main();
