#!/usr/bin/env node
/**
 * Simple database check without environment validation
 * Usage: node check-db-simple.cjs
 */

// Load .env.local file
require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');

async function checkDatabase() {
  // Get DATABASE_URL from environment
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log('\n❌ DATABASE_URL environment variable is not set!\n');
    console.log('💡 To check your database, you need to:');
    console.log('\n1. Copy .env.example to .env.local:');
    console.log('   cp env.example .env.local\n');
    console.log('2. Edit .env.local and add your DATABASE_URL\n');
    console.log('3. Run this script again\n');
    process.exit(1);
  }

  console.log('🔍 Checking database connection...\n');
  console.log('='.repeat(60));

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    // Connect to database
    await client.connect();
    console.log('✅ Connected to database!\n');

    // Check if admins table exists
    console.log('📋 Checking if admins table exists...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admins'
      ) as exists;
    `);

    const tableExists = tableCheck.rows[0].exists;

    if (!tableExists) {
      console.log('❌ admins table does NOT exist!\n');
      console.log('💡 Solution: Run database migration:');
      console.log('   pnpm db:generate');
      console.log('   pnpm db:migrate\n');
      console.log('='.repeat(60));
      process.exit(1);
    }

    console.log('✅ admins table exists!\n');

    // Get table structure
    console.log('📊 Table structure:');
    const structure = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'admins'
      ORDER BY ordinal_position;
    `);

    structure.rows.forEach((col) => {
      const nullable = col.is_nullable === 'YES' ? '' : ' NOT NULL';
      console.log(`  - ${col.column_name} (${col.data_type})${nullable}`);
    });

    // Check for admin accounts
    console.log('\n👥 Checking for admin accounts...');
    const admins = await client.query('SELECT id, email, name, role, created_at, last_login_at FROM admins;');

    if (admins.rows.length === 0) {
      console.log('❌ No admin accounts found!\n');
      console.log('💡 Solution: Create an admin account:');
      console.log('   pnpm tsx src/scripts/create-admin.ts\n');
      console.log('   Or use the SQL from quick-fix-admin.cjs\n');
      console.log('='.repeat(60));
      process.exit(1);
    }

    console.log(`✅ Found ${admins.rows.length} admin account(s):\n`);

    admins.rows.forEach((admin, index) => {
      console.log(`${index + 1}. Admin Account:`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.name || 'N/A'}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Created: ${admin.created_at}`);
      console.log(`   Last Login: ${admin.last_login_at || 'Never'}`);
      console.log('');
    });

    console.log('='.repeat(60));
    console.log('✅ ALL CHECKS PASSED!');
    console.log('\n🔗 Login credentials:');
    console.log('   URL: https://www.viecom.pro/admin/login');
    console.log('   Email: ' + admins.rows[0].email);
    console.log('   Password: (the one you set - default is admin123456)');
    console.log('='.repeat(60));
    console.log('\n💡 If login still fails with 500 error, check:');
    console.log('   1. ADMIN_JWT_SECRET is set in Vercel');
    console.log('   2. Application has been redeployed after setting env vars');
    console.log('   3. Check Vercel function logs for detailed error\n');

  } catch (error) {
    console.error('\n❌ Database error:', error.message);
    console.error('\nPossible causes:');
    console.error('  1. Invalid DATABASE_URL');
    console.error('  2. Database is not accessible');
    console.error('  3. Wrong credentials\n');
    console.error('Your DATABASE_URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'));
    console.error('');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run check
checkDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

