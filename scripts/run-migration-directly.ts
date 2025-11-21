/**
 * Direct database migration script
 * Runs the migration SQL directly without using Drizzle migrator
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Please check your .env.local file.');
  process.exit(1);
}

async function runMigration() {
  console.log('🔄 Starting database migration...');
  console.log(`📊 Database URL: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);

  try {
    const sql = neon(databaseUrl);

    // Execute each ALTER TABLE statement directly
    const statements = [
      'ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "scheduled_plan_id" text;',
      'ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "scheduled_interval" text;',
      'ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "scheduled_period_start" timestamp;',
      'ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "scheduled_period_end" timestamp;',
      'ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "scheduled_at" timestamp;',
    ];

    console.log(`📝 Found ${statements.length} migration statements`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);
      console.log(`SQL: ${statement}`);

      try {
        // Use unsafe for raw SQL
        await sql.unsafe(statement);
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error: unknown) {
        // Check if column already exists
        const err = error as { message?: string; code?: string };
        if (
          err?.message?.includes('already exists') ||
          err?.code === '42701' ||
          err?.code === '42P07' ||
          err?.message?.includes('duplicate column')
        ) {
          console.log(`⚠️  Statement ${i + 1} skipped (column already exists)`);
        } else {
          console.error(`❌ Statement ${i + 1} failed:`, error.message);
          throw error;
        }
      }
    }

    console.log('\n✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
