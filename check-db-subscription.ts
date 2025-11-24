/**
 * Check if subscription exists and user IDs match
 * Run: npx tsx check-db-subscription.ts
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const _db = drizzle(sql);

async function checkDatabase() {
  console.log('================================================');
  console.log('Checking database for subscription and user...');
  console.log('================================================\n');

  try {
    // Query 1: Find the subscription
    console.log('Query 1: Looking for subscription sub_5EM6IgULEBVjEtMx5OH0TT...\n');

    const subscriptionResult = await sql`
      SELECT 
        id,
        "userId",
        "subscriptionId",
        "customerId",
        "priceId",
        "productId",
        status,
        interval,
        "scheduledPlanId",
        "scheduledInterval",
        "scheduledPeriodStart",
        "createdAt"
      FROM payment 
      WHERE "subscriptionId" = 'sub_5EM6IgULEBVjEtMx5OH0TT'
    `;

    if (subscriptionResult.length === 0) {
      console.log('❌ Subscription NOT FOUND in database!');
      console.log('   This subscription does not exist in your payment table.');
      console.log('   You may need to create it first.\n');
    } else {
      const sub = subscriptionResult[0];
      console.log('✅ Subscription found:');
      console.log('   ID:', sub.id);
      console.log('   User ID:', sub.userId);
      console.log('   Customer ID:', sub.customerId);
      console.log('   Price ID:', sub.priceId);
      console.log('   Status:', sub.status);
      console.log('   Interval:', sub.interval);
      console.log('   Scheduled Plan:', sub.scheduledPlanId || '(none)');
      console.log('   Created:', sub.createdAt);
      console.log('');
    }

    // Query 2: Count subscriptions for this user
    console.log('Query 2: Counting subscriptions for user myZwkau1DoG2GXcibytBYmmwRXX8Mw6L...\n');

    const countResult = await sql`
      SELECT COUNT(*) as total_subscriptions
      FROM payment
      WHERE "userId" = 'myZwkau1DoG2GXcibytBYmmwRXX8Mw6L'
    `;

    console.log(`   Total subscriptions: ${countResult[0].total_subscriptions}\n`);

    // Query 3: Find the user
    console.log('Query 3: Looking for user myZwkau1DoG2GXcibytBYmmwRXX8Mw6L...\n');

    const userResult = await sql`
      SELECT id, email, name 
      FROM "user" 
      WHERE id = 'myZwkau1DoG2GXcibytBYmmwRXX8Mw6L'
    `;

    if (userResult.length === 0) {
      console.log('❌ User NOT FOUND in database!');
      console.log('   User ID myZwkau1DoG2GXcibytBYmmwRXX8Mw6L does not exist.\n');
    } else {
      const user = userResult[0];
      console.log('✅ User found:');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Name:', user.name);
      console.log('');
    }

    // Analysis
    console.log('================================================');
    console.log('ANALYSIS');
    console.log('================================================\n');

    if (subscriptionResult.length > 0 && userResult.length > 0) {
      const sub = subscriptionResult[0];
      const user = userResult[0];

      if (sub.userId === user.id) {
        console.log('✅ User IDs MATCH!');
        console.log('   Subscription userId:', sub.userId);
        console.log('   User table id:', user.id);
        console.log('');
        console.log('   The 403 error is NOT caused by user ID mismatch.');
        console.log('   Check if you are logged in as this user in the browser.\n');
      } else {
        console.log('❌ User IDs DO NOT MATCH!');
        console.log('   Subscription userId:', sub.userId);
        console.log('   User table id:', user.id);
        console.log('');
        console.log('   This is causing the 403 Forbidden error!');
        console.log('');
        console.log('   FIX: Run this SQL command:');
        console.log(
          `   UPDATE payment SET "userId" = '${user.id}' WHERE "subscriptionId" = 'sub_5EM6IgULEBVjEtMx5OH0TT';\n`
        );
      }
    } else if (subscriptionResult.length === 0) {
      console.log('❌ Subscription does not exist in database');
      console.log('   You need to create the subscription first or sync from Creem.\n');
    } else if (userResult.length === 0) {
      console.log('❌ User does not exist in database');
      console.log('   Check if the user ID in the webhook is correct.\n');
    }
  } catch (error) {
    console.error('❌ Database query failed:');
    console.error(error);
    process.exit(1);
  }
}

checkDatabase();
