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

async function checkTable() {
  try {
    console.log('🔍 Checking payment table structure...\n');

    // Check all columns in payment table
    const allColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'payment'
      ORDER BY ordinal_position;
    `;

    console.log('All columns in payment table:');
    console.table(allColumns);

    // Check specifically for scheduled columns
    const scheduledColumns = allColumns.filter((c: { column_name: string }) =>
      c.column_name.startsWith('scheduled')
    );

    console.log('\nScheduled columns:');
    if (scheduledColumns.length > 0) {
      console.table(scheduledColumns);
    } else {
      console.log('❌ No scheduled columns found');
    }

    // Try to query a payment record to see what happens
    console.log('\nTesting query on payment table...');
    try {
      const testQuery = await sql`
        SELECT id, price_id, scheduled_plan_id 
        FROM payment 
        LIMIT 1;
      `;
      console.log('✅ Query successful! Columns exist.');
      console.table(testQuery);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Query failed:', message);
      if (message.includes('scheduled_plan_id')) {
        console.log('\n⚠️  The column scheduled_plan_id does not exist in the database.');
        console.log('This means the ALTER TABLE statements may not have executed correctly.');
      }
    }
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

checkTable();
