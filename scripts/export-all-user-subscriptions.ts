import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { db } from '@/server/db';
import { user, payment } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

interface UserSubscriptionInfo {
  userId: string;
  email: string;
  name: string | null;
  createdAt: Date | null;
  hasSubscription: boolean;
  subscriptionId: string | null;
  currentPlan: string | null;
  status: string | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  scheduledPlanId: string | null;
  scheduledPeriodStart: Date | null;
  scheduledPeriodEnd: Date | null;
  scheduledAt: Date | null;
}

async function exportAllUserSubscriptions() {
  try {
    console.log('Fetching all registered users...\n');

    const users = await db.select().from(user);

    console.log(`Found ${users.length} registered users\n`);
    console.log('Fetching subscription data...\n');

    const results: UserSubscriptionInfo[] = [];

    for (const u of users) {
      const subscriptions = await db
        .select()
        .from(payment)
        .where(eq(payment.userId, u.id));

      const activeSubscription = subscriptions.find(
        (s) => s.status === 'active' || s.status === 'trialing'
      );

      results.push({
        userId: u.id,
        email: u.email,
        name: u.name,
        createdAt: u.createdAt,
        hasSubscription: !!activeSubscription,
        subscriptionId: activeSubscription?.subscriptionId || null,
        currentPlan: activeSubscription?.planId || null,
        status: activeSubscription?.status || null,
        periodStart: activeSubscription?.periodStart || null,
        periodEnd: activeSubscription?.periodEnd || null,
        cancelAtPeriodEnd: activeSubscription?.cancelAtPeriodEnd || false,
        scheduledPlanId: activeSubscription?.scheduledPlanId || null,
        scheduledPeriodStart: activeSubscription?.scheduledPeriodStart || null,
        scheduledPeriodEnd: activeSubscription?.scheduledPeriodEnd || null,
        scheduledAt: activeSubscription?.scheduledAt || null,
      });
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('USER SUBSCRIPTION STATUS REPORT');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const withSubscription = results.filter((r) => r.hasSubscription);
    const withScheduled = results.filter((r) => r.scheduledPlanId);
    const withoutSubscription = results.filter((r) => !r.hasSubscription);

    console.log(`Total Users: ${results.length}`);
    console.log(`With Active Subscription: ${withSubscription.length}`);
    console.log(`With Scheduled Changes: ${withScheduled.length}`);
    console.log(`Without Subscription: ${withoutSubscription.length}\n`);

    if (withSubscription.length > 0) {
      console.log('───────────────────────────────────────────────────────────────');
      console.log('USERS WITH ACTIVE SUBSCRIPTIONS');
      console.log('───────────────────────────────────────────────────────────────\n');

      for (const user of withSubscription) {
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${user.name || 'N/A'}`);
        console.log(`User ID: ${user.userId}`);
        console.log(`Subscription ID: ${user.subscriptionId}`);
        console.log(`Current Plan: ${user.currentPlan}`);
        console.log(`Status: ${user.status}`);
        console.log(`Period: ${user.periodStart?.toISOString()} → ${user.periodEnd?.toISOString()}`);
        console.log(`Cancel at Period End: ${user.cancelAtPeriodEnd ? 'YES' : 'NO'}`);

        if (user.scheduledPlanId) {
          console.log('\n🔔 SCHEDULED CHANGE:');
          console.log(`   → New Plan: ${user.scheduledPlanId}`);
          console.log(`   → Effective: ${user.scheduledPeriodStart?.toISOString()}`);
          console.log(`   → New Period End: ${user.scheduledPeriodEnd?.toISOString()}`);
          console.log(`   → Scheduled At: ${user.scheduledAt?.toISOString()}`);
        }

        console.log('\n');
      }
    }

    if (withoutSubscription.length > 0) {
      console.log('───────────────────────────────────────────────────────────────');
      console.log('USERS WITHOUT SUBSCRIPTIONS (FREE PLAN)');
      console.log('───────────────────────────────────────────────────────────────\n');

      for (const user of withoutSubscription) {
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${user.name || 'N/A'}`);
        console.log(`User ID: ${user.userId}`);
        console.log(`Registered: ${user.createdAt?.toISOString() || 'N/A'}`);
        console.log('');
      }
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('CSV EXPORT');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('email,name,userId,hasSubscription,currentPlan,status,periodEnd,cancelAtPeriodEnd,scheduledPlanId,scheduledPeriodStart');
    for (const user of results) {
      console.log(
        [
          user.email,
          user.name || '',
          user.userId,
          user.hasSubscription ? 'YES' : 'NO',
          user.currentPlan || 'free',
          user.status || 'none',
          user.periodEnd?.toISOString() || '',
          user.cancelAtPeriodEnd ? 'YES' : 'NO',
          user.scheduledPlanId || '',
          user.scheduledPeriodStart?.toISOString() || '',
        ].join(',')
      );
    }

    console.log('\n✅ Export complete!\n');
  } catch (error) {
    console.error('❌ Error exporting subscriptions:', error);
    process.exit(1);
  }
}

exportAllUserSubscriptions();