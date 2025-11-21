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

async function testColumns() {
  try {
    console.log('🔍 Testing scheduled columns...\n');

    // Try to directly query the columns
    console.log('1. Testing direct query with scheduled_plan_id...');
    try {
      const result = await sql`
        SELECT 
          id, 
          price_id, 
          scheduled_plan_id,
          scheduled_interval,
          scheduled_period_start
        FROM payment 
        LIMIT 1;
      `;
      console.log('✅ Query successful! Columns exist.');
      console.table(result);
    } catch (error: any) {
      console.error('❌ Query failed:', error.message);
      console.error('Error code:', error.code);

      if (error.message.includes('scheduled_plan_id')) {
        console.log('\n⚠️  Column does not exist. Trying to add it...');

        // Try adding with explicit schema
        try {
          await sql.unsafe(
            'ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS scheduled_plan_id text;'
          );
          await sql.unsafe(
            'ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS scheduled_interval text;'
          );
          await sql.unsafe(
            'ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS scheduled_period_start timestamp;'
          );
          await sql.unsafe(
            'ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS scheduled_period_end timestamp;'
          );
          await sql.unsafe(
            'ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS scheduled_at timestamp;'
          );

          console.log('✅ Columns added. Testing again...');
          const test2 = await sql`
            SELECT id, scheduled_plan_id FROM payment LIMIT 1;
          `;
          console.log('✅ Second test successful!');
          console.table(test2);
        } catch (addError: any) {
          console.error('❌ Failed to add columns:', addError.message);
        }
      }
    }

    // Check table schema
    console.log('\n2. Checking table schema...');
    const schema = await sql`
      SELECT 
        table_schema,
        table_name,
        column_name,
        data_type
      FROM information_schema.columns 
      WHERE table_name = 'payment'
        AND (column_name LIKE 'scheduled%' OR column_name = 'id')
      ORDER BY column_name;
    `;
    console.table(schema);
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

testColumns();
