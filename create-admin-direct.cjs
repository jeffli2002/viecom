#!/usr/bin/env node
/**
 * Directly create admin account in database
 * Usage: node create-admin-direct.cjs
 */

// Load .env.local
require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function createAdmin() {
  const databaseUrl = process.env.DATABASE_URL;
  const email = process.env.ADMIN_EMAIL || 'admin@viecom.pro';
  const password = process.env.ADMIN_PASSWORD || 'admin123456';
  const name = 'Admin User';

  if (!databaseUrl) {
    console.log('❌ DATABASE_URL not set!');
    process.exit(1);
  }

  console.log('\n🔐 Creating Admin Account');
  console.log('='.repeat(60));
  console.log(`📧 Email: ${email}`);
  console.log(`🔒 Password: ${password}`);
  console.log('');

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Generate ID and hash password
    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert admin
    const result = await client.query(`
      INSERT INTO admins (
        id,
        email,
        name,
        password_hash,
        role,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, NOW(), NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        updated_at = NOW()
      RETURNING id, email, name, role, created_at;
    `, [id, email, name, passwordHash, 'admin']);

    console.log('✅ Admin account created successfully!\n');
    console.log('📋 Admin Details:');
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Email: ${result.rows[0].email}`);
    console.log(`   Name: ${result.rows[0].name}`);
    console.log(`   Role: ${result.rows[0].role}`);
    console.log(`   Created: ${result.rows[0].created_at}`);
    console.log('');
    console.log('='.repeat(60));
    console.log('🔗 Login at: https://www.viecom.pro/admin/login');
    console.log(`📧 Email: ${email}`);
    console.log(`🔒 Password: ${password}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    console.log('='.repeat(60));
    console.log('');

  } catch (error) {
    if (error.code === '23505') {
      console.log('ℹ️  Admin account already exists with this email');
      console.log('   Password has been updated to: ' + password);
      console.log('');
    } else {
      console.error('❌ Error creating admin:', error.message);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

createAdmin().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

