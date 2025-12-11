import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { join } from 'node:path';
import { config } from 'dotenv';
import { eq, or, sql } from 'drizzle-orm';
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

const taskIds = [
  '03a5b262638731b262b2aa59fd1b4460',
  '16d9859f182c32b18d7123bb6696365a',
  'd90e5331f2abe5b6452ed742c604e4c0',
  '0b0a18bb0b960ba696529a801e7a08d1',
];

async function checkFailedTasks() {
  try {
    console.log('Checking for failed tasks in database and logs...\n');
    console.log('Task IDs to check:');
    taskIds.forEach((id, index) => {
      console.log(`  ${index + 1}. ${id}`);
    });
    console.log('');

    // Check database for failed assets with these task IDs
    const allAssets = await db
      .select({
        id: generatedAsset.id,
        userId: generatedAsset.userId,
        publicUrl: generatedAsset.publicUrl,
        assetType: generatedAsset.assetType,
        status: generatedAsset.status,
        errorMessage: generatedAsset.errorMessage,
        createdAt: generatedAsset.createdAt,
        metadata: generatedAsset.metadata,
      })
      .from(generatedAsset)
      .where(or(eq(generatedAsset.status, 'failed'), eq(generatedAsset.status, 'processing')));

    const foundFailedAssets: Array<{
      taskId: string;
      userId: string;
      status: string;
      errorMessage: string | null;
      createdAt: Date;
    }> = [];

    for (const asset of allAssets) {
      if (asset.metadata && typeof asset.metadata === 'object') {
        const metadata = asset.metadata as Record<string, unknown>;
        const taskId = metadata.taskId;

        if (typeof taskId === 'string' && taskIds.includes(taskId)) {
          foundFailedAssets.push({
            taskId: taskId,
            userId: asset.userId,
            status: asset.status,
            errorMessage: asset.errorMessage,
            createdAt: asset.createdAt,
          });
        }
      }
    }

    console.log('='.repeat(80));
    console.log('DATABASE CHECK:');
    console.log('='.repeat(80));

    if (foundFailedAssets.length > 0) {
      console.log(
        `\nFound ${foundFailedAssets.length} failed/processing assets with these task IDs:\n`
      );
      foundFailedAssets.forEach((asset, index) => {
        console.log(`${index + 1}. Task ID: ${asset.taskId}`);
        console.log(`   User ID: ${asset.userId}`);
        console.log(`   Status: ${asset.status}`);
        console.log(`   Created: ${asset.createdAt.toISOString()}`);
        if (asset.errorMessage) {
          console.log(`   ❌ Error: ${asset.errorMessage}`);
        }
      });
    } else {
      console.log('\n❌ No failed/processing assets found in database with these task IDs.');
    }

    // Check credit transactions for these task IDs
    console.log(`\n${'='.repeat(80)}`);
    console.log('CREDIT TRANSACTIONS CHECK:');
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

    const foundTransactions: Array<{
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
              foundTransactions.push({
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

    if (foundTransactions.length > 0) {
      console.log(
        `\n✅ Found ${foundTransactions.length} credit transactions with these task IDs:\n`
      );
      foundTransactions.forEach((trans, index) => {
        console.log(`${index + 1}. Task ID: ${trans.taskId}`);
        console.log(`   User ID: ${trans.userId}`);
        console.log(`   Credits: ${trans.amount}`);
        console.log(`   Created: ${trans.createdAt.toISOString()}`);
        console.log(`   Description: ${trans.description || 'N/A'}`);
      });
    } else {
      console.log('\n❌ No credit transactions found with these task IDs.');
    }

    // Check log files
    console.log(`\n${'='.repeat(80)}`);
    console.log('LOG FILE CHECK:');
    console.log('='.repeat(80));

    const logFiles = ['dev.log'];
    let foundInLogs = false;

    for (const logFile of logFiles) {
      const logPath = join(process.cwd(), logFile);
      try {
        const logContent = readFileSync(logPath, 'utf-8');

        for (const taskId of taskIds) {
          const lines = logContent.split('\n');
          const matchingLines: string[] = [];

          lines.forEach((line, index) => {
            if (line.includes(taskId)) {
              // Get context (5 lines before and after)
              const start = Math.max(0, index - 5);
              const end = Math.min(lines.length, index + 6);
              const context = lines.slice(start, end).join('\n');
              matchingLines.push(`\n--- Line ${index + 1} ---\n${context}`);
            }
          });

          if (matchingLines.length > 0) {
            foundInLogs = true;
            console.log(`\n✅ Found task ID ${taskId} in ${logFile}:`);
            matchingLines.forEach((match) => {
              console.log(match);
            });
          }
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.log(`\n⚠️  Error reading ${logFile}:`, error);
        }
      }
    }

    if (!foundInLogs) {
      console.log('\n❌ No task IDs found in log files.');
    }

    // Summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('SUMMARY:');
    console.log('='.repeat(80));

    const foundTaskIds = new Set([
      ...foundFailedAssets.map((a) => a.taskId),
      ...foundTransactions.map((t) => t.taskId),
    ]);

    const missingTaskIds = taskIds.filter((id) => !foundTaskIds.has(id));

    console.log(`\nFound in database (assets): ${foundFailedAssets.length}/${taskIds.length}`);
    console.log(`Found in credit transactions: ${foundTransactions.length}/${taskIds.length}`);
    console.log(`Total found: ${foundTaskIds.size}/${taskIds.length}`);
    console.log(`Missing from database: ${missingTaskIds.length}/${taskIds.length}`);

    if (missingTaskIds.length > 0) {
      console.log('\nMissing task IDs:');
      missingTaskIds.forEach((id, index) => {
        console.log(`  ${index + 1}. ${id}`);
      });

      // Check if missing task IDs have credit transactions but no assets
      const missingWithCredits = missingTaskIds.filter((id) =>
        foundTransactions.some((t) => t.taskId === id)
      );

      if (missingWithCredits.length > 0) {
        console.log('\n⚠️  CRITICAL: These task IDs have credit transactions but NO asset records:');
        missingWithCredits.forEach((id, index) => {
          const trans = foundTransactions.find((t) => t.taskId === id);
          console.log(`  ${index + 1}. ${id}`);
          console.log(`     Credits deducted: ${trans?.amount}`);
          console.log(`     Transaction time: ${trans?.createdAt.toISOString()}`);
        });
        console.log(
          '\n💡 This suggests the video generation succeeded but failed to save to database!'
        );
        console.log('   Possible causes:');
        console.log('   1. Database save error (caught and logged but not thrown)');
        console.log('   2. Network issue during save');
        console.log('   3. Database connection timeout');
      } else {
        console.log('\n⚠️  These task IDs are not in our database, which suggests:');
        console.log('   1. They may have failed before being saved to the database');
        console.log('   2. They may have been generated in test mode');
        console.log('   3. There may have been an error during the save process');
      }
    }

    console.log(`\n${'='.repeat(80)}`);
  } catch (error) {
    console.error('Error checking failed tasks:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

checkFailedTasks();
