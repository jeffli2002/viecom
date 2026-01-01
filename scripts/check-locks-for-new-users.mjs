// Check generation_lock presence for users created since a cutoff
// Usage: node scripts/check-locks-for-new-users.mjs [YYYY-MM-DD]
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
const cutoff = cutoffArg ? new Date(cutoffArg) : new Date('2025-12-28T00:00:00Z');

function fmt(d) { try { return new Date(d).toISOString(); } catch { return String(d); } }

async function main() {
  const sql = postgres(databaseUrl, { prepare: false });
  try {
    const users = await sql`
      select id, email, created_at from "user"
      where created_at >= ${cutoff}
      order by created_at desc
    `;
    console.log(`Users since cutoff: ${users.length}`);

    let locks = 0;
    for (const u of users) {
      const ls = await sql`
        select id, asset_type, request_id, task_id, expires_at, created_at
        from generation_lock
        where user_id = ${u.id}
      `;
      if (ls.length > 0) {
        locks += ls.length;
        console.log(`- ${u.email} (${u.id}) has ${ls.length} lock(s):`);
        for (const l of ls) {
          console.log(`   • ${l.asset_type} lock id=${l.id} created=${fmt(l.created_at)} expires=${fmt(l.expires_at)}`);
        }
      }
    }
    console.log(`Total locks across these users: ${locks}`);
  } catch (e) {
    console.error('Error:', e);
  }
}

main();

