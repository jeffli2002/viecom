/**
 * Database migration script
 * Loads environment variables and runs Drizzle migrations
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

// Import after loading env vars
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { env } from '../src/env';

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



