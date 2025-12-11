/**
 * Manual Test Script: Video Generation Complete Flow
 *
 * This script helps test the complete video generation flow
 * Run with: pnpm tsx scripts/test-video-generation-flow.ts
 */

import { resolve } from 'node:path';
import { config } from 'dotenv';
import { and, desc, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { creditTransactions, generatedAsset, userCredits } from '../src/server/db/schema';

// Load .env.local file FIRST
config({ path: resolve(process.cwd(), '.env.local') });

// Set SKIP_ENV_VALIDATION to avoid env.ts validation when importing modules
process.env.SKIP_ENV_VALIDATION = 'true';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Please check your .env.local file.');
  process.exit(1);
}

// Create database connection directly
const client = postgres(databaseUrl);
const db = drizzle(client);

interface TestResult {
  taskId: string;
  userId: string;
  videoUrl: string | null;
  assetId: string | null;
  status: string;
  creditsSpent: number;
  creditTransactionId: string | null;
  createdAt: Date;
  hasCreditTransaction: boolean;
  hasAssetRecord: boolean;
}

async function testVideoGenerationFlow(userId: string, taskId?: string) {
  console.log('='.repeat(80));
  console.log('Video Generation Flow Test');
  console.log('='.repeat(80));
  console.log(`\nTesting user: ${userId}`);
  if (taskId) {
    console.log(`Testing task ID: ${taskId}\n`);
  } else {
    console.log('Testing recent video generations\n');
  }

  try {
    // Get recent video assets for this user
    let assets: Array<typeof generatedAsset.$inferSelect> = [];
    if (taskId) {
      assets = await db
        .select()
        .from(generatedAsset)
        .where(
          and(
            eq(generatedAsset.userId, userId),
            sql`${generatedAsset.metadata}->>'taskId' = ${taskId}`
          )
        )
        .orderBy(desc(generatedAsset.createdAt));
    } else {
      assets = await db
        .select()
        .from(generatedAsset)
        .where(and(eq(generatedAsset.userId, userId), eq(generatedAsset.assetType, 'video')))
        .orderBy(desc(generatedAsset.createdAt))
        .limit(10);
    }

    if (assets.length === 0) {
      console.log('❌ No video assets found for this user.');
      return;
    }

    console.log(`Found ${assets.length} video asset(s)\n`);

    const results: TestResult[] = [];

    for (const asset of assets) {
      const metadata =
        asset.metadata && typeof asset.metadata === 'object'
          ? (asset.metadata as Record<string, unknown>)
          : {};
      const assetTaskId = metadata.taskId as string | undefined;

      if (!assetTaskId) {
        console.log(`⚠️  Asset ${asset.id} has no taskId in metadata`);
        continue;
      }

      // Check for credit transaction
      const transactions = await db
        .select()
        .from(creditTransactions)
        .where(
          and(
            eq(creditTransactions.userId, userId),
            eq(creditTransactions.source, 'api_call'),
            sql`${creditTransactions.metadata}->>'taskId' = ${assetTaskId}`
          )
        )
        .orderBy(desc(creditTransactions.createdAt))
        .limit(1);

      const hasCreditTransaction = transactions.length > 0;
      const creditTransaction = transactions[0] || null;

      const result: TestResult = {
        taskId: assetTaskId,
        userId: asset.userId,
        videoUrl: asset.publicUrl,
        assetId: asset.id,
        status: asset.status,
        creditsSpent: asset.creditsSpent,
        creditTransactionId: creditTransaction?.id || null,
        createdAt: asset.createdAt,
        hasCreditTransaction,
        hasAssetRecord: true,
      };

      results.push(result);
    }

    // Display results
    console.log('='.repeat(80));
    console.log('Test Results:');
    console.log('='.repeat(80));

    let allPassed = true;

    for (const result of results) {
      console.log(`\n📹 Task ID: ${result.taskId}`);
      console.log(`   Asset ID: ${result.assetId}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Video URL: ${result.videoUrl || 'N/A'}`);
      console.log(`   Credits Spent: ${result.creditsSpent}`);
      console.log(`   Created: ${result.createdAt.toISOString()}`);

      // Check 1: Asset record exists
      if (result.hasAssetRecord) {
        console.log('   ✅ Asset record exists');
      } else {
        console.log('   ❌ Asset record missing');
        allPassed = false;
      }

      // Check 2: Credit transaction exists
      if (result.hasCreditTransaction) {
        console.log(`   ✅ Credit transaction exists (ID: ${result.creditTransactionId})`);
      } else {
        console.log('   ❌ Credit transaction missing');
        allPassed = false;
      }

      // Check 3: Status is completed
      if (result.status === 'completed') {
        console.log('   ✅ Status is completed');
      } else {
        console.log(`   ⚠️  Status is ${result.status}`);
        if (result.status === 'failed') {
          allPassed = false;
        }
      }

      // Check 4: Video URL exists
      if (result.videoUrl?.startsWith('http')) {
        console.log('   ✅ Video URL is valid');
      } else {
        console.log('   ❌ Video URL is missing or invalid');
        allPassed = false;
      }

      // Check 5: Credits match
      if (result.hasCreditTransaction && result.creditTransactionId) {
        const transaction = await db
          .select()
          .from(creditTransactions)
          .where(eq(creditTransactions.id, result.creditTransactionId))
          .limit(1);

        if (transaction.length > 0) {
          const tx = transaction[0];
          if (tx.amount === result.creditsSpent) {
            console.log(`   ✅ Credits match (${tx.amount})`);
          } else {
            console.log(
              `   ⚠️  Credits mismatch: asset=${result.creditsSpent}, transaction=${tx.amount}`
            );
          }
        }
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    if (allPassed) {
      console.log('✅ All checks passed!');
    } else {
      console.log('❌ Some checks failed. Please review the results above.');
    }
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const userId = args[0];
const taskId = args[1];

if (!userId) {
  console.error('Usage: pnpm tsx scripts/test-video-generation-flow.ts <userId> [taskId]');
  console.error(
    'Example: pnpm tsx scripts/test-video-generation-flow.ts 2YmBeot0u8jbw1CU0P7dRdDtQDXw4CIY'
  );
  process.exit(1);
}

testVideoGenerationFlow(userId, taskId);
