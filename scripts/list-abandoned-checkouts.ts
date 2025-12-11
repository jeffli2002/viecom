import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { and, eq, inArray, isNull, notInArray, or, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { payment, paymentEvent, user } from '../src/server/db/schema';

// Load .env.local file FIRST
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Please check your .env.local file.');
  process.exit(1);
}

// Create database connection directly
const client = postgres(databaseUrl);
const db = drizzle(client);

interface AbandonedCheckoutUser {
  userId: string;
  email: string;
  name: string;
  customerId: string | null;
  checkoutEvents: number;
  lastCheckoutEvent: Date | null;
  hasActiveSubscription: boolean;
  hasAnyPayment: boolean;
  paymentStatus: string | null;
}

async function findAbandonedCheckouts() {
  try {
    console.log('Finding users who visited checkout but did not complete payment...\n');

    // Strategy 1: Find users with checkout_complete events but no active payment
    console.log('Strategy 1: Checking payment_event table for checkout events...');

    const checkoutEvents = await db
      .select({
        paymentId: paymentEvent.paymentId,
        eventType: paymentEvent.eventType,
        eventData: paymentEvent.eventData,
        createdAt: paymentEvent.createdAt,
      })
      .from(paymentEvent)
      .where(
        or(
          eq(paymentEvent.eventType, 'checkout.completed'),
          eq(paymentEvent.eventType, 'checkout_complete'),
          sql`${paymentEvent.eventType} LIKE 'checkout%'`
        )
      );

    console.log(`Found ${checkoutEvents.length} checkout events in payment_event table\n`);

    // Strategy 2: Find users with customerId but no successful subscription ever
    console.log('Strategy 2: Checking users with customerId but no successful subscription...');

    // Get all unique users with customerId
    const usersWithCustomerId = await db
      .select({
        userId: payment.userId,
        customerId: payment.customerId,
      })
      .from(payment)
      .where(sql`${payment.customerId} IS NOT NULL`)
      .groupBy(payment.userId, payment.customerId);

    // Get all users who ever had a successful subscription (active, trialing, or past active)
    const usersWithSuccessfulSubscription = await db
      .select({
        userId: payment.userId,
      })
      .from(payment)
      .where(
        and(
          eq(payment.type, 'subscription'),
          inArray(payment.status, ['active', 'trialing', 'past_due'])
        )
      )
      .groupBy(payment.userId);

    const successfulUserIds = new Set(usersWithSuccessfulSubscription.map((s) => s.userId));

    // Find users with customerId but never had a successful subscription
    const usersWithCustomerButNoSuccess = usersWithCustomerId.filter(
      (p) => !successfulUserIds.has(p.userId)
    );

    console.log(
      `Found ${usersWithCustomerButNoSuccess.length} users with customerId but no successful subscription\n`
    );

    // Strategy 3: Get all unique user IDs from both strategies
    const allPotentialAbandonedUserIds = new Set<string>();

    // From checkout events - get payment records and their user IDs
    if (checkoutEvents.length > 0) {
      const paymentIds = checkoutEvents.map((e) => e.paymentId);
      const paymentsFromEvents = await db
        .select({
          userId: payment.userId,
          status: payment.status,
        })
        .from(payment)
        .where(inArray(payment.id, paymentIds));

      paymentsFromEvents.forEach((p) => {
        // Only include if payment is not active
        if (p.status !== 'active') {
          allPotentialAbandonedUserIds.add(p.userId);
        }
      });
    }

    // From users with customer but no successful subscription
    usersWithCustomerButNoSuccess.forEach((p) => {
      allPotentialAbandonedUserIds.add(p.userId);
    });

    console.log(`Total unique users to check: ${allPotentialAbandonedUserIds.size}\n`);

    if (allPotentialAbandonedUserIds.size === 0) {
      console.log('No users found with abandoned checkouts.');
      return;
    }

    // Get user details and payment information
    const userIdsArray = Array.from(allPotentialAbandonedUserIds);

    const users = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
      })
      .from(user)
      .where(inArray(user.id, userIdsArray));

    const abandonedUsers: AbandonedCheckoutUser[] = [];

    for (const userRecord of users) {
      // Get payment records for this user
      const userPayments = await db
        .select({
          customerId: payment.customerId,
          status: payment.status,
          type: payment.type,
          createdAt: payment.createdAt,
        })
        .from(payment)
        .where(eq(payment.userId, userRecord.id))
        .orderBy(sql`${payment.createdAt} DESC`);

      // Get checkout events for this user's payments
      const userPaymentIds = userPayments.map((p) => p.customerId).filter(Boolean);
      let checkoutEventCount = 0;
      let lastCheckoutEvent: Date | null = null;

      if (userPaymentIds.length > 0) {
        // Get payment IDs for this user
        const paymentIds = await db
          .select({ id: payment.id })
          .from(payment)
          .where(eq(payment.userId, userRecord.id));

        if (paymentIds.length > 0) {
          const paymentIdList = paymentIds.map((p) => p.id);
          const userCheckoutEvents = await db
            .select({
              createdAt: paymentEvent.createdAt,
            })
            .from(paymentEvent)
            .where(
              and(
                inArray(paymentEvent.paymentId, paymentIdList),
                or(
                  eq(paymentEvent.eventType, 'checkout.completed'),
                  eq(paymentEvent.eventType, 'checkout_complete'),
                  sql`${paymentEvent.eventType} LIKE 'checkout%'`
                )
              )
            )
            .orderBy(sql`${paymentEvent.createdAt} DESC`);

          checkoutEventCount = userCheckoutEvents.length;
          if (userCheckoutEvents.length > 0) {
            lastCheckoutEvent = userCheckoutEvents[0]?.createdAt;
          }
        }
      }

      const hasActiveSubscription = userPayments.some(
        (p) => p.status === 'active' && p.type === 'subscription'
      );
      const hasAnyPayment = userPayments.length > 0;
      const latestPayment = userPayments[0];
      const paymentStatus = latestPayment?.status || null;
      const customerId = latestPayment?.customerId || null;

      // Only include if they don't have an active subscription
      if (!hasActiveSubscription) {
        abandonedUsers.push({
          userId: userRecord.id,
          email: userRecord.email,
          name: userRecord.name || 'N/A',
          customerId,
          checkoutEvents: checkoutEventCount,
          lastCheckoutEvent,
          hasActiveSubscription: false,
          hasAnyPayment,
          paymentStatus,
        });
      }
    }

    // Sort by last checkout event (most recent first)
    abandonedUsers.sort((a, b) => {
      if (!a.lastCheckoutEvent && !b.lastCheckoutEvent) return 0;
      if (!a.lastCheckoutEvent) return 1;
      if (!b.lastCheckoutEvent) return -1;
      return b.lastCheckoutEvent.getTime() - a.lastCheckoutEvent.getTime();
    });

    console.log('='.repeat(80));
    console.log('ABANDONED CHECKOUT USERS');
    console.log('='.repeat(80));
    console.log(`\nTotal users found: ${abandonedUsers.length}\n`);

    if (abandonedUsers.length === 0) {
      console.log('No users with abandoned checkouts found.');
      return;
    }

    // Display results
    abandonedUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.email} (${user.name})`);
      console.log(`   User ID: ${user.userId}`);
      console.log(`   Customer ID: ${user.customerId || 'N/A'}`);
      console.log(`   Checkout Events: ${user.checkoutEvents}`);
      console.log(
        `   Last Checkout Event: ${user.lastCheckoutEvent ? user.lastCheckoutEvent.toISOString() : 'N/A'}`
      );
      console.log(`   Has Any Payment Record: ${user.hasAnyPayment ? 'Yes' : 'No'}`);
      console.log(`   Payment Status: ${user.paymentStatus || 'N/A'}`);
      console.log(`   Has Active Subscription: ${user.hasActiveSubscription ? 'Yes' : 'No'}`);
    });

    // Summary statistics
    console.log(`\n${'='.repeat(80)}`);
    console.log('SUMMARY STATISTICS');
    console.log('='.repeat(80));
    console.log(`\nTotal abandoned checkout users: ${abandonedUsers.length}`);
    console.log(
      `Users with checkout events: ${abandonedUsers.filter((u) => u.checkoutEvents > 0).length}`
    );
    console.log(
      `Users with customerId but no active subscription: ${abandonedUsers.filter((u) => u.customerId).length}`
    );
    console.log(
      `Users with payment records (but not active): ${abandonedUsers.filter((u) => u.hasAnyPayment).length}`
    );

    // Export to CSV format
    console.log(`\n${'='.repeat(80)}`);
    console.log('CSV FORMAT (for export)');
    console.log('='.repeat(80));

    const csvHeader =
      'Email,Name,User ID,Customer ID,Checkout Events,Last Checkout Event,Has Payment Record,Payment Status';
    const csvRows = abandonedUsers.map((user) => {
      return `"${user.email}","${user.name}","${user.userId}","${user.customerId || ''}",${user.checkoutEvents},"${user.lastCheckoutEvent ? user.lastCheckoutEvent.toISOString() : ''}",${user.hasAnyPayment ? 'Yes' : 'No'},"${user.paymentStatus || ''}"`;
    });

    const csvContent = [csvHeader, ...csvRows].join('\n');
    console.log(`\n${csvContent}`);

    // Save to file
    const outputFile = 'abandoned-checkouts.csv';
    writeFileSync(outputFile, csvContent, 'utf-8');
    console.log(`\n✅ Results saved to ${outputFile}`);

    console.log(`\n${'='.repeat(80)}`);
    console.log('NOTE: This script identifies users who:');
    console.log('1. Have checkout events in payment_event table but no active subscription');
    console.log('2. Have customerId but never had a successful subscription');
    console.log('3. May not capture all cases if checkout sessions were not logged');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error finding abandoned checkouts:', error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

findAbandonedCheckouts();
