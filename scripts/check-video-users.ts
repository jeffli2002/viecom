import { resolve } from 'node:path';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { generatedAsset } from '../src/server/db/schema';
import { inArray, eq, desc } from 'drizzle-orm';

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

const videoUrls = [
  'https://tempfile.aiquickdraw.com/f/0e1493093b247e80c77a727c8ae0fa5d/91e4d11f-94f3-41cc-9c3e-0561c9cd902c.mp4',
  'https://tempfile.aiquickdraw.com/f/fafc1d9e431fea7ff71b081cb26c3ca8/846af411-c903-49e8-94d2-e5d6a716c6d5.mp4',
  'https://tempfile.aiquickdraw.com/f/0b0a18bb0b960ba696529a801e7a08d1/b662ac45-a838-4bd4-bd17-160aa290759a.mp4',
  'https://tempfile.aiquickdraw.com/f/d90e5331f2abe5b6452ed742c604e4c0/575ec80c-3615-4de9-82c2-c0d46f3b934e.mp4',
  'https://tempfile.aiquickdraw.com/f/16d9859f182c32b18d7123bb6696365a/2ba406e0-4bbc-486c-bcb0-ebada3d29827.mp4',
  'https://tempfile.aiquickdraw.com/f/03a5b262638731b262b2aa59fd1b4460/b40d10a9-28ca-43fd-b625-fd550edabbfb.mp4',
];

async function checkVideoUsers() {
  try {
    console.log('Checking video URLs...\n');

    // First, try exact match on publicUrl
    let assets = await db
      .select({
        id: generatedAsset.id,
        userId: generatedAsset.userId,
        publicUrl: generatedAsset.publicUrl,
        createdAt: generatedAsset.createdAt,
        prompt: generatedAsset.prompt,
        status: generatedAsset.status,
        metadata: generatedAsset.metadata,
      })
      .from(generatedAsset)
      .where(inArray(generatedAsset.publicUrl, videoUrls));

    // If not found, try searching by UUID in the URL
    if (assets.length === 0) {
      console.log('Not found in publicUrl, searching by UUID in URL...\n');
      
      // Extract UUIDs from URLs (format: .../uuid.mp4)
      const uuids = videoUrls.map((url) => {
        const match = url.match(/([a-f0-9-]{36})\.mp4$/i);
        return match ? match[1] : null;
      }).filter((uuid): uuid is string => uuid !== null);

      if (uuids.length > 0) {
        console.log(`Extracted UUIDs: ${uuids.join(', ')}\n`);
        
        // Search in publicUrl, r2Key, or metadata
        const allVideos = await db
          .select({
            id: generatedAsset.id,
            userId: generatedAsset.userId,
            publicUrl: generatedAsset.publicUrl,
            r2Key: generatedAsset.r2Key,
            createdAt: generatedAsset.createdAt,
            prompt: generatedAsset.prompt,
            status: generatedAsset.status,
            metadata: generatedAsset.metadata,
          })
          .from(generatedAsset)
          .where(eq(generatedAsset.assetType, 'video'));

        // Check if any UUID appears in publicUrl, r2Key, or metadata
        for (const video of allVideos) {
          const urlToCheck = video.publicUrl || video.r2Key || '';
          
          // Check if any UUID from our list appears in the URL
          for (const uuid of uuids) {
            if (urlToCheck.includes(uuid)) {
              // Check if this video matches one of our target URLs
              const matchingUrl = videoUrls.find((url) => url.includes(uuid));
              if (matchingUrl) {
                assets.push({
                  ...video,
                  publicUrl: matchingUrl, // Use the target URL
                });
                break;
              }
            }
          }

          // Also check metadata
          if (video.metadata && typeof video.metadata === 'object') {
            const metadata = video.metadata as Record<string, unknown>;
            const previewUrl = metadata.previewUrl;
            
            if (typeof previewUrl === 'string') {
              for (const uuid of uuids) {
                if (previewUrl.includes(uuid)) {
                  const matchingUrl = videoUrls.find((url) => url.includes(uuid));
                  if (matchingUrl && !assets.some((a) => a.id === video.id)) {
                    assets.push({
                      ...video,
                      publicUrl: matchingUrl,
                    });
                    break;
                  }
                }
              }
            }
          }
        }
      }
    }

    console.log(`Found ${assets.length} out of ${videoUrls.length} videos in database\n`);

    if (assets.length === 0) {
      console.log('❌ No videos found in database with these URLs.');
      console.log('\nThis could mean:');
      console.log('1. The videos were not saved to the database');
      console.log('2. The URLs are different from what was stored');
      console.log('3. The videos were generated in test mode');
      return;
    }

    // Group by userId
    const userGroups = new Map<string, typeof assets>();
    for (const asset of assets) {
      if (!userGroups.has(asset.userId)) {
        userGroups.set(asset.userId, []);
      }
      userGroups.get(asset.userId)!.push(asset);
    }

    console.log('='.repeat(80));
    console.log('RESULTS:');
    console.log('='.repeat(80));
    console.log(`\nTotal unique users: ${userGroups.size}\n`);

    if (userGroups.size === 1) {
      const userId = Array.from(userGroups.keys())[0]!;
      const userAssets = userGroups.get(userId)!;
      console.log('✅ ALL VIDEOS ARE FROM THE SAME USER');
      console.log(`\nUser ID: ${userId}`);
      console.log(`Videos found: ${userAssets.length}/${videoUrls.length}\n`);
      
      console.log('Video details:');
      userAssets.forEach((asset, index) => {
        console.log(`\n${index + 1}. ${asset.publicUrl}`);
        console.log(`   Created: ${asset.createdAt.toISOString()}`);
        console.log(`   Status: ${asset.status}`);
        console.log(`   Prompt: ${asset.prompt?.substring(0, 60)}...`);
      });
    } else {
      console.log('❌ VIDEOS ARE FROM DIFFERENT USERS\n');
      
      userGroups.forEach((userAssets, userId) => {
        console.log(`\nUser ID: ${userId}`);
        console.log(`Videos: ${userAssets.length}`);
        userAssets.forEach((asset, index) => {
          console.log(`  ${index + 1}. ${asset.publicUrl}`);
          console.log(`     Created: ${asset.createdAt.toISOString()}`);
        });
      });
    }

    // Show missing URLs
    const foundUrls = new Set(assets.map((a) => a.publicUrl));
    const missingUrls = videoUrls.filter((url) => !foundUrls.has(url));
    
    if (missingUrls.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('MISSING VIDEOS (not found in database):');
      console.log('='.repeat(80));
      missingUrls.forEach((url, index) => {
        console.log(`${index + 1}. ${url}`);
      });
    }

    // Show sample of recent video URLs in database for comparison
    if (assets.length === 0) {
      console.log('\n' + '='.repeat(80));
      console.log('SAMPLE: Recent video URLs in database (for comparison):');
      console.log('='.repeat(80));
      
      const recentVideos = await db
        .select({
          publicUrl: generatedAsset.publicUrl,
          r2Key: generatedAsset.r2Key,
          createdAt: generatedAsset.createdAt,
        })
        .from(generatedAsset)
        .where(eq(generatedAsset.assetType, 'video'))
        .orderBy(desc(generatedAsset.createdAt))
        .limit(5);

      if (recentVideos.length > 0) {
        recentVideos.forEach((video, index) => {
          console.log(`\n${index + 1}. Public URL: ${video.publicUrl || 'N/A'}`);
          console.log(`   R2 Key: ${video.r2Key || 'N/A'}`);
          console.log(`   Created: ${video.createdAt.toISOString()}`);
        });
      } else {
        console.log('\nNo video records found in database.');
      }
    }

    console.log('\n' + '='.repeat(80));
  } catch (error) {
    console.error('Error checking video users:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

checkVideoUsers();

