/**
 * Check users' signup credits and image/video generation failures
 * Usage: pnpm tsx scripts/check-users-signup-and-failures.ts
 */

import { resolve } from 'node:path';
import { config } from 'dotenv';

// Load .env.local file FIRST
config({ path: resolve(process.cwd(), '.env.local') });

// Set SKIP_ENV_VALIDATION to avoid env.ts validation when importing modules
process.env.SKIP_ENV_VALIDATION = 'true';

let databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Please check your .env.local file.');
  process.exit(1);
}

// Remove surrounding quotes if present
databaseUrl = databaseUrl.replace(/^["']|["']$/g, '');

if (!databaseUrl) {
  console.error('DATABASE_URL is empty after removing quotes.');
  process.exit(1);
}

import { creditTransactions, user, userCredits, generatedAsset } from '@/server/db/schema';
import { neon } from '@neondatabase/serverless';
import { and, eq, inArray, or, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

const sqlClient = neon(databaseUrl);
const db = drizzle(sqlClient);

const targetEmails = [
  'vivianborges454@gmail.com',
  'mdabbas00440044@gmail.com',
  'dd7107679@gmail.com',
  'msufyansajid286@gmail.com',
  'bokhyu@gmail.com',
  'jefflee2002@gmail.com',
];

async function checkUsersSignupAndFailures() {
  try {
    console.log(`\n🔍 Checking signup credits and generation failures for ${targetEmails.length} users...\n`);
    console.log('='.repeat(100));

    // Step 1: Find all users by emails (case-insensitive)
    const lowerEmails = targetEmails.map((e) => e.toLowerCase());
    const userRecords = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        banned: user.banned,
      })
      .from(user)
      .where(
        sql`lower(${user.email}) IN (${sql.join(
          lowerEmails.map((email) => sql`${email}`),
          sql`, `
        )})`
      );

    if (userRecords.length === 0) {
      console.log('❌ No users found with the provided emails');
      return;
    }

    console.log(`\n✅ Found ${userRecords.length} users:\n`);

    for (const userRecord of userRecords) {
      console.log(`\n${'='.repeat(100)}`);
      console.log(`📧 User: ${userRecord.email}`);
      console.log(`   ID: ${userRecord.id}`);
      console.log(`   Name: ${userRecord.name || 'N/A'}`);
      console.log(`   Created: ${userRecord.createdAt}`);
      console.log(`   Banned: ${userRecord.banned ? 'Yes' : 'No'}`);

      // Step 2: Check credit account
      const [creditAccount] = await db
        .select({
          balance: userCredits.balance,
          totalEarned: userCredits.totalEarned,
          totalSpent: userCredits.totalSpent,
          createdAt: userCredits.createdAt,
        })
        .from(userCredits)
        .where(eq(userCredits.userId, userRecord.id))
        .limit(1);

      if (!creditAccount) {
        console.log('\n⚠️  No credit account found for this user');
      } else {
        console.log('\n💰 Credit Account:');
        console.log(`   Balance: ${creditAccount.balance}`);
        console.log(`   Total Earned: ${creditAccount.totalEarned}`);
        console.log(`   Total Spent: ${creditAccount.totalSpent}`);
        console.log(`   Account Created: ${creditAccount.createdAt}`);
      }

      // Step 3: Check for signup bonus transaction
      const signupReferenceId = `signup_${userRecord.id}`;
      const signupTransactions = await db
        .select({
          id: creditTransactions.id,
          amount: creditTransactions.amount,
          source: creditTransactions.source,
          description: creditTransactions.description,
          referenceId: creditTransactions.referenceId,
          createdAt: creditTransactions.createdAt,
        })
        .from(creditTransactions)
        .where(
          and(
            eq(creditTransactions.userId, userRecord.id),
            or(
              eq(creditTransactions.referenceId, signupReferenceId),
              sql`${creditTransactions.referenceId}::text LIKE 'signup_%'`,
              and(
                eq(creditTransactions.source, 'bonus'),
                sql`${creditTransactions.description}::text ILIKE '%sign%'`
              )
            )
          )
        )
        .orderBy(creditTransactions.createdAt);

      console.log('\n📝 Signup Bonus Credits:');
      if (signupTransactions.length === 0) {
        console.log('   ❌ No signup bonus transaction found!');
        console.log(`   Expected referenceId: ${signupReferenceId}`);
      } else {
        signupTransactions.forEach((tx, index) => {
          console.log(`   ${index + 1}. Amount: ${tx.amount} credits`);
          console.log(`      Source: ${tx.source}`);
          console.log(`      Description: ${tx.description}`);
          console.log(`      Reference ID: ${tx.referenceId}`);
          console.log(`      Created: ${tx.createdAt}`);
        });
      }

      // Step 4: Check for all image generations (to find processing/stuck ones)
      const allImages = await db
        .select({
          id: generatedAsset.id,
          assetType: generatedAsset.assetType,
          status: generatedAsset.status,
          errorMessage: generatedAsset.errorMessage,
          creditsSpent: generatedAsset.creditsSpent,
          createdAt: generatedAsset.createdAt,
        })
        .from(generatedAsset)
        .where(
          and(
            eq(generatedAsset.userId, userRecord.id),
            eq(generatedAsset.assetType, 'image')
          )
        )
        .orderBy(generatedAsset.createdAt);

      const failedImages = allImages.filter((img) => img.status === 'failed');
      const processingImages = allImages.filter((img) => img.status === 'processing');
      const noCreditDeductedImages = allImages.filter((img) => img.creditsSpent === 0 && img.status !== 'completed');

      console.log('\n🖼️  Failed Image Generations:');
      if (failedImages.length === 0) {
        console.log('   ✅ No failed image generations');
      } else {
        console.log(`   ❌ Found ${failedImages.length} failed image generation(s):`);
        failedImages.forEach((img, index) => {
          console.log(`   ${index + 1}. Asset ID: ${img.id}`);
          console.log(`      Created: ${img.createdAt}`);
          console.log(`      Credits Spent: ${img.creditsSpent}`);
          console.log(`      Error: ${img.errorMessage || 'No error message'}`);
        });
      }

      // Step 5: Check for all video generations (to find processing/stuck ones)
      const allVideos = await db
        .select({
          id: generatedAsset.id,
          assetType: generatedAsset.assetType,
          status: generatedAsset.status,
          errorMessage: generatedAsset.errorMessage,
          creditsSpent: generatedAsset.creditsSpent,
          createdAt: generatedAsset.createdAt,
        })
        .from(generatedAsset)
        .where(
          and(
            eq(generatedAsset.userId, userRecord.id),
            eq(generatedAsset.assetType, 'video')
          )
        )
        .orderBy(generatedAsset.createdAt);

      const failedVideos = allVideos.filter((vid) => vid.status === 'failed');
      const processingVideos = allVideos.filter((vid) => vid.status === 'processing');
      const noCreditDeductedVideos = allVideos.filter((vid) => vid.creditsSpent === 0 && vid.status !== 'completed');

      console.log('\n🎬 Failed Video Generations:');
      if (failedVideos.length === 0) {
        console.log('   ✅ No failed video generations');
      } else {
        console.log(`   ❌ Found ${failedVideos.length} failed video generation(s):`);
        failedVideos.forEach((vid, index) => {
          console.log(`   ${index + 1}. Asset ID: ${vid.id}`);
          console.log(`      Created: ${vid.createdAt}`);
          console.log(`      Credits Spent: ${vid.creditsSpent}`);
          console.log(`      Error: ${vid.errorMessage || 'No error message'}`);
        });
      }

      // Check for processing/stuck image generations
      console.log('\n⏳ Processing Image Generations (stuck?):');
      if (processingImages.length === 0) {
        console.log('   ✅ No processing image generations');
      } else {
        console.log(`   ⚠️  Found ${processingImages.length} processing image generation(s) (may be stuck):`);
        processingImages.forEach((img, index) => {
          console.log(`   ${index + 1}. Asset ID: ${img.id}`);
          console.log(`      Created: ${img.createdAt}`);
          console.log(`      Credits Spent: ${img.creditsSpent}`);
          console.log(`      Status: ${img.status}`);
        });
      }

      // Check for processing/stuck video generations
      console.log('\n⏳ Processing Video Generations (stuck?):');
      if (processingVideos.length === 0) {
        console.log('   ✅ No processing video generations');
      } else {
        console.log(`   ⚠️  Found ${processingVideos.length} processing video generation(s) (may be stuck):`);
        processingVideos.forEach((vid, index) => {
          console.log(`   ${index + 1}. Asset ID: ${vid.id}`);
          console.log(`      Created: ${vid.createdAt}`);
          console.log(`      Credits Spent: ${vid.creditsSpent}`);
          console.log(`      Status: ${vid.status}`);
        });
      }

      // Check for attempts without credit deduction
      console.log('\n🔍 Image Generations Without Credit Deduction:');
      if (noCreditDeductedImages.length === 0) {
        console.log('   ✅ No image generations without credit deduction');
      } else {
        console.log(`   ⚠️  Found ${noCreditDeductedImages.length} image generation(s) without credit deduction:`);
        noCreditDeductedImages.forEach((img, index) => {
          console.log(`   ${index + 1}. Asset ID: ${img.id}`);
          console.log(`      Created: ${img.createdAt}`);
          console.log(`      Status: ${img.status}`);
          console.log(`      Credits Spent: ${img.creditsSpent}`);
          console.log(`      Error: ${img.errorMessage || 'No error message'}`);
        });
      }

      console.log('\n🔍 Video Generations Without Credit Deduction:');
      if (noCreditDeductedVideos.length === 0) {
        console.log('   ✅ No video generations without credit deduction');
      } else {
        console.log(`   ⚠️  Found ${noCreditDeductedVideos.length} video generation(s) without credit deduction:`);
        noCreditDeductedVideos.forEach((vid, index) => {
          console.log(`   ${index + 1}. Asset ID: ${vid.id}`);
          console.log(`      Created: ${vid.createdAt}`);
          console.log(`      Status: ${vid.status}`);
          console.log(`      Credits Spent: ${vid.creditsSpent}`);
          console.log(`      Error: ${vid.errorMessage || 'No error message'}`);
        });
      }

      // Step 6: Check for successful image generations
      const successfulImages = await db
        .select({
          id: generatedAsset.id,
          assetType: generatedAsset.assetType,
          status: generatedAsset.status,
          creditsSpent: generatedAsset.creditsSpent,
          createdAt: generatedAsset.createdAt,
        })
        .from(generatedAsset)
        .where(
          and(
            eq(generatedAsset.userId, userRecord.id),
            eq(generatedAsset.assetType, 'image'),
            eq(generatedAsset.status, 'completed')
          )
        )
        .orderBy(generatedAsset.createdAt);

      console.log('\n✅ Successful Image Generations:');
      if (successfulImages.length === 0) {
        console.log('   ⚠️  No successful image generations');
      } else {
        console.log(`   ✅ Found ${successfulImages.length} successful image generation(s)`);
        if (successfulImages.length <= 5) {
          successfulImages.forEach((img, index) => {
            console.log(`   ${index + 1}. Asset ID: ${img.id}`);
            console.log(`      Created: ${img.createdAt}`);
            console.log(`      Credits Spent: ${img.creditsSpent}`);
          });
        } else {
          console.log(`   Showing first 5 of ${successfulImages.length}:`);
          successfulImages.slice(0, 5).forEach((img, index) => {
            console.log(`   ${index + 1}. Asset ID: ${img.id}`);
            console.log(`      Created: ${img.createdAt}`);
            console.log(`      Credits Spent: ${img.creditsSpent}`);
          });
        }
      }

      // Step 7: Check for successful video generations
      const successfulVideos = await db
        .select({
          id: generatedAsset.id,
          assetType: generatedAsset.assetType,
          status: generatedAsset.status,
          creditsSpent: generatedAsset.creditsSpent,
          createdAt: generatedAsset.createdAt,
        })
        .from(generatedAsset)
        .where(
          and(
            eq(generatedAsset.userId, userRecord.id),
            eq(generatedAsset.assetType, 'video'),
            eq(generatedAsset.status, 'completed')
          )
        )
        .orderBy(generatedAsset.createdAt);

      console.log('\n✅ Successful Video Generations:');
      if (successfulVideos.length === 0) {
        console.log('   ⚠️  No successful video generations');
      } else {
        console.log(`   ✅ Found ${successfulVideos.length} successful video generation(s)`);
        if (successfulVideos.length <= 5) {
          successfulVideos.forEach((vid, index) => {
            console.log(`   ${index + 1}. Asset ID: ${vid.id}`);
            console.log(`      Created: ${vid.createdAt}`);
            console.log(`      Credits Spent: ${vid.creditsSpent}`);
          });
        } else {
          console.log(`   Showing first 5 of ${successfulVideos.length}:`);
          successfulVideos.slice(0, 5).forEach((vid, index) => {
            console.log(`   ${index + 1}. Asset ID: ${vid.id}`);
            console.log(`      Created: ${vid.createdAt}`);
            console.log(`      Credits Spent: ${vid.creditsSpent}`);
          });
        }
      }

      // Step 8: Summary
      const totalFailed = failedImages.length + failedVideos.length;
      const totalSuccessful = successfulImages.length + successfulVideos.length;
      const totalProcessing = processingImages.length + processingVideos.length;
      const totalNoCreditDeducted = noCreditDeductedImages.length + noCreditDeductedVideos.length;
      const signupCreditsReceived = signupTransactions.length > 0 ? signupTransactions[0].amount : 0;
      
      console.log('\n📊 Summary:');
      console.log(`   Signup Credits: ${signupCreditsReceived > 0 ? `✅ ${signupCreditsReceived} credits` : '❌ Not received'}`);
      console.log(`   Successful Images: ${successfulImages.length > 0 ? `✅ ${successfulImages.length}` : '⚠️  0'}`);
      console.log(`   Successful Videos: ${successfulVideos.length > 0 ? `✅ ${successfulVideos.length}` : '⚠️  0'}`);
      console.log(`   Failed Images: ${failedImages.length > 0 ? `❌ ${failedImages.length}` : '✅ 0'}`);
      console.log(`   Failed Videos: ${failedVideos.length > 0 ? `❌ ${failedVideos.length}` : '✅ 0'}`);
      console.log(`   Processing Images: ${processingImages.length > 0 ? `⚠️  ${processingImages.length} (stuck?)` : '✅ 0'}`);
      console.log(`   Processing Videos: ${processingVideos.length > 0 ? `⚠️  ${processingVideos.length} (stuck?)` : '✅ 0'}`);
      console.log(`   No Credit Deducted: ${totalNoCreditDeducted > 0 ? `⚠️  ${totalNoCreditDeducted} attempts` : '✅ 0'}`);
      console.log(`   Total Successful: ${totalSuccessful > 0 ? `✅ ${totalSuccessful}` : '⚠️  0'}`);
      console.log(`   Total Failures: ${totalFailed > 0 ? `❌ ${totalFailed}` : '✅ 0'}`);
      console.log(`   Total Processing: ${totalProcessing > 0 ? `⚠️  ${totalProcessing} (may be stuck)` : '✅ 0'}`);
    }

    console.log(`\n${'='.repeat(100)}`);
    console.log('✅ Check completed!\n');
  } catch (error) {
    console.error('❌ Error checking users:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
    process.exit(1);
  }
}

checkUsersSignupAndFailures()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

