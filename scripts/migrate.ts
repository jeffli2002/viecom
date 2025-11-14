/**
 * Database migration script
 * Loads environment variables and runs Drizzle migrations
 */

import { resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { env } from '../src/env';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

async function runMigrations() {
  console.log('🔄 Starting database migration...');
  console.log(`📊 Database URL: ${env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);

  try {
    const sql = neon(env.DATABASE_URL);
    const db = drizzle(sql);

    // Run migrations from drizzle directory
    await migrate(db, { migrationsFolder: './drizzle' });

    console.log('✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
