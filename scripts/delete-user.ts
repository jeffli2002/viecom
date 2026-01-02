/**
 * Delete a user account by email
 * Usage: pnpm tsx scripts/delete-user.ts <email1> [email2] [email3] ...
 * Example: pnpm tsx scripts/delete-user.ts user@example.com user2@example.com
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
import { eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(databaseUrl);
const db = drizzle(sql);

async function deleteUser(email: string) {
  try {
    console.log(`\n🗑️  Deleting user: ${email}...\n`);
    console.log('='.repeat(80));

    // Step 1: Find user by email
    const [userRecord] = await db
      .select({ id: user.id, email: user.email, name: user.name })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!userRecord) {
      console.log(`⚠️  User not found: ${email}`);
      return { success: false, reason: 'not_found' };
    }

    console.log(`✅ Found user: ${userRecord.email} (ID: ${userRecord.id})`);
    console.log(`   Name: ${userRecord.name || 'N/A'}\n`);

    // Step 2: Delete user (cascade will handle related records)
    await db.delete(user).where(eq(user.id, userRecord.id));

    console.log('✅ User deleted successfully!');
    console.log(`   Email: ${userRecord.email}`);
    console.log(`   ID: ${userRecord.id}`);

    // Step 3: Verify deletion
    const [deletedUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, userRecord.id))
      .limit(1);

    if (deletedUser) {
      console.log('   ⚠️  Warning: User may not have been deleted');
      return { success: false, reason: 'verification_failed' };
    } else {
      console.log('   ✅ Verification: User confirmed deleted');
      return { success: true, email: userRecord.email };
    }
  } catch (error) {
    console.error(`❌ Error deleting user ${email}:`, error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
    return { success: false, reason: 'error', error };
  }
}

async function deleteUsers(emails: string[]) {
  console.log(`\n🗑️  Starting deletion process for ${emails.length} user(s)...\n`);
  console.log('='.repeat(80));

  const results = [];

  for (const email of emails) {
    const result = await deleteUser(email);
    results.push({ email, ...result });
    console.log('\n' + '-'.repeat(80) + '\n');
  }

  // Summary
  console.log('\n📊 Summary:');
  console.log('='.repeat(80));
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ Successfully deleted: ${successful.length}`);
  successful.forEach((r) => {
    console.log(`   - ${r.email}`);
  });

  if (failed.length > 0) {
    console.log(`\n❌ Failed to delete: ${failed.length}`);
    failed.forEach((r) => {
      console.log(`   - ${r.email} (${r.reason || 'unknown'})`);
    });
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('✅ Process completed!\n');

  return results;
}

// Parse command line arguments
const emails = process.argv.slice(2);

if (emails.length === 0) {
  console.error('❌ At least one email is required.');
  console.error('Usage: pnpm tsx scripts/delete-user.ts <email1> [email2] [email3] ...');
  console.error('Example: pnpm tsx scripts/delete-user.ts user@example.com user2@example.com');
  process.exit(1);
}

deleteUsers(emails)
  .then((results) => {
    const allSuccessful = results.every((r) => r.success);
    process.exit(allSuccessful ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

