import { resolve } from 'node:path';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { generatedAsset, user } from '../src/server/db/schema';
import { eq, sql } from 'drizzle-orm';

// Load .env.local file FIRST
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Please check your .env.local file.');
  process.exit(1);
}

// Create database connection directly
const client = postgres(databaseUrl);
const db = drizzle(client);

const taskIds = [
  '4e1de0e2442ea7190aa196148834d0be',
  '5a0d054faafdf3c99bca745d2dd5f1ac',
];

async function checkTaskIds() {
  try {
    console.log('Checking task IDs...\n');
    console.log('Task IDs to check:');
    taskIds.forEach((id, index) => {
      console.log(`  ${index + 1}. ${id}`);
    });
    console.log('');

    // Search for assets with these task IDs in metadata
    // Join with user table to get email
    const allAssets = await db
      .select({
        id: generatedAsset.id,
        userId: generatedAsset.userId,
        userEmail: user.email,
        userName: user.name,
        publicUrl: generatedAsset.publicUrl,
        assetType: generatedAsset.assetType,
        createdAt: generatedAsset.createdAt,
        prompt: generatedAsset.prompt,
        status: generatedAsset.status,
        errorMessage: generatedAsset.errorMessage,
        metadata: generatedAsset.metadata,
      })
      .from(generatedAsset)
      .leftJoin(user, eq(generatedAsset.userId, user.id));

    const foundAssets: Array<{
      id: string;
      userId: string;
      userEmail: string | null;
      userName: string | null;
      publicUrl: string | null;
      assetType: string;
      createdAt: Date;
      prompt: string;
      status: string;
      taskId: string;
      errorMessage: string | null;
    }> = [];

    // Check each asset's metadata for task IDs
    for (const asset of allAssets) {
      if (asset.metadata && typeof asset.metadata === 'object') {
        const metadata = asset.metadata as Record<string, unknown>;
        const taskId = metadata.taskId;

        if (typeof taskId === 'string' && taskIds.includes(taskId)) {
          foundAssets.push({
            id: asset.id,
            userId: asset.userId,
            userEmail: asset.userEmail,
            userName: asset.userName,
            publicUrl: asset.publicUrl,
            assetType: asset.assetType,
            createdAt: asset.createdAt,
            prompt: asset.prompt,
            status: asset.status,
            taskId: taskId,
            errorMessage: asset.errorMessage,
          });
        }
      }
    }

    console.log('='.repeat(80));
    console.log('RESULTS:');
    console.log('='.repeat(80));
    console.log(`\nFound ${foundAssets.length} out of ${taskIds.length} task IDs in database\n`);

    if (foundAssets.length === 0) {
      console.log('❌ No assets found with these task IDs.');
      console.log('\nThis could mean:');
      console.log('1. The task IDs are not stored in the database');
      console.log('2. The assets were generated in test mode');
      console.log('3. The task IDs are stored in a different format');
      process.exit(0);
    }

    // Display results
    foundAssets.forEach((asset, index) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Task ${index + 1}: ${asset.taskId}`);
      console.log('='.repeat(80));
      console.log(`✅ Status: ${asset.status.toUpperCase()}`);
      console.log(`📧 User Email: ${asset.userEmail || 'N/A'}`);
      console.log(`👤 User Name: ${asset.userName || 'N/A'}`);
      console.log(`🆔 User ID: ${asset.userId}`);
      console.log(`📦 Asset ID: ${asset.id}`);
      console.log(`🎨 Asset Type: ${asset.assetType}`);
      console.log(`📅 Created: ${asset.createdAt.toISOString()}`);
      console.log(`🔗 Public URL: ${asset.publicUrl || 'N/A'}`);
      console.log(`💬 Prompt: ${asset.prompt?.substring(0, 100)}${asset.prompt && asset.prompt.length > 100 ? '...' : ''}`);
      
      if (asset.errorMessage) {
        console.log(`❌ Error: ${asset.errorMessage}`);
      }
      
      if (asset.status === 'completed') {
        console.log(`\n✅ Generation was SUCCESSFUL`);
      } else if (asset.status === 'failed') {
        console.log(`\n❌ Generation FAILED`);
      } else {
        console.log(`\n⏳ Generation is still PROCESSING`);
      }
    });

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY:');
    console.log('='.repeat(80));
    
    const successful = foundAssets.filter(a => a.status === 'completed').length;
    const failed = foundAssets.filter(a => a.status === 'failed').length;
    const processing = foundAssets.filter(a => a.status === 'processing').length;
    
    console.log(`\nTotal found: ${foundAssets.length}/${taskIds.length}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏳ Processing: ${processing}`);
    
    // Group by user
    const userGroups = new Map<string, typeof foundAssets>();
    for (const asset of foundAssets) {
      if (!userGroups.has(asset.userId)) {
        userGroups.set(asset.userId, []);
      }
      userGroups.get(asset.userId)!.push(asset);
    }
    
    console.log(`\nUnique users: ${userGroups.size}`);
    userGroups.forEach((assets, userId) => {
      const firstAsset = assets[0]!;
      console.log(`\n  User: ${firstAsset.userEmail || 'N/A'} (${userId})`);
      console.log(`  Tasks: ${assets.map(a => a.taskId).join(', ')}`);
    });

    console.log('\n' + '='.repeat(80));
  } catch (error) {
    console.error('Error checking task IDs:', error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

checkTaskIds();

