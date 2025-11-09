import { randomUUID } from 'node:crypto';
import { auth } from '@/lib/auth/auth';
import { platformPublishingService } from '@/lib/publishing/platform-service';
import { db } from '@/server/db';
import { generatedAsset, platformPublish } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      assetId,
      platforms, // Array of platform names
      publishMode = 'media-only', // 'media-only' or 'product'
      productInfo,
      publishOptions,
    } = body;

    if (!assetId) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: 'At least one platform is required' }, { status: 400 });
    }

    // Verify asset exists and belongs to user
    const [asset] = await db
      .select()
      .from(generatedAsset)
      .where(eq(generatedAsset.id, assetId))
      .limit(1);

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    if (asset.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (asset.status !== 'completed') {
      return NextResponse.json({ error: 'Asset is not ready for publishing' }, { status: 400 });
    }

    // Create publish requests
    const publishRequests = platforms.map((platform: string) => ({
      assetId: asset.id,
      assetUrl: asset.publicUrl,
      assetType: asset.assetType as 'image' | 'video',
      platform: platform as any,
      publishMode, // Include publish mode
      productInfo: publishMode === 'product' ? productInfo : undefined, // Only include product info if product mode
      publishOptions,
    }));

    // Publish to platforms
    const results = await platformPublishingService.publishToMultiplePlatforms(publishRequests);

    // Save publish records with product information
    const publishRecords = results.map((result, index) => {
      const request = publishRequests[index]!;
      const productInfo = request.productInfo || {};

      return {
        id: randomUUID(),
        userId: session.user.id,
        assetId: asset.id,
        platform: request.platform,
        platformAccountId: request.platformAccountId || null,
        // Product Information
        productId: productInfo.productId || null,
        productName: productInfo.title || null,
        productDescription: productInfo.description || null,
        productCategory: productInfo.category || null,
        productBrand: productInfo.brand || null,
        productModel: productInfo.model || null,
        productSku: productInfo.sku || null,
        productUpc: productInfo.upc || null,
        productCountryOfOrigin: productInfo.countryOfOrigin || null,
        // Pricing
        standardPrice: productInfo.standardPrice?.toString() || null,
        salePrice: productInfo.salePrice?.toString() || null,
        currency: productInfo.currency || 'USD',
        // Inventory
        inventoryQuantity: productInfo.inventoryQuantity || null,
        minPurchaseQuantity: productInfo.minPurchaseQuantity || 1,
        maxPurchaseQuantity: productInfo.maxPurchaseQuantity || null,
        // Media IDs
        imageId: result.metadata?.imageId || productInfo.imageId || null,
        videoId: result.metadata?.videoId || productInfo.videoId || null,
        // Publishing Status
        publishStatus: result.success ? 'published' : 'failed',
        publishUrl: result.publishUrl || null,
        publishId: result.publishId || null,
        errorMessage: result.error || null,
        publishMetadata: result.metadata || null,
        publishedAt: result.success ? new Date() : null,
      };
    });

    await db.insert(platformPublish).values(publishRecords);

    return NextResponse.json({
      success: true,
      data: {
        results: results.map((result, index) => ({
          platform: publishRequests[index]!.platform,
          ...result,
        })),
      },
    });
  } catch (error) {
    console.error('Publishing error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Publishing failed',
      },
      { status: 500 }
    );
  }
}
