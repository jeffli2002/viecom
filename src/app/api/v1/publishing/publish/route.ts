import { randomUUID } from 'node:crypto';
import { auth } from '@/lib/auth/auth';
import { platformPublishingService } from '@/lib/publishing/platform-service';
import { db } from '@/server/db';
import { generatedAsset, platformPublish } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

type PublishMode = 'media-only' | 'product';

interface ProductInfo {
  productId?: string;
  title?: string;
  description?: string;
  category?: string;
  brand?: string;
  model?: string;
  sku?: string;
  upc?: string;
  countryOfOrigin?: string;
  standardPrice?: number;
  salePrice?: number;
  currency?: string;
  inventoryQuantity?: number;
  minPurchaseQuantity?: number;
  maxPurchaseQuantity?: number;
  imageId?: string;
  videoId?: string;
}

interface PublishRequest {
  assetId: string;
  assetUrl: string | null;
  assetType: 'image' | 'video';
  platform: string;
  publishMode: PublishMode;
  productInfo?: ProductInfo;
  publishOptions?: Record<string, unknown>;
  platformAccountId?: string | null;
}

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
    }: {
      assetId: string;
      platforms: string[];
      publishMode?: PublishMode;
      productInfo?: ProductInfo;
      publishOptions?: Record<string, unknown>;
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
    const publishRequests: PublishRequest[] = platforms.map((platformName) => ({
      assetId: asset.id,
      assetUrl: asset.publicUrl,
      assetType: asset.assetType as 'image' | 'video',
      platform: platformName,
      publishMode,
      productInfo: publishMode === 'product' ? productInfo : undefined,
      publishOptions,
    }));

    // Publish to platforms
    const results = await platformPublishingService.publishToMultiplePlatforms(publishRequests);

    // Save publish records with product information
    const publishRecords = results.map((result, index) => {
      const request = publishRequests[index];
      const requestProductInfo: ProductInfo = request?.productInfo || {};

      return {
        id: randomUUID(),
        userId: session.user.id,
        assetId: asset.id,
        platform: request?.platform || 'unknown',
        platformAccountId: request?.platformAccountId || null,
        // Product Information
        productId: requestProductInfo.productId || null,
        productName: requestProductInfo.title || null,
        productDescription: requestProductInfo.description || null,
        productCategory: requestProductInfo.category || null,
        productBrand: requestProductInfo.brand || null,
        productModel: requestProductInfo.model || null,
        productSku: requestProductInfo.sku || null,
        productUpc: requestProductInfo.upc || null,
        productCountryOfOrigin: requestProductInfo.countryOfOrigin || null,
        // Pricing
        standardPrice: requestProductInfo.standardPrice?.toString() || null,
        salePrice: requestProductInfo.salePrice?.toString() || null,
        currency: requestProductInfo.currency || 'USD',
        // Inventory
        inventoryQuantity: requestProductInfo.inventoryQuantity || null,
        minPurchaseQuantity: requestProductInfo.minPurchaseQuantity || 1,
        maxPurchaseQuantity: requestProductInfo.maxPurchaseQuantity || null,
        // Media IDs
        imageId: result.metadata?.imageId || requestProductInfo.imageId || null,
        videoId: result.metadata?.videoId || requestProductInfo.videoId || null,
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
          platform: publishRequests[index]?.platform || 'unknown',
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
