import { resolve } from 'node:path';
import { config } from 'dotenv';
import pg from 'pg';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Please check your .env.local file.');
  process.exit(1);
}

async function addColumnsUsingPg() {
  const client = new pg.Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const columns = [
      { name: 'scheduled_plan_id', type: 'text' },
      { name: 'scheduled_interval', type: 'text' },
      { name: 'scheduled_period_start', type: 'timestamp' },
      { name: 'scheduled_period_end', type: 'timestamp' },
      { name: 'scheduled_at', type: 'timestamp' },
    ];

    console.log('Adding columns...\n');

    for (const col of columns) {
      try {
        const query = `ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`;
        await client.query(query);
        console.log(`✅ Added column: ${col.name}`);
      } catch (error: unknown) {
        const err = error as { message?: string; code?: string };
        if (err?.message?.includes('already exists') || err?.code === '42701') {
          console.log(`⏭️  Column ${col.name} already exists`);
        } else {
          console.error(`❌ Failed to add ${col.name}:`, error.message);
          throw error;
        }
      }
    }

    // Verify columns exist
    console.log('\n🔍 Verifying columns...');
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'payment'
        AND column_name LIKE 'scheduled%'
      ORDER BY column_name;
    `;
    const verifyResult = await client.query(verifyQuery);

    console.log(`Found ${verifyResult.rows.length} scheduled columns:`);
    console.table(verifyResult.rows);

    if (verifyResult.rows.length === 5) {
      // Test query
      console.log('\n🧪 Testing query with scheduled columns...');
      const testQuery = `
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
      const testResult = await client.query(testQuery);
      console.log('✅ Query test successful!');
      if (testResult.rows.length > 0) {
        console.log('Sample result:', testResult.rows[0]);
      }
      console.log('\n✅ All columns added and verified successfully!');
      return true;
    }
    console.log(`\n⚠️  Expected 5 columns, found ${verifyResult.rows.length}`);
    return false;
  } catch (error) {
    console.error('❌ Failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    return false;
  } finally {
    await client.end();
  }
}

addColumnsUsingPg()
  .then((success) => {
    if (success) {
      console.log('\n✅ Migration completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Migration failed');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
