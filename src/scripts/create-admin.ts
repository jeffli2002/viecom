import { resolve } from 'node:path';
import { admins } from '@/server/db/schema';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Load .env.local file before importing env-dependent modules
config({ path: resolve(process.cwd(), '.env.local') });

// Create database connection directly from environment variable
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

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@viecom.pro';
  const password = process.env.ADMIN_PASSWORD || 'admin123456';
  const name = 'Admin User';

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const existing = await db.select().from(admins).where(eq(admins.email, email)).limit(1);

    if (existing.length > 0) {
      await db
        .update(admins)
        .set({
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(admins.id, existing[0].id));

      console.log('🔐 Admin password updated successfully:');
      console.log('Email:', email);
      console.log('New Password:', password);
      console.log('ID:', existing[0].id);
    } else {
      const result = await db
        .insert(admins)
        .values({
          email,
          passwordHash,
          name,
        })
        .returning();

      console.log('✅ Admin user created successfully:');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('ID:', result[0].id);
      console.log('\n⚠️ Please change the password after first login!');
    }
  } catch (error: unknown) {
    console.error('❌ Failed to create or update admin:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

createAdmin();
