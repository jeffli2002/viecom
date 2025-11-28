import { readFileSync } from 'node:fs';
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

async function applyMissingMigrations() {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
  });

  try {
    console.log('🔄 Checking for missing tables...\n');

    // Check if credit_pack_purchase exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'credit_pack_purchase';
    `);

    if (tableCheck.rows.length > 0) {
      console.log('✅ credit_pack_purchase table already exists');
      await pool.end();
      return;
    }

    console.log('📋 Applying migration 0007 to create credit_pack_purchase table...\n');

    // Read and execute migration file
    const migrationSql = readFileSync('./drizzle/0007_numerous_silver_centurion.sql', 'utf-8');

    await pool.query(migrationSql);

    console.log('✅ Successfully created credit_pack_purchase table\n');

    await pool.end();
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    await pool.end();
    process.exit(1);
  }
}

applyMissingMigrations();
