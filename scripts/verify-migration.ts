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

const sql = neon(databaseUrl);

async function verifyMigration() {
  try {
    console.log('🔍 Verifying migration...\n');

    // Check if columns exist
    const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'payment' 
        AND column_name IN (
          'scheduled_plan_id',
          'scheduled_interval',
          'scheduled_period_start',
          'scheduled_period_end',
          'scheduled_at'
        )
      ORDER BY column_name;
    `;

    console.log('Found columns:');
    console.table(result);

    if (result.length === 5) {
      console.log('\n✅ All scheduled columns exist!');
    } else {
      console.log(`\n⚠️  Expected 5 columns, found ${result.length}`);
      console.log(
        'Missing columns:',
        [
          'scheduled_plan_id',
          'scheduled_interval',
          'scheduled_period_start',
          'scheduled_period_end',
          'scheduled_at',
        ].filter((col) => !result.some((r: any) => r.column_name === col))
      );
    }
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyMigration();
