/**
 * Reset admin password script
 * Usage: tsx scripts/reset-admin-password.ts <email> <new-password>
 */

import { resolve } from 'node:path';
import { admins } from '@/server/db/schema';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

// Create database connection
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
});
const db = drizzle(pool, { schema: { admins } });

async function resetAdminPassword(email: string, newPassword: string) {
  try {
    console.log(`\n🔍 Looking up admin: ${email}`);

    // Find the admin
    const [existingAdmin] = await db
      .select()
      .from(admins)
      .where(eq(admins.email, email))
      .limit(1);

    if (!existingAdmin) {
      console.error(`❌ Admin not found: ${email}`);
      console.log(`\nℹ️  If this is a new admin, use: pnpm tsx src/scripts/create-admin.ts`);
      process.exit(1);
    }

    console.log(`✅ Found admin: ${existingAdmin.email} (ID: ${existingAdmin.id})`);
    console.log(`   Role: ${existingAdmin.role}`);

    // Hash the new password using bcryptjs (same as Better Auth and create-admin script)
    console.log(`\n🔐 Hashing new password...`);
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update the password
    console.log(`📝 Updating password in database...`);
    await db
      .update(admins)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(admins.id, existingAdmin.id));

    console.log(`\n✅ Password reset successfully for ${email}!`);
    console.log(`   Email: ${email}`);
    console.log(`   New Password: ${newPassword}`);
    console.log(`   You can now login at: https://www.viecom.pro/admin/login`);
    console.log(`\n⚠️  Please change this password after logging in!`);

  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Get arguments
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('Usage: tsx scripts/reset-admin-password.ts <email> <new-password>');
  console.error('Example: tsx scripts/reset-admin-password.ts admin@viecom.pro NewSecurePassword123!');
  process.exit(1);
}

if (newPassword.length < 8) {
  console.error('❌ Password must be at least 8 characters long');
  process.exit(1);
}

resetAdminPassword(email, newPassword);
