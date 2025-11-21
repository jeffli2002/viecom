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

async function addColumns() {
  try {
    console.log('🔄 Adding scheduled columns to payment table...\n');

    // Check current columns first
    console.log('1. Checking current columns...');
    const currentColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payment' 
        AND column_name LIKE 'scheduled%'
      ORDER BY column_name;
    `;
    console.log(
      'Existing scheduled columns:',
      currentColumns.map((c: { column_name: string }) => c.column_name)
    );

    // Add columns one by one
    const columns = [
      { name: 'scheduled_plan_id', type: 'text' },
      { name: 'scheduled_interval', type: 'text' },
      { name: 'scheduled_period_start', type: 'timestamp' },
      { name: 'scheduled_period_end', type: 'timestamp' },
      { name: 'scheduled_at', type: 'timestamp' },
    ];

    for (const col of columns) {
      const exists = currentColumns.some(
        (c: { column_name: string }) => c.column_name === col.name
      );
      if (exists) {
        console.log(`⚠️  Column ${col.name} already exists, skipping...`);
        continue;
      }

      console.log(`\n2. Adding column ${col.name}...`);
      try {
        // Use raw SQL with proper escaping
        const alterSQL = `ALTER TABLE payment ADD COLUMN ${col.name} ${col.type};`;
        console.log(`Executing: ${alterSQL}`);
        await sql.unsafe(alterSQL);
        console.log(`✅ Column ${col.name} added successfully`);

        // Verify immediately
        const verify = await sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'payment' 
            AND column_name = ${col.name};
        `;
        if (verify.length > 0) {
          console.log(`✅ Verified: Column ${col.name} exists`);
        } else {
          console.log(`⚠️  Warning: Column ${col.name} not found after creation`);
        }
      } catch (error: unknown) {
        const err = error as { message?: string; code?: string };
        if (
          err?.message?.includes('already exists') ||
          err?.code === '42701' ||
          err?.code === '42P07'
        ) {
          console.log(`⚠️  Column ${col.name} already exists`);
        } else {
          console.error(`❌ Failed to add column ${col.name}:`, err.message);
          console.error(`Error code: ${err?.code}`);
          console.error('Error details:', error);
          throw error;
        }
      }
    }

    // Verify all columns exist
    console.log('\n3. Verifying columns...');
    const finalColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'payment' 
        AND column_name LIKE 'scheduled%'
      ORDER BY column_name;
    `;
    console.table(finalColumns);

    if (finalColumns.length === 5) {
      console.log('\n✅ All scheduled columns added successfully!');
    } else {
      console.log(`\n⚠️  Expected 5 columns, found ${finalColumns.length}`);
    }
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

addColumns();
