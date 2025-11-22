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

async function applyMigration0004() {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
  });

  try {
    console.log('🔄 Applying migration 0004_credit_pack_purchase_source...\n');

    // Read the migration SQL
    const { readFileSync } = await import('node:fs');
    const migrationSQL = readFileSync('./drizzle/0004_credit_pack_purchase_source.sql', 'utf-8');

    // Execute the migration
    await pool.query(migrationSQL);
    console.log('✅ Migration 0004 executed successfully\n');

    // Mark migration as applied in __drizzle_migrations
    const { createHash } = await import('node:crypto');
    const hash = createHash('sha256').update(migrationSQL).digest('hex').substring(0, 16);
    
    const existing = await pool.query('SELECT id FROM __drizzle_migrations WHERE hash = $1', [hash]);
    if (existing.rows.length === 0) {
      await pool.query(
        'INSERT INTO __drizzle_migrations (hash, created_at) VALUES ($1, $2)',
        [hash, Date.now()]
      );
      console.log('✅ Migration 0004 marked as applied in __drizzle_migrations');
    } else {
      console.log('ℹ️  Migration 0004 already marked as applied');
    }

    // Verify the enum value exists
    const enumCheck = await pool.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'credit_transactions_source_enum'
      )
      AND enumlabel = 'purchase';
    `);

    if (enumCheck.rows.length > 0) {
      console.log('✅ Verified: "purchase" enum value exists in credit_transactions_source_enum');
    } else {
      console.log('⚠️  Warning: "purchase" enum value not found');
    }

    console.log('\n✅ Migration 0004 completed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
    await pool.end();
    process.exit(1);
  }
}

applyMigration0004();

