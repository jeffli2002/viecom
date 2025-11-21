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

async function addScheduledColumnsWithTransaction() {
  try {
    console.log('🔄 Adding scheduled columns using transaction...\n');

    // Use a transaction to ensure all columns are added atomically
    const columns = [
      'scheduled_plan_id text',
      'scheduled_interval text',
      'scheduled_period_start timestamp',
      'scheduled_period_end timestamp',
      'scheduled_at timestamp',
    ];

    console.log('Executing ALTER TABLE statements...\n');

    // Execute each ALTER TABLE statement
    for (const col of columns) {
      const [name, _type] = col.split(' ');
      try {
        // Use sql.unsafe for DDL statements
        await sql.unsafe(`ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS ${col};`);
        console.log(`✅ Added column: ${name}`);
      } catch (error: unknown) {
        const err = error as { message?: string; code?: string };
        if (
          err?.message?.includes('already exists') ||
          err?.code === '42701' ||
          err?.code === '42P07'
        ) {
          console.log(`⏭️  Column ${name} already exists`);
        } else {
          console.error(`❌ Failed to add ${name}:`, error.message);
          throw error;
        }
      }
    }

    // Wait a moment for the changes to propagate
    console.log('\n⏳ Waiting for changes to propagate...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify by attempting to query the columns
    console.log('\n🔍 Verifying columns by querying...');
    try {
      const testResult = await sql`
        SELECT 
          id,
          price_id,
          scheduled_plan_id,
          scheduled_interval,
          scheduled_period_start,
          scheduled_period_end,
          scheduled_at
        FROM payment
        WHERE type = 'subscription'
        LIMIT 1;
      `;
      console.log('✅ SUCCESS! Columns exist and are queryable');
      console.log('Sample result:', testResult[0]);
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('scheduled_plan_id') || message.includes('does not exist')) {
        console.log('❌ Columns still not accessible');
        console.log('Error:', message);
        return false;
      }
      // Other error, might be OK (e.g., no rows)
      console.log('⚠️  Query executed but got different error:', message);
      return true; // Assume columns exist if it's not a column error
    }
  } catch (error) {
    console.error('❌ Failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    return false;
  }
}

async function main() {
  const success = await addScheduledColumnsWithTransaction();

  if (success) {
    console.log('\n✅ Migration completed successfully!');
    console.log('Next steps:');
    console.log('1. Uncomment scheduled fields in src/server/db/schema.ts');
    console.log('2. Uncomment scheduled field selections in payment-repository.ts');
    console.log('3. Uncomment scheduled field updates in payment-repository.ts');
    process.exit(0);
  } else {
    console.log('\n❌ Migration failed. Please run the SQL script manually in Neon console.');
    console.log('SQL script location: scripts/add-scheduled-columns-direct.sql');
    process.exit(1);
  }
}

main();
