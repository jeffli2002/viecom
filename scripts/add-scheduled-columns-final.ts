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

async function addScheduledColumnsFinal() {
  try {
    console.log('🔄 Adding scheduled columns to payment table (Final Attempt)...\n');

    // First, check if columns already exist
    console.log('1. Checking existing columns...');
    const existingColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'payment'
        AND column_name LIKE 'scheduled%'
      ORDER BY column_name;
    `;

    const existingColumnNames = existingColumns.map((c: { column_name: string }) => c.column_name);
    console.log(
      `Found existing scheduled columns: ${existingColumnNames.length > 0 ? existingColumnNames.join(', ') : 'None'}`
    );

    const columnsToAdd = [
      { name: 'scheduled_plan_id', type: 'text', nullable: true },
      { name: 'scheduled_interval', type: 'text', nullable: true },
      { name: 'scheduled_period_start', type: 'timestamp', nullable: true },
      { name: 'scheduled_period_end', type: 'timestamp', nullable: true },
      { name: 'scheduled_at', type: 'timestamp', nullable: true },
    ];

    console.log('\n2. Adding missing columns...\n');

    for (const col of columnsToAdd) {
      if (existingColumnNames.includes(col.name)) {
        console.log(`⏭️  Column ${col.name} already exists, skipping...`);
        continue;
      }

      try {
        // Use parameterized query with explicit column definition
        const alterSQL = `ALTER TABLE public.payment ADD COLUMN ${col.name} ${col.type}${col.nullable ? '' : ' NOT NULL'};`;
        console.log(`   Executing: ${alterSQL}`);

        await sql.unsafe(alterSQL);
        console.log(`   ✅ Column ${col.name} added successfully`);

        // Verify immediately
        await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay

        const verify = await sql`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
            AND table_name = 'payment'
            AND column_name = ${col.name};
        `;

        if (verify.length > 0) {
          console.log(
            `   ✅ Verified: Column ${col.name} exists (type: ${verify[0].data_type}, nullable: ${verify[0].is_nullable})`
          );
        } else {
          console.log(`   ⚠️  Warning: Column ${col.name} not found after creation`);
        }
      } catch (error: unknown) {
        const err = error as { message?: string; code?: string };
        if (
          err?.message?.includes('already exists') ||
          err?.code === '42701' ||
          err?.code === '42P07'
        ) {
          console.log(`   ⚠️  Column ${col.name} already exists (skipped)`);
        } else {
          console.error(`   ❌ Failed to add column ${col.name}:`, error.message);
          console.error(`   Error code: ${error?.code}`);
          throw error;
        }
      }
    }

    // Final verification
    console.log('\n3. Final verification...');
    const finalColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'payment'
        AND column_name LIKE 'scheduled%'
      ORDER BY column_name;
    `;

    console.log(`\n✅ Found ${finalColumns.length} scheduled columns:`);
    console.table(finalColumns);

    if (finalColumns.length === 5) {
      console.log('\n✅ All scheduled columns have been added successfully!');

      // Test query to ensure columns can be selected
      console.log('\n4. Testing query with scheduled columns...');
      try {
        const testQuery = await sql`
          SELECT 
            id,
            price_id,
            scheduled_plan_id,
            scheduled_interval,
            scheduled_period_start
          FROM payment
          WHERE type = 'subscription'
          LIMIT 1;
        `;
        console.log('✅ Query test successful! Columns are accessible.');
        if (testQuery.length > 0) {
          console.log('Sample result:', testQuery[0]);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('❌ Query test failed:', message);
        console.error('This means the columns may not be accessible yet.');
      }
    } else {
      console.log(`\n⚠️  Expected 5 columns, found ${finalColumns.length}`);
      const missing = columnsToAdd
        .map((c) => c.name)
        .filter(
          (name) => !finalColumns.some((fc: { column_name: string }) => fc.column_name === name)
        );
      if (missing.length > 0) {
        console.log('Missing columns:', missing);
      }
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

addScheduledColumnsFinal();
