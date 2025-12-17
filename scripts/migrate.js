/**
 * Database migration script (JS runtime)
 * Loads environment variables and runs Drizzle migrations
 */

import { resolve } from 'node:path';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

// Load .env.local - we can't rely on src/env here because migrations must run before build
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required. Please check your .env.local file.');
  process.exit(1);
}

async function runMigrations() {
  console.log('🔄 Starting database migration...');
  console.log(`📊 Database URL: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
  });
  const db = drizzle(pool);

  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
