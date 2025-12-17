import { resolve } from 'node:path';
import { config } from 'dotenv';
import { Pool } from 'pg';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Please check your .env.local file.');
  process.exit(1);
}

async function syncMigrationStatus() {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
  });

  try {
    console.log('🔄 Syncing migration status...\n');

    // Create __drizzle_migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      );
    `);
    console.log('✅ Created __drizzle_migrations table\n');

    // Get migration hashes from journal
    const fs = await import('node:fs');
    const journal = JSON.parse(fs.readFileSync('./drizzle/meta/_journal.json', 'utf-8'));

    console.log('📋 Migration files in journal:');
    const migrations = (journal.entries as Array<{ tag?: string }>) || [];
    migrations.forEach((entry, index: number) => {
      const tag = entry.tag || `migration_${index}`;
      console.log(`   ${index + 1}. ${tag}`);
    });

    // Check which tables exist to determine which migrations have been applied
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const existingTables = tableCheck.rows.map((r) => r.table_name);
    console.log(`\n📊 Found ${existingTables.length} existing tables in database`);

    // Mark migrations as applied based on table existence
    // Migration 0000 creates: account, session, user, verification, etc.
    const hasAccountTable = existingTables.includes('account');
    const hasUserTable = existingTables.includes('user');

    // Migration 0001 creates reward tables
    const hasRewardTables =
      existingTables.includes('user_daily_checkin') || existingTables.includes('user_referral');

    // Migration 0002 - check for any new tables
    // Migration 0003 adds scheduled columns to payment table
    const paymentColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payment' 
      AND column_name LIKE 'scheduled_%';
    `);
    const hasScheduledColumns = paymentColumns.rows.length > 0;

    // Migration 0004 adds 'purchase' to source enum
    const sourceEnum = await pool.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'credit_transactions_source'
      );
    `);
    const hasPurchaseSource = sourceEnum.rows.some((r) => r.enumlabel === 'purchase');

    console.log('\n🔍 Migration status:');
    console.log(
      `   Migration 0000 (account/user tables): ${hasAccountTable && hasUserTable ? '✅ Applied' : '❌ Not applied'}`
    );
    console.log(
      `   Migration 0001 (reward tables): ${hasRewardTables ? '✅ Applied' : '❌ Not applied'}`
    );
    console.log(
      `   Migration 0003 (scheduled columns): ${hasScheduledColumns ? '✅ Applied' : '❌ Not applied'}`
    );
    console.log(
      `   Migration 0004 (purchase source): ${hasPurchaseSource ? '✅ Applied' : '❌ Not applied'}`
    );

    // Get migration file hashes by reading the SQL files
    const { createHash } = await import('node:crypto');

    const entries = migrations.filter((entry) => typeof entry.tag === 'string');
    let inserted = 0;

    for (const entry of entries) {
      const tag = entry.tag as string;
      const candidatePaths = [`./drizzle/${tag}.sql`, `./drizzle/archive/${tag}.sql`];
      const filePath = candidatePaths.find((p) => fs.existsSync(p));
      try {
        if (!filePath) {
          console.warn(`   ⚠️  Missing migration file for ${tag} (checked drizzle/ and drizzle/archive/), skipping`);
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const hash = createHash('sha256').update(content).digest('hex').substring(0, 16);

        const existing = await pool.query('SELECT id FROM __drizzle_migrations WHERE hash = $1', [
          hash,
        ]);

        if (existing.rows.length > 0) {
          continue;
        }

        await pool.query('INSERT INTO __drizzle_migrations (hash, created_at) VALUES ($1, $2)', [
          hash,
          Date.now(),
        ]);
        console.log(`   ✅ Marked ${tag} as applied`);
        inserted++;
      } catch (error) {
        console.warn(
          `   ⚠️  Could not process ${tag}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    console.log(`\n✅ Synced ${inserted} migration(s) to status table`);
    console.log('\n💡 You can now run: pnpm db:migrate');

    await pool.end();
  } catch (error) {
    console.error('❌ Error syncing migration status:', error);
    await pool.end();
    process.exit(1);
  }
}

syncMigrationStatus();
