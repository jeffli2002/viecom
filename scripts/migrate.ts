/**
 * Database migration script
 * Loads environment variables and runs Drizzle migrations
 * Uses pg (node-postgres) driver for transaction support
 */

import { resolve } from 'node:path';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { env } from '../src/env';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

async function runMigrations() {
  console.log('🔄 Starting database migration...');
  console.log(`📊 Database URL: ${env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);

  // Use pg (node-postgres) Pool for transaction support (required for migrations)
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 1, // Use single connection for migrations
  });
  const db = drizzle(pool);

  try {
    // Run migrations from drizzle directory
    await migrate(db, { migrationsFolder: './drizzle' });

    console.log('✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
