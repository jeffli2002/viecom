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

async function addColumnsFinal() {
  try {
    console.log('🔄 Adding scheduled columns (final attempt)...\n');

    const columns = [
      'scheduled_plan_id text',
      'scheduled_interval text',
      'scheduled_period_start timestamp',
      'scheduled_period_end timestamp',
      'scheduled_at timestamp',
    ];

    // Try adding all columns in a single ALTER TABLE statement
    console.log('Adding all columns in one statement...');
    const alterSQL = `ALTER TABLE public.payment 
      ADD COLUMN IF NOT EXISTS scheduled_plan_id text,
      ADD COLUMN IF NOT EXISTS scheduled_interval text,
      ADD COLUMN IF NOT EXISTS scheduled_period_start timestamp,
      ADD COLUMN IF NOT EXISTS scheduled_period_end timestamp,
      ADD COLUMN IF NOT EXISTS scheduled_at timestamp;`;

    try {
      await sql.unsafe(alterSQL);
      console.log('✅ ALTER TABLE executed');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ ALTER TABLE failed:', message);
      // Try one by one
      console.log('\nTrying one by one...');
      for (const col of columns) {
        try {
          await sql.unsafe(`ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS ${col};`);
          console.log(`✅ Added ${col.split(' ')[0]}`);
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : String(e);
          console.error(`❌ Failed ${col.split(' ')[0]}:`, message);
        }
      }
    }

    // Wait a moment
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test query
    console.log('\nTesting query...');
    try {
      const test = await sql`
        SELECT 
          id,
          price_id,
          scheduled_plan_id,
          scheduled_interval
        FROM public.payment
        LIMIT 1;
      `;
      console.log('✅ Query successful! Columns exist.');
      console.table(test);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Query still fails:', message);
      console.error('This means columns were not created.');

      // Last resort: check if we're using the right database
      console.log('\nChecking database connection...');
      const dbInfo = await sql`SELECT current_database(), current_schema();`;
      console.table(dbInfo);
    }
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

addColumnsFinal();
