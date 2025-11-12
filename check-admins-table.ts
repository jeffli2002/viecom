#!/usr/bin/env tsx
/**
 * Check if admins table exists and show its contents
 * 
 * Usage: pnpm tsx check-admins-table.ts
 */

import { db } from './src/server/db/index.js';
import { admins } from './src/server/db/schema.js';
import { sql } from 'drizzle-orm';

async function checkAdminsTable() {
  console.log('🔍 Checking admins table...\n');
  console.log('='.repeat(60));

  try {
    // Check if table exists
    console.log('\n📋 Step 1: Checking if admins table exists...');
    
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admins'
      ) as exists;
    `);
    
    const tableExists = tableCheck.rows[0]?.exists;
    
    if (!tableExists) {
      console.log('❌ admins table does NOT exist!\n');
      console.log('💡 Solution: Run database migration:');
      console.log('   pnpm db:generate');
      console.log('   pnpm db:migrate\n');
      process.exit(1);
    }
    
    console.log('✅ admins table exists!\n');

    // Get table structure
    console.log('📊 Step 2: Checking table structure...');
    const structure = await db.execute(sql`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'admins'
      ORDER BY ordinal_position;
    `);

    console.log('\nTable columns:');
    structure.rows.forEach((col: any) => {
      console.log(`  - ${col.column_name} (${col.data_type})${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
    });

    // Check if any admins exist
    console.log('\n👥 Step 3: Checking for existing admin accounts...');
    
    const adminsList = await db.select().from(admins);
    
    if (adminsList.length === 0) {
      console.log('❌ No admin accounts found!\n');
      console.log('💡 Solution: Create an admin account:');
      console.log('   pnpm tsx src/scripts/create-admin.ts\n');
      console.log('   Or run: node quick-fix-admin.cjs\n');
      console.log('='.repeat(60));
      process.exit(1);
    }

    console.log(`✅ Found ${adminsList.length} admin account(s):\n`);
    
    adminsList.forEach((admin, index) => {
      console.log(`${index + 1}. Admin Account:`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.name || 'N/A'}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Created: ${admin.createdAt}`);
      console.log(`   Last Login: ${admin.lastLoginAt || 'Never'}`);
      console.log('');
    });

    console.log('='.repeat(60));
    console.log('✅ ALL CHECKS PASSED!');
    console.log('\n🔗 You can now login at: https://www.viecom.pro/admin/login');
    console.log('📧 Email: ' + adminsList[0].email);
    console.log('🔒 Password: (the one you set when creating the admin)');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error checking admins table:', error);
    console.error('\nPossible causes:');
    console.error('  1. Database connection failed (check DATABASE_URL)');
    console.error('  2. Table does not exist (run migrations)');
    console.error('  3. Wrong database credentials\n');
    process.exit(1);
  }
}

// Run the check
checkAdminsTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

