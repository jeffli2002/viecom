// Count generated assets since a cutoff date; group by day and type
// Usage: node scripts/count-assets-since.mjs [YYYY-MM-DD]
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

let databaseUrl = process.env.DATABASE_URL || '';
databaseUrl = databaseUrl.replace(/^\s*["']+|["']+\s*$/g, '');
if (!databaseUrl) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const cutoffArg = process.argv[2];
const cutoff = cutoffArg ? new Date(cutoffArg) : new Date('2025-12-24T00:00:00Z');

function fmt(d) {
  try { return new Date(d).toISOString().slice(0, 10); } catch { return String(d); }
}

async function main() {
  console.log('Cutoff:', cutoff.toISOString());
  const sql = postgres(databaseUrl, { prepare: false });
  try {
    const rows = await sql`
      select date_trunc('day', created_at) as day,
             asset_type,
             status,
             count(*)::int as count
      from generated_asset
      where created_at >= ${cutoff}
      group by 1,2,3
      order by 1 desc, 2, 3
    `;

    if (rows.length === 0) {
      console.log('No assets since cutoff');
      return;
    }

    let total = 0;
    const byDay = new Map();
    for (const r of rows) {
      const day = fmt(r.day);
      total += r.count;
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day).push(r);
    }

    console.log('Total assets:', total);
    for (const [day, items] of byDay) {
      const line = items
        .map((r) => `${r.asset_type}/${r.status}:${r.count}`)
        .join(', ');
      console.log(`${day}: ${line}`);
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    try { await sql.end({ timeout: 5 }); } catch {}
  }
}

main();

