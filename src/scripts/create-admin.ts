import { db } from '@/server/db';
import { admins } from '@/server/db/schema';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@viecom.ai';
  const password = process.env.ADMIN_PASSWORD || 'admin123456';
  const name = 'Admin User';

  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin
    const result = await db.insert(admins).values({
      email,
      passwordHash,
      name,
    }).returning();

    console.log('✅ Admin user created successfully:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('ID:', result[0].id);
    console.log('\n⚠️ Please change the password after first login!');
  } catch (error: any) {
    if (error.code === '23505') {
      console.log('ℹ️ Admin user already exists with email:', email);
    } else {
      console.error('❌ Failed to create admin:', error);
    }
  } finally {
    process.exit(0);
  }
}

createAdmin();

