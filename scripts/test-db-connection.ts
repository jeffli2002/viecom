import { resolve } from 'node:path';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Load .env.local file FIRST
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Please check your .env.local file.');
  process.exit(1);
}

async function testConnection() {
  console.log('=== Starting Database Connection Test ===');
  console.log('Database URL present:', databaseUrl ? 'Yes' : 'No');
  console.log('Database URL length:', databaseUrl?.length || 0);
  
  const client = postgres(databaseUrl);
  
  try {
    console.log('\nAttempting database connection...');
    process.stdout.write('Connecting');
    
    const result = await client`SELECT 1 as test`;
    console.log('\n✓ Database connection successful');
    console.log('Test query result:', JSON.stringify(result));
    
    // Test query for assets count
    console.log('\nQuerying assets table...');
    const countResult = await client`SELECT COUNT(*)::int as count FROM generated_asset`;
    console.log('Total assets in database:', countResult[0]?.count || 0);
    
    console.log('\nClosing connection...');
    await client.end();
    console.log('✓ Connection closed successfully');
    console.log('\n=== Test Completed ===');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Database connection failed!');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    try {
      await client.end();
    } catch (_e) {
      // Ignore cleanup errors
    }
    process.exit(1);
  }
}

console.log('Script starting...');
testConnection().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

