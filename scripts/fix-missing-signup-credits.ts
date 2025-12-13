/**
 * Fix missing signup bonus credits for users
 * Usage: pnpm tsx scripts/fix-missing-signup-credits.ts <email1> <email2> ...
 * Example: pnpm tsx scripts/fix-missing-signup-credits.ts user1@example.com user2@example.com
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

import { randomUUID } from 'node:crypto';
import { paymentConfig } from '@/config/payment.config';
import { creditTransactions, user, userCredits } from '@/server/db/schema';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(databaseUrl);
const db = drizzle(sql);

async function fixMissingSignupCredits(emails: string[]) {
  try {
    console.log(`\n🔧 Fixing missing signup bonus credits for ${emails.length} users...\n`);
    console.log('='.repeat(80));

    const freePlan = paymentConfig.plans.find((p) => p.id === 'free');
    const signupCredits = freePlan?.credits?.onSignup || 15;

    for (const email of emails) {
      console.log(`\n📧 Processing: ${email}`);
      console.log('-'.repeat(80));

      // Step 1: Find user by email
      const [userRecord] = await db
        .select({
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        })
        .from(user)
        .where(eq(user.email, email))
        .limit(1);

      if (!userRecord) {
        console.log(`❌ User not found: ${email}`);
        continue;
      }

      console.log(`✅ Found user: ${userRecord.email} (ID: ${userRecord.id})`);

      // Step 2: Check if credit account exists
      const [existingAccount] = await db
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, userRecord.id))
        .limit(1);

      // Step 3: Check if signup bonus already granted
      const signupReferenceId = `signup_${userRecord.id}`;
      const [existingSignupTx] = await db
        .select()
        .from(creditTransactions)
        .where(eq(creditTransactions.referenceId, signupReferenceId))
        .limit(1);

      if (existingSignupTx) {
        console.log(`⚠️  Signup bonus already granted (Transaction ID: ${existingSignupTx.id})`);
        continue;
      }

      // Step 4: Create or update credit account
      let currentBalance = 0;
      let totalEarned = 0;

      if (existingAccount) {
        currentBalance = existingAccount.balance || 0;
        totalEarned = existingAccount.totalEarned || 0;
        console.log(`   Existing account found - Balance: ${currentBalance}, Total Earned: ${totalEarned}`);
      } else {
        console.log(`   Creating new credit account...`);
      }

      const newBalance = currentBalance + signupCredits;
      const newTotalEarned = totalEarned + signupCredits;

      if (existingAccount) {
        await db
          .update(userCredits)
          .set({
            balance: newBalance,
            totalEarned: newTotalEarned,
            updatedAt: new Date(),
          })
          .where(eq(userCredits.userId, userRecord.id));
      } else {
        await db.insert(userCredits).values({
          id: randomUUID(),
          userId: userRecord.id,
          balance: signupCredits,
          totalEarned: signupCredits,
          totalSpent: 0,
          frozenBalance: 0,
        });
      }

      // Step 5: Create signup bonus transaction
      const transactionId = randomUUID();
      await db.insert(creditTransactions).values({
        id: transactionId,
        userId: userRecord.id,
        type: 'earn',
        amount: signupCredits,
        balanceAfter: newBalance,
        source: 'bonus',
        description: 'Welcome bonus - thank you for signing up!',
        referenceId: signupReferenceId,
        metadata: JSON.stringify({
          fixedBy: 'admin_script',
          email,
          timestamp: new Date().toISOString(),
        }),
      });

      console.log(`✅ Fixed!`);
      console.log(`   Granted: ${signupCredits} credits`);
      console.log(`   New balance: ${newBalance}`);
      console.log(`   Transaction ID: ${transactionId}`);
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ Process completed!\n');
  } catch (error) {
    console.error('❌ Error fixing signup credits:', error);
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
  console.error('Usage: pnpm tsx scripts/fix-missing-signup-credits.ts <email1> <email2> ...');
  console.error(
    'Example: pnpm tsx scripts/fix-missing-signup-credits.ts user1@example.com user2@example.com'
  );
  process.exit(1);
}

fixMissingSignupCredits(emails)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

