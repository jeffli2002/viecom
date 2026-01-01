/**
 * Check the most recently authenticated user's generated assets and failures.
 *
 * Usage: pnpm tsx scripts/check-latest-user-assets.ts
 */

import { resolve } from 'node:path';
import { config } from 'dotenv';
import { and, desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { batchGenerationJob, generatedAsset, session, user } from '../src/server/db/schema';

// Load .env.local first (do not print secrets)
config({ path: resolve(process.cwd(), '.env.local') });
// Avoid importing env.ts validation paths in scripts
process.env.SKIP_ENV_VALIDATION = 'true';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Please populate .env.local');
  process.exit(1);
}

async function main() {
  console.log('=== Checking latest authenticated user asset activity ===');

  const client = postgres(databaseUrl);
  const db = drizzle(client);

  try {
    // Find the most recent session
    const latestSessions = await db
      .select({
        id: session.id,
        userId: session.userId,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      })
      .from(session)
      .orderBy(desc(session.updatedAt))
      .limit(1);

    if (latestSessions.length === 0) {
      console.log('\nNo sessions found. Cannot determine the latest authenticated user.');
      return;
    }

    const latest = latestSessions[0];

    // Get user details
    const users = await db
      .select({ id: user.id, email: user.email, name: user.name, createdAt: user.createdAt })
      .from(user)
      .where(eq(user.id, latest.userId))
      .limit(1);

    const u = users[0];
    console.log(`\nLatest session user:`);
    console.log(`- User ID: ${latest.userId}`);
    console.log(`- Email: ${u?.email || 'N/A'}`);
    console.log(`- Name: ${u?.name || 'N/A'}`);
    console.log(`- Session updatedAt: ${latest.updatedAt.toISOString()}`);
    if (latest.ipAddress) console.log(`- IP: ${latest.ipAddress}`);
    if (latest.userAgent) console.log(`- UA: ${latest.userAgent}`);

    // Query recent assets for this user
    const assets = await db
      .select({
        id: generatedAsset.id,
        assetType: generatedAsset.assetType,
        status: generatedAsset.status,
        publicUrl: generatedAsset.publicUrl,
        errorMessage: generatedAsset.errorMessage,
        createdAt: generatedAsset.createdAt,
      })
      .from(generatedAsset)
      .where(eq(generatedAsset.userId, latest.userId))
      .orderBy(desc(generatedAsset.createdAt))
      .limit(50);

    const total = assets.length;
    const images = assets.filter((a) => a.assetType === 'image');
    const videos = assets.filter((a) => a.assetType === 'video');
    const completed = assets.filter((a) => a.status === 'completed');
    const failed = assets.filter((a) => a.status === 'failed');

    console.log('\nAsset summary (latest 50):');
    console.log(`- Total: ${total}`);
    console.log(`- Images: ${images.length} (completed: ${images.filter((a) => a.status === 'completed').length}, failed: ${images.filter((a) => a.status === 'failed').length})`);
    console.log(`- Videos: ${videos.length} (completed: ${videos.filter((a) => a.status === 'completed').length}, failed: ${videos.filter((a) => a.status === 'failed').length})`);

    if (total === 0) {
      console.log('\nNo generated assets for this user.');
    } else {
      console.log('\nMost recent assets:');
      assets.slice(0, 10).forEach((a, i) => {
        console.log(`  ${i + 1}. [${a.assetType}] ${a.status} @ ${a.createdAt.toISOString()}`);
        if (a.publicUrl) console.log(`     URL: ${a.publicUrl}`);
        if (a.status === 'failed' && a.errorMessage) console.log(`     Error: ${a.errorMessage}`);
      });
    }

    // Show any failed items with errors
    if (failed.length > 0) {
      console.log('\nFailure details:');
      failed.slice(0, 10).forEach((f, i) => {
        console.log(`  ${i + 1}. [${f.assetType}] ${f.createdAt.toISOString()}`);
        console.log(`     Error: ${f.errorMessage || 'N/A'}`);
      });
    }

    // Check batch job failures for the user
    const failedJobs = await db
      .select({
        id: batchGenerationJob.id,
        status: batchGenerationJob.status,
        errorReport: batchGenerationJob.errorReport,
        createdAt: batchGenerationJob.createdAt,
        completedAt: batchGenerationJob.completedAt,
      })
      .from(batchGenerationJob)
      .where(and(eq(batchGenerationJob.userId, latest.userId), eq(batchGenerationJob.status, 'failed')))
      .orderBy(desc(batchGenerationJob.createdAt))
      .limit(5);

    if (failedJobs.length > 0) {
      console.log('\nFailed batch jobs:');
      failedJobs.forEach((job, i) => {
        console.log(`  ${i + 1}. Job ${job.id} created ${job.createdAt.toISOString()}`);
        console.log(`     Status: ${job.status} CompletedAt: ${job.completedAt?.toISOString() || 'N/A'}`);
        if (job.errorReport) console.log(`     Error report: ${job.errorReport}`);
      });
    }

    console.log('\n=== Done ===');
  } catch (error) {
    console.error('Error:', error);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch { /* ignore */ }
  }
}

main();

