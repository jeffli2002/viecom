/**
 * Sync ALL subscriptions with Creem to fix inverted status issue
 * Run this to update your database to match Creem's reality
 */

import { creemService } from '@/lib/creem/creem-service';
import { normalizeCreemStatus } from '@/lib/creem/status-utils';
import { db } from '@/server/db';
import { payment } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

async function syncAllSubscriptions() {
  console.log('🔄 Starting subscription sync with Creem...\n');

  // Get all subscriptions from database
  const allPayments = await db.select().from(payment).where(eq(payment.provider, 'creem'));

  console.log(`Found ${allPayments.length} Creem subscriptions in database\n`);

  let syncCount = 0;
  let errorCount = 0;
  const changes: Array<{
    subscriptionId: string;
    dbStatus: string;
    creemStatus: string;
    action: string;
  }> = [];

  for (const sub of allPayments) {
    if (!sub.subscriptionId) {
      console.log(`⚠️  Skipping ${sub.id} - no subscription_id`);
      continue;
    }

    try {
      console.log(`Checking ${sub.subscriptionId}...`);

      // Fetch from Creem
      const result = await creemService.getSubscription(sub.subscriptionId);

      if (!result.success || !result.subscription) {
        console.log(`  ❌ Not found in Creem or error: ${result.error}`);
        errorCount++;
        continue;
      }

      const creemStatus = result.subscription.status || 'active';
      const normalizedCreemStatus = normalizeCreemStatus(creemStatus);
      const dbStatus = sub.status;

      console.log(
        `  DB: ${dbStatus} | Creem: ${creemStatus} (normalized: ${normalizedCreemStatus})`
      );

      // Check if they match
      if (dbStatus !== normalizedCreemStatus) {
        console.log(`  🔧 MISMATCH DETECTED - Updating ${sub.subscriptionId}`);
        console.log(`     ${dbStatus} → ${normalizedCreemStatus}`);

        // Update database to match Creem
        await db
          .update(payment)
          .set({
            status: normalizedCreemStatus,
            updatedAt: new Date(),
          })
          .where(eq(payment.id, sub.id));

        changes.push({
          subscriptionId: sub.subscriptionId,
          dbStatus,
          creemStatus: normalizedCreemStatus,
          action: 'updated',
        });

        syncCount++;
        console.log('  ✅ Updated successfully\n');
      } else {
        console.log('  ✓ Already in sync\n');
      }
    } catch (error) {
      console.error(`  ❌ Error syncing ${sub.subscriptionId}:`, error);
      errorCount++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 SYNC SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total subscriptions: ${allPayments.length}`);
  console.log(`✅ Synced: ${syncCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`✓ Already in sync: ${allPayments.length - syncCount - errorCount}`);

  if (changes.length > 0) {
    console.log('\n📝 CHANGES MADE:');
    console.table(changes);
  }

  console.log('\n✅ Sync complete!');
}

// Run the sync
syncAllSubscriptions()
  .then(() => {
    console.log('\nDone! You can now test upgrades.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
