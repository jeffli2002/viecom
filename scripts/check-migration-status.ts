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

async function checkMigrationStatus() {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
  });

  try {
    console.log('🔍 Checking migration status...\n');

    // Check if _drizzle_migrations table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '_drizzle_migrations'
      );
    `);

    if (!tableCheck.rows[0]?.exists) {
      console.log('⚠️  _drizzle_migrations table does not exist');
      console.log('   This means no migrations have been tracked yet.\n');
    } else {
      // Get applied migrations
      const migrations = await pool.query(`
        SELECT id, hash, created_at 
        FROM _drizzle_migrations 
        ORDER BY created_at;
      `);

      console.log(`✅ Found ${migrations.rows.length} applied migrations:`);
      console.table(migrations.rows);
    }

    // List all migration files
    const { readdirSync } = await import('node:fs');
    const migrationFiles = readdirSync('./drizzle')
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`\n📁 Found ${migrationFiles.length} migration files:`);
    migrationFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });

    await pool.end();
  } catch (error) {
    console.error('❌ Error checking migration status:', error);
    await pool.end();
    process.exit(1);
  }
}

checkMigrationStatus();
