import { db } from '@/server/db';
import { sql } from 'drizzle-orm';

async function verifyScheduledColumns() {
  console.log('Checking if scheduled columns exist in payment table...\n');

  try {
    // Check if columns exist
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'payment'
      AND column_name IN ('scheduled_plan_id', 'scheduled_interval', 'scheduled_period_start', 'scheduled_period_end', 'scheduled_at')
      ORDER BY column_name;
    `);

    console.log('Scheduled columns in payment table:');
    console.table(result.rows);

    if (result.rows.length === 0) {
      console.log('\n❌ ERROR: Scheduled columns do not exist!');
      console.log('\n🔧 Run this command to create them:');
      console.log('   pnpm db:migrate\n');
      return false;
    }
    if (result.rows.length < 5) {
      console.log(`\n⚠️  WARNING: Only ${result.rows.length} out of 5 scheduled columns exist!`);
      console.log(
        'Expected columns: scheduled_plan_id, scheduled_interval, scheduled_period_start, scheduled_period_end, scheduled_at'
      );
      return false;
    }
    console.log('\n✅ All scheduled columns exist!');

    // Check if any subscriptions have scheduled upgrades
    const scheduledCount = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM payment
        WHERE scheduled_plan_id IS NOT NULL;
      `);

    console.log(
      `\n📊 Subscriptions with scheduled upgrades: ${scheduledCount.rows[0]?.count || 0}`
    );

    // Show sample of scheduled upgrades
    const samples = await db.execute(sql`
        SELECT 
          id,
          user_id,
          price_id as current_plan,
          scheduled_plan_id,
          scheduled_interval,
          scheduled_period_start,
          status
        FROM payment
        WHERE scheduled_plan_id IS NOT NULL
        LIMIT 5;
      `);

    if (samples.rows.length > 0) {
      console.log('\n📋 Sample scheduled upgrades:');
      console.table(samples.rows);
    }

    return true;
  } catch (error) {
    console.error('❌ Error checking columns:', error);
    return false;
  }
}

verifyScheduledColumns()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
