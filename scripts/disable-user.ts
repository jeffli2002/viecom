/**
 * Disable a user account by email
 * Usage: pnpm tsx scripts/disable-user.ts <email> [reason]
 * Example: pnpm tsx scripts/disable-user.ts user@example.com "Violation of terms"
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

import { user } from '@/server/db/schema';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(databaseUrl);
const db = drizzle(sql);

async function disableUser(email: string, reason?: string) {
  try {
    console.log(`\n🔧 Disabling account for ${email}...\n`);
    console.log('='.repeat(80));

    // Step 1: Find user by email
    const [userRecord] = await db
      .select({ id: user.id, email: user.email, name: user.name, banned: user.banned })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!userRecord) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${userRecord.email} (ID: ${userRecord.id})`);
    console.log(`   Name: ${userRecord.name || 'N/A'}`);
    console.log(`   Current banned status: ${userRecord.banned ? 'Yes' : 'No'}\n`);

    if (userRecord.banned) {
      console.log('⚠️  User is already disabled.');
      process.exit(0);
    }

    // Step 2: Update user to set banned = true
    await db
      .update(user)
      .set({
        banned: true,
        banReason: reason || 'Account disabled by admin',
        updatedAt: new Date(),
      })
      .where(eq(user.id, userRecord.id));

    console.log('✅ Account disabled successfully!');
    console.log('   Banned: true');
    console.log(`   Reason: ${reason || 'Account disabled by admin'}`);

    // Step 3: Verify the update
    const [updatedUser] = await db
      .select({ banned: user.banned, banReason: user.banReason })
      .from(user)
      .where(eq(user.id, userRecord.id))
      .limit(1);

    console.log('\n📊 Verification:');
    console.log(`   Banned status: ${updatedUser?.banned ? 'Yes' : 'No'}`);
    console.log(`   Ban reason: ${updatedUser?.banReason || 'N/A'}`);

    if (updatedUser?.banned) {
      console.log('   ✅ Account successfully disabled');
    } else {
      console.log('   ⚠️  Warning: Account may not have been disabled');
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ Process completed!\n');
  } catch (error) {
    console.error('❌ Error disabling user:', error);
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
const email = process.argv[2];
const reason = process.argv[3];

if (!email) {
  console.error('❌ Email is required.');
  console.error('Usage: pnpm tsx scripts/disable-user.ts <email> [reason]');
  console.error('Example: pnpm tsx scripts/disable-user.ts user@example.com "Violation of terms"');
  process.exit(1);
}

disableUser(email, reason)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
