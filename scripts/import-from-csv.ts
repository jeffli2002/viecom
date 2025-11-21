/**
 * Import Creem subscriptions from CSV file
 *
 * CSV Format (no spaces, one subscription per line):
 * subscriptionId,customerId,priceId,status,interval,periodStart,periodEnd
 *
 * Example:
 * sub_abc123,cus_xyz789,pro,active,month,2025-11-19,2025-12-19
 * sub_def456,cus_xyz789,proplus,active,month,2025-11-18,2025-12-18
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: resolve(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = postgres(DATABASE_URL);

async function main() {
  console.log('📥 Import Creem Subscriptions from CSV\n');

  // Get jefflee's user ID
  const users = await sql`
    SELECT id, email FROM "user" 
    WHERE email LIKE '%jefflee%' OR email = 'jefflee2002@gmail.com'
    LIMIT 1
  `;

  if (users.length === 0) {
    console.error('❌ Could not find user jefflee2002@gmail.com');
    process.exit(1);
  }

  const jeffleeUserId = users[0].id;
  console.log(`✅ Found user: ${users[0].email}`);
  console.log(`   User ID: ${jeffleeUserId}\n`);

  // Check for CSV file
  const csvPath = resolve(process.cwd(), 'creem-subscriptions.csv');

  if (!existsSync(csvPath)) {
    console.log('📝 Please create a file: creem-subscriptions.csv\n');
    console.log('Format (comma-separated, no spaces):');
    console.log('subscriptionId,customerId,priceId,status,interval,periodStart,periodEnd\n');
    console.log('Example:');
    console.log('sub_abc123,cus_xyz789,pro,active,month,2025-11-19,2025-12-19');
    console.log('sub_def456,cus_xyz789,proplus,active,month,2025-11-18,2025-12-18\n');
    console.log('Then run this script again.');
    await sql.end();
    return;
  }

  // Read and parse CSV
  const csvContent = readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter((line) => line.trim() && !line.startsWith('#'));

  // Skip header if exists
  const dataLines = lines[0]?.includes('subscriptionId') ? lines.slice(1) : lines;

  console.log(`📄 Found ${dataLines.length} subscriptions in CSV\n`);
  console.log('='.repeat(60));

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const line of dataLines) {
    const [subscriptionId, customerId, priceId, status, interval, periodStart, periodEnd] = line
      .split(',')
      .map((s) => s.trim());

    if (!subscriptionId || !customerId) {
      console.log(`⚠️  Skipping invalid line: ${line}`);
      errors++;
      continue;
    }

    try {
      console.log(`\nProcessing: ${subscriptionId} (${priceId}, ${status})`);

      // Check if exists
      const existing = await sql`
        SELECT id, status FROM payment 
        WHERE subscription_id = ${subscriptionId}
      `;

      if (existing.length > 0) {
        // Update if status changed
        if (existing[0].status !== status) {
          await sql`
            UPDATE payment 
            SET 
              status = ${status},
              price_id = ${priceId},
              interval = ${interval || 'month'},
              period_start = ${periodStart ? new Date(periodStart) : null},
              period_end = ${periodEnd ? new Date(periodEnd) : null},
              updated_at = NOW()
            WHERE subscription_id = ${subscriptionId}
          `;
          console.log(`  ✅ Updated: ${existing[0].status} → ${status}`);
          updated++;
        } else {
          console.log(`  ⏭️  Already exists (no change needed)`);
          skipped++;
        }
      } else {
        // Insert new
        await sql`
          INSERT INTO payment (
            id,
            provider,
            price_id,
            type,
            interval,
            user_id,
            customer_id,
            subscription_id,
            status,
            period_start,
            period_end,
            cancel_at_period_end,
            created_at,
            updated_at
          ) VALUES (
            ${subscriptionId},
            'creem',
            ${priceId},
            'subscription',
            ${interval || 'month'},
            ${jeffleeUserId},
            ${customerId},
            ${subscriptionId},
            ${status},
            ${periodStart ? new Date(periodStart) : null},
            ${periodEnd ? new Date(periodEnd) : null},
            false,
            NOW(),
            NOW()
          )
        `;
        console.log(`  ✅ Imported successfully`);
        imported++;
      }
    } catch (error) {
      console.error(`  ❌ Error:`, error);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total in CSV: ${dataLines.length}`);
  console.log(`✅ Imported: ${imported}`);
  console.log(`🔄 Updated: ${updated}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);

  // Show current status
  const dbSubs = await sql`
    SELECT status, COUNT(*) as count
    FROM payment
    WHERE user_id = ${jeffleeUserId} AND provider = 'creem'
    GROUP BY status
    ORDER BY count DESC
  `;

  console.log('\n📊 Current database status:');
  console.table(dbSubs);

  await sql.end();
  console.log('\n✅ Done!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
