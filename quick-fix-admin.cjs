#!/usr/bin/env node
/**
 * Quick Fix: Create Admin Account
 * 
 * This script will:
 * 1. Generate bcrypt hash for password
 * 2. Provide SQL to manually insert admin
 * 
 * Usage: node quick-fix-admin.js
 */

const bcrypt = require('bcryptjs');

const email = 'admin@viecom.pro';
const password = 'admin123456';
const name = 'Admin User';

console.log('🔐 Generating Admin Account Details');
console.log('===================================\n');

// Generate password hash
const passwordHash = bcrypt.hashSync(password, 10);

console.log('📧 Email:', email);
console.log('🔒 Password:', password);
console.log('🔑 Password Hash:', passwordHash);
console.log('\n===================================\n');

console.log('📝 SQL to Insert Admin (Copy and run in your database):\n');

const sql = `
INSERT INTO admins (
  id,
  email,
  name,
  password_hash,
  role,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '${email}',
  '${name}',
  '${passwordHash}',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW();
`.trim();

console.log(sql);

console.log('\n\n===================================');
console.log('✅ Copy the SQL above and run it in your PostgreSQL database');
console.log('⚠️  Change the password after first login!');
console.log('🔗 Login at: https://www.viecom.pro/admin/login');
console.log('===================================\n');

