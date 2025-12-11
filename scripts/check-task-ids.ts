import { resolve } from 'node:path';
import { config } from 'dotenv';
import { desc, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { creditTransactions, generatedAsset } from '../src/server/db/schema';

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

const taskIds = ['a95feb1376def26a852d48745e2f15ed', 'addc39709b0b6dd856b6d6833f3fb228'];

async function checkTaskIds() {
  try {
    console.log('Checking task IDs...\n');
    console.log('Task IDs to check:');
    taskIds.forEach((id, index) => {
      console.log(`  ${index + 1}. ${id}`);
    });
    console.log('');

    // Search for assets with these task IDs in metadata
    // Task ID is stored in metadata.taskId
    // Check both completed and failed status
    const allAssets = await db
      .select({
        id: generatedAsset.id,
        userId: generatedAsset.userId,
        publicUrl: generatedAsset.publicUrl,
        assetType: generatedAsset.assetType,
        createdAt: generatedAsset.createdAt,
        prompt: generatedAsset.prompt,
        status: generatedAsset.status,
        errorMessage: generatedAsset.errorMessage,
        metadata: generatedAsset.metadata,
      })
      .from(generatedAsset);

    const foundAssets: Array<{
      id: string;
      userId: string;
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
      // Continue to check credit transactions even if no assets found
    }

    // Group by userId
    const userGroups = new Map<string, typeof foundAssets>();
    for (const asset of foundAssets) {
      if (!userGroups.has(asset.userId)) {
        userGroups.set(asset.userId, []);
      }
      userGroups.get(asset.userId)?.push(asset);
    }

    console.log(`Total unique users: ${userGroups.size}\n`);

    if (userGroups.size === 1) {
      const userId = Array.from(userGroups.keys())[0];
      const userAssets = userId ? (userGroups.get(userId) ?? []) : [];
      console.log('✅ ALL TASK IDs ARE FROM THE SAME USER');
      console.log(`\nUser ID: ${userId}`);
      console.log(`Assets found: ${userAssets.length}/${taskIds.length}\n`);

      console.log('Asset details:');
      userAssets.forEach((asset, index) => {
        console.log(`\n${index + 1}. Task ID: ${asset.taskId}`);
        console.log(`   Asset ID: ${asset.id}`);
        console.log(`   Type: ${asset.assetType}`);
        console.log(`   Status: ${asset.status}`);
        console.log(`   Created: ${asset.createdAt.toISOString()}`);
        console.log(`   URL: ${asset.publicUrl || 'N/A'}`);
        console.log(`   Prompt: ${asset.prompt?.substring(0, 60)}...`);
        if (asset.errorMessage) {
          console.log(`   ❌ Error: ${asset.errorMessage}`);
        }
      });
    } else {
      console.log('❌ TASK IDs ARE FROM DIFFERENT USERS\n');

      userGroups.forEach((userAssets, userId) => {
        console.log(`\nUser ID: ${userId}`);
        console.log(`Assets: ${userAssets.length}`);
        userAssets.forEach((asset, index) => {
          console.log(`  ${index + 1}. Task ID: ${asset.taskId}`);
          console.log(`     Type: ${asset.assetType}, Status: ${asset.status}`);
          console.log(`     Created: ${asset.createdAt.toISOString()}`);
          if (asset.errorMessage) {
            console.log(`     ❌ Error: ${asset.errorMessage}`);
          }
        });
      });
    }

    // Also check credit transactions for task IDs
    console.log(`\n${'='.repeat(80)}`);
    console.log('Checking credit transactions for task IDs...');
    console.log('='.repeat(80));

    const allTransactions = await db
      .select({
        id: creditTransactions.id,
        userId: creditTransactions.userId,
        amount: creditTransactions.amount,
        source: creditTransactions.source,
        description: creditTransactions.description,
        metadata: creditTransactions.metadata,
        createdAt: creditTransactions.createdAt,
      })
      .from(creditTransactions)
      .where(eq(creditTransactions.source, 'api_call'));

    const foundInTransactions: Array<{
      taskId: string;
      userId: string;
      amount: number;
      createdAt: Date;
      description: string | null;
    }> = [];

    for (const transaction of allTransactions) {
      if (transaction.metadata) {
        try {
          const metadata =
            typeof transaction.metadata === 'string'
              ? JSON.parse(transaction.metadata)
              : transaction.metadata;

          if (metadata && typeof metadata === 'object') {
            const taskId = metadata.taskId;
            if (typeof taskId === 'string' && taskIds.includes(taskId)) {
              foundInTransactions.push({
                taskId: taskId,
                userId: transaction.userId,
                amount: transaction.amount,
                createdAt: transaction.createdAt,
                description: transaction.description,
              });
            }
          }
        } catch (_error) {
          // Skip invalid JSON
        }
      }
    }

    if (foundInTransactions.length > 0) {
      console.log(`\n✅ Found ${foundInTransactions.length} task IDs in credit transactions:\n`);

      const transactionUserGroups = new Map<string, typeof foundInTransactions>();
      for (const trans of foundInTransactions) {
        if (!transactionUserGroups.has(trans.userId)) {
          transactionUserGroups.set(trans.userId, []);
        }
        transactionUserGroups.get(trans.userId)?.push(trans);
      }

      transactionUserGroups.forEach((transactions, userId) => {
        console.log(`\nUser ID: ${userId}`);
        console.log(`Transactions: ${transactions.length}`);
        transactions.forEach((trans, index) => {
          console.log(`  ${index + 1}. Task ID: ${trans.taskId}`);
          console.log(`     Credits: ${trans.amount}, Created: ${trans.createdAt.toISOString()}`);
          console.log(`     Description: ${trans.description || 'N/A'}`);
        });
      });
    } else {
      console.log('\n❌ No task IDs found in credit transactions.');
    }

    // Combine results
    const allFoundTaskIds = new Set([
      ...foundAssets.map((a) => a.taskId),
      ...foundInTransactions.map((t) => t.taskId),
    ]);

    const allUserIds = new Set([
      ...foundAssets.map((a) => a.userId),
      ...foundInTransactions.map((t) => t.userId),
    ]);

    console.log(`\n${'='.repeat(80)}`);
    console.log('COMBINED RESULTS:');
    console.log('='.repeat(80));
    console.log(`\nTotal found: ${allFoundTaskIds.size}/${taskIds.length}`);
    console.log(`Total unique users: ${allUserIds.size}`);

    if (allFoundTaskIds.size > 0) {
      if (allUserIds.size === 1) {
        const userId = Array.from(allUserIds)[0];
        if (userId) {
          console.log(`\n✅ ALL FOUND TASK IDs ARE FROM THE SAME USER: ${userId}`);
        }
      } else {
        console.log('\n❌ TASK IDs ARE FROM DIFFERENT USERS');
        allUserIds.forEach((userId) => {
          const assetCount = foundAssets.filter((a) => a.userId === userId).length;
          const transCount = foundInTransactions.filter((t) => t.userId === userId).length;
          console.log(`  User ${userId}: ${assetCount} assets, ${transCount} transactions`);
        });
      }
    }

    // Show missing task IDs (use already declared allFoundTaskIds from line 226)
    const missingTaskIds = taskIds.filter((id) => !allFoundTaskIds.has(id));

    if (missingTaskIds.length > 0) {
      console.log(`\n${'='.repeat(80)}`);
      console.log('MISSING TASK IDs (not found in database):');
      console.log('='.repeat(80));
      missingTaskIds.forEach((id, index) => {
        console.log(`${index + 1}. ${id}`);
      });
    }

    console.log(`\n${'='.repeat(80)}`);
  } catch (error) {
    console.error('Error checking task IDs:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

checkTaskIds();
