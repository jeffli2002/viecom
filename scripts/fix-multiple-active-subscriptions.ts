/**
 * Fix Multiple Active Subscriptions Issue
 *
 * This script:
 * 1. Syncs all subscriptions with Creem to fix status mismatches
 * 2. Ensures only ONE active subscription per user
 * 3. Cancels duplicate/stale subscriptions
 * 4. Reports all changes made
 *
 * Run with: pnpm tsx scripts/fix-multiple-active-subscriptions.ts
 */

import { existsSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local or .env file
const envLocal = resolve(process.cwd(), '.env.local');
const envDefault = resolve(process.cwd(), '.env');
const envPath = existsSync(envLocal) ? envLocal : envDefault;

console.log(`Loading environment from: ${envPath}`);
config({ path: envPath });

import { creemService } from '@/lib/creem/creem-service';
import { normalizeCreemStatus } from '@/lib/creem/status-utils';
import { db } from '@/server/db';
import { payment } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

interface SubscriptionFix {
  userId: string;
  subscriptionId: string;
  action: 'synced' | 'canceled_duplicate' | 'error' | 'no_change';
  oldStatus: string;
  newStatus: string;
  details?: string;
}

async function fixMultipleActiveSubscriptions() {
  console.log('🔧 Starting subscription cleanup and sync...\n');

  const fixes: SubscriptionFix[] = [];

  // Step 1: Get all Creem subscriptions grouped by user
  const allPayments = await db.select().from(payment).where(eq(payment.provider, 'creem'));

  console.log(`Found ${allPayments.length} total Creem subscriptions\n`);

  // Group by userId
  const userSubscriptions = new Map<string, typeof allPayments>();
  for (const sub of allPayments) {
    const userId = sub.userId;
    if (!userSubscriptions.has(userId)) {
      userSubscriptions.set(userId, []);
    }
    userSubscriptions.get(userId)?.push(sub);
  }

  console.log(`Found ${userSubscriptions.size} unique users with subscriptions\n`);

  // Step 2: Process each user's subscriptions
  for (const [userId, subs] of userSubscriptions.entries()) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Processing user: ${userId}`);
    console.log(`Total subscriptions: ${subs.length}`);
    console.log(`${'='.repeat(60)}\n`);

    // Step 2a: Sync all subscriptions with Creem to get true status
    const syncedSubs: Array<{ payment: (typeof subs)[0]; creemStatus: string | null }> = [];

    for (const sub of subs) {
      if (!sub.subscriptionId) {
        console.log(`  ⚠️  Skipping ${sub.id} - no subscription_id`);
        fixes.push({
          userId,
          subscriptionId: sub.id,
          action: 'error',
          oldStatus: sub.status,
          newStatus: sub.status,
          details: 'No subscription_id',
        });
        continue;
      }

      try {
        console.log(`  Checking ${sub.subscriptionId} (DB: ${sub.status})...`);

        const result = await creemService.getSubscription(sub.subscriptionId);

        if (!result.success || !result.subscription) {
          console.log('    ❌ Not found in Creem or deleted - marking as canceled');

          // Subscription doesn't exist in Creem, mark as canceled in DB
          if (sub.status !== 'canceled') {
            await db
              .update(payment)
              .set({
                status: 'canceled',
                updatedAt: new Date(),
              })
              .where(eq(payment.id, sub.id));

            fixes.push({
              userId,
              subscriptionId: sub.subscriptionId,
              action: 'synced',
              oldStatus: sub.status,
              newStatus: 'canceled',
              details: 'Not found in Creem',
            });
          }

          syncedSubs.push({ payment: sub, creemStatus: 'canceled' });
          continue;
        }

        const creemStatus = result.subscription.status || 'active';
        const normalizedCreemStatus = normalizeCreemStatus(creemStatus);

        console.log(`    Creem: ${creemStatus} (normalized: ${normalizedCreemStatus})`);

        // Update DB if status mismatch
        if (sub.status !== normalizedCreemStatus) {
          console.log(`    🔧 Updating: ${sub.status} → ${normalizedCreemStatus}`);

          await db
            .update(payment)
            .set({
              status: normalizedCreemStatus,
              updatedAt: new Date(),
            })
            .where(eq(payment.id, sub.id));

          fixes.push({
            userId,
            subscriptionId: sub.subscriptionId,
            action: 'synced',
            oldStatus: sub.status,
            newStatus: normalizedCreemStatus,
            details: 'Status synced with Creem',
          });

          syncedSubs.push({
            payment: { ...sub, status: normalizedCreemStatus },
            creemStatus: normalizedCreemStatus,
          });
        } else {
          console.log('    ✓ Already in sync');
          syncedSubs.push({ payment: sub, creemStatus: normalizedCreemStatus });

          fixes.push({
            userId,
            subscriptionId: sub.subscriptionId,
            action: 'no_change',
            oldStatus: sub.status,
            newStatus: sub.status,
            details: 'Already in sync',
          });
        }
      } catch (error) {
        console.error(`    ❌ Error syncing ${sub.subscriptionId}:`, error);
        syncedSubs.push({ payment: sub, creemStatus: null });

        fixes.push({
          userId,
          subscriptionId: sub.subscriptionId || sub.id,
          action: 'error',
          oldStatus: sub.status,
          newStatus: sub.status,
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Step 2b: Find active subscriptions after sync
    const activeSubs = syncedSubs.filter(
      (s) =>
        s.creemStatus === 'active' || s.creemStatus === 'trialing' || s.creemStatus === 'past_due'
    );

    if (activeSubs.length === 0) {
      console.log('  ℹ️  No active subscriptions for this user');
      continue;
    }

    if (activeSubs.length === 1) {
      console.log('  ✓ Only 1 active subscription - correct state');
      continue;
    }

    // Step 2c: Multiple active subscriptions - keep only the most recent one
    console.log(`  ⚠️  MULTIPLE ACTIVE SUBSCRIPTIONS DETECTED: ${activeSubs.length}`);
    console.log('  🔧 Keeping only the most recent subscription...\n');

    // Sort by createdAt descending (most recent first)
    activeSubs.sort(
      (a, b) => new Date(b.payment.createdAt).getTime() - new Date(a.payment.createdAt).getTime()
    );

    const keepSub = activeSubs[0];
    const cancelSubs = activeSubs.slice(1);

    console.log(
      `  ✅ KEEPING: ${keepSub.payment.subscriptionId} (${keepSub.payment.priceId}, ${keepSub.payment.status})`
    );
    console.log(`     Created: ${keepSub.payment.createdAt}`);

    for (const cancelSub of cancelSubs) {
      console.log(
        `\n  ❌ CANCELING: ${cancelSub.payment.subscriptionId} (${cancelSub.payment.priceId}, ${cancelSub.payment.status})`
      );
      console.log(`     Created: ${cancelSub.payment.createdAt}`);

      try {
        // Cancel in Creem
        if (cancelSub.payment.subscriptionId) {
          const cancelResult = await creemService.cancelSubscription(
            cancelSub.payment.subscriptionId
          );

          if (cancelResult.success || cancelResult.alreadyCancelled) {
            console.log('     ✓ Canceled in Creem');
          } else {
            console.log(`     ⚠️  Creem cancel failed: ${cancelResult.error}`);
          }
        }

        // Update DB
        await db
          .update(payment)
          .set({
            status: 'canceled',
            cancelAtPeriodEnd: false,
            updatedAt: new Date(),
          })
          .where(eq(payment.id, cancelSub.payment.id));

        console.log('     ✓ Marked as canceled in DB');

        fixes.push({
          userId,
          subscriptionId: cancelSub.payment.subscriptionId || cancelSub.payment.id,
          action: 'canceled_duplicate',
          oldStatus: cancelSub.payment.status,
          newStatus: 'canceled',
          details: 'Duplicate active subscription',
        });
      } catch (error) {
        console.error('     ❌ Error canceling duplicate:', error);

        fixes.push({
          userId,
          subscriptionId: cancelSub.payment.subscriptionId || cancelSub.payment.id,
          action: 'error',
          oldStatus: cancelSub.payment.status,
          newStatus: cancelSub.payment.status,
          details: error instanceof Error ? error.message : 'Failed to cancel',
        });
      }
    }
  }

  // Step 3: Print summary
  console.log(`\n\n${'='.repeat(60)}`);
  console.log('📊 CLEANUP SUMMARY');
  console.log('='.repeat(60));

  const syncedCount = fixes.filter((f) => f.action === 'synced').length;
  const canceledCount = fixes.filter((f) => f.action === 'canceled_duplicate').length;
  const errorCount = fixes.filter((f) => f.action === 'error').length;
  const noChangeCount = fixes.filter((f) => f.action === 'no_change').length;

  console.log(`Total subscriptions processed: ${fixes.length}`);
  console.log(`✅ Synced: ${syncedCount}`);
  console.log(`❌ Canceled duplicates: ${canceledCount}`);
  console.log(`⚠️  Errors: ${errorCount}`);
  console.log(`✓ No change: ${noChangeCount}`);

  if (syncedCount > 0 || canceledCount > 0) {
    console.log('\n📝 CHANGES MADE:');
    const changes = fixes.filter((f) => f.action === 'synced' || f.action === 'canceled_duplicate');
    console.table(
      changes.map((f) => ({
        User: f.userId.substring(0, 8),
        Subscription: f.subscriptionId.substring(0, 20),
        Action: f.action,
        'Old Status': f.oldStatus,
        'New Status': f.newStatus,
        Details: f.details,
      }))
    );
  }

  if (errorCount > 0) {
    console.log('\n⚠️  ERRORS:');
    const errors = fixes.filter((f) => f.action === 'error');
    console.table(
      errors.map((f) => ({
        User: f.userId.substring(0, 8),
        Subscription: f.subscriptionId.substring(0, 20),
        'Old Status': f.oldStatus,
        Details: f.details,
      }))
    );
  }

  console.log('\n✅ Cleanup complete!');
}

fixMultipleActiveSubscriptions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
