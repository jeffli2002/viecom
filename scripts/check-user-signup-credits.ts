/**
 * Check if users received signup bonus credits
 * Usage: pnpm tsx scripts/check-user-signup-credits.ts <email1> <email2> ...
 * Example: pnpm tsx scripts/check-user-signup-credits.ts user1@example.com user2@example.com
 */

import { resolve } from 'node:path';
import { config } from 'dotenv';

// Load .env.local file FIRST
config({ path: resolve(process.cwd(), '.env.local') });

// Set SKIP_ENV_VALIDATION to avoid env.ts validation when importing modules
process.env.SKIP_ENV_VALIDATION = 'true';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Please check your .env.local file.');
  process.exit(1);
}

import { creditTransactions, user, userCredits } from '@/server/db/schema';
import { neon } from '@neondatabase/serverless';
import { and, eq, like, or } from 'drizzle-orm';
import { desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(databaseUrl);
const db = drizzle(sql);

async function checkUserSignupCredits(emails: string[]) {
  try {
    console.log(`\n🔍 Checking signup bonus credits for ${emails.length} users...\n`);
    console.log('='.repeat(80));

    for (const email of emails) {
      console.log(`\n📧 Checking: ${email}`);
      console.log('-'.repeat(80));

      // Step 1: Find user by email
      const [userRecord] = await db
        .select({
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          banned: user.banned,
        })
        .from(user)
        .where(eq(user.email, email))
        .limit(1);

      if (!userRecord) {
        console.log(`❌ User not found: ${email}`);
        continue;
      }

      console.log(`✅ Found user: ${userRecord.email}`);
      console.log(`   ID: ${userRecord.id}`);
      console.log(`   Name: ${userRecord.name || 'N/A'}`);
      console.log(`   Created: ${userRecord.createdAt}`);
      console.log(`   Banned: ${userRecord.banned ? 'Yes' : 'No'}`);

      // Step 2: Check credit account
      const [creditAccount] = await db
        .select({
          balance: userCredits.balance,
          totalEarned: userCredits.totalEarned,
          totalSpent: userCredits.totalSpent,
          createdAt: userCredits.createdAt,
        })
        .from(userCredits)
        .where(eq(userCredits.userId, userRecord.id))
        .limit(1);

      if (!creditAccount) {
        console.log('⚠️  No credit account found for this user');
        continue;
      }

      console.log('\n💰 Credit Account:');
      console.log(`   Balance: ${creditAccount.balance}`);
      console.log(`   Total Earned: ${creditAccount.totalEarned}`);
      console.log(`   Total Spent: ${creditAccount.totalSpent}`);
      console.log(`   Account Created: ${creditAccount.createdAt}`);

      // Step 3: Check for signup bonus transaction
      const signupReferenceId = `signup_${userRecord.id}`;
      const signupTransactions = await db
        .select({
          id: creditTransactions.id,
          amount: creditTransactions.amount,
          source: creditTransactions.source,
          description: creditTransactions.description,
          referenceId: creditTransactions.referenceId,
          createdAt: creditTransactions.createdAt,
        })
        .from(creditTransactions)
        .where(
          and(
            eq(creditTransactions.userId, userRecord.id),
            or(
              eq(creditTransactions.referenceId, signupReferenceId),
              like(creditTransactions.referenceId, 'signup_%'),
              and(
                eq(creditTransactions.source, 'bonus'),
                like(creditTransactions.description, '%sign%')
              )
            )
          )
        )
        .orderBy(creditTransactions.createdAt);

      console.log('\n📝 Signup Bonus Transactions:');
      if (signupTransactions.length === 0) {
        console.log('   ❌ No signup bonus transaction found!');
        console.log(`   Expected referenceId: ${signupReferenceId}`);
      } else {
        signupTransactions.forEach((tx, index) => {
          console.log(`   ${index + 1}. Transaction ID: ${tx.id}`);
          console.log(`      Amount: ${tx.amount}`);
          console.log(`      Source: ${tx.source}`);
          console.log(`      Description: ${tx.description}`);
          console.log(`      Reference ID: ${tx.referenceId}`);
          console.log(`      Created: ${tx.createdAt}`);
        });
      }

      // Step 4: Check all bonus transactions
      const allBonusTransactions = await db
        .select({
          id: creditTransactions.id,
          amount: creditTransactions.amount,
          source: creditTransactions.source,
          description: creditTransactions.description,
          referenceId: creditTransactions.referenceId,
          createdAt: creditTransactions.createdAt,
        })
        .from(creditTransactions)
        .where(
          and(eq(creditTransactions.userId, userRecord.id), eq(creditTransactions.source, 'bonus'))
        )
        .orderBy(creditTransactions.createdAt);

      if (allBonusTransactions.length > 0) {
        console.log('\n🎁 All Bonus Transactions:');
        allBonusTransactions.forEach((tx, index) => {
          console.log(`   ${index + 1}. ${tx.description} - ${tx.amount} credits`);
          console.log(`      Reference: ${tx.referenceId}`);
          console.log(`      Date: ${tx.createdAt}`);
        });
      }

      // Step 5: Check all transactions (first 10)
      const allTransactions = await db
        .select({
          id: creditTransactions.id,
          type: creditTransactions.type,
          amount: creditTransactions.amount,
          source: creditTransactions.source,
          description: creditTransactions.description,
          referenceId: creditTransactions.referenceId,
          createdAt: creditTransactions.createdAt,
        })
        .from(creditTransactions)
        .where(eq(creditTransactions.userId, userRecord.id))
        .orderBy(desc(creditTransactions.createdAt))
        .limit(10);

      if (allTransactions.length > 0) {
        console.log('\n📊 Recent Transactions (first 10):');
        allTransactions.forEach((tx, index) => {
          console.log(`   ${index + 1}. [${tx.type}] ${tx.description} - ${tx.amount} credits`);
          console.log(`      Source: ${tx.source}, Ref: ${tx.referenceId || 'N/A'}`);
        });
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ Check completed!\n');
  } catch (error) {
    console.error('❌ Error checking user signup credits:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
    process.exit(1);
  }
}

// Parse command line arguments
const emails = process.argv.slice(2);

if (emails.length === 0) {
  console.error('❌ At least one email is required.');
  console.error('Usage: pnpm tsx scripts/check-user-signup-credits.ts <email1> <email2> ...');
  console.error(
    'Example: pnpm tsx scripts/check-user-signup-credits.ts user1@example.com user2@example.com'
  );
  process.exit(1);
}

checkUserSignupCredits(emails)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
