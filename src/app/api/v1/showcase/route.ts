import { db } from '@/server/db';
import { showcaseGallery, generatedAsset } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    // Get featured showcase assets with JOIN to generatedAsset
    const assets = await db
      .select({
        id: showcaseGallery.id,
        url: generatedAsset.publicUrl,
        type: generatedAsset.assetType,
        title: generatedAsset.productName,
      })
      .from(showcaseGallery)
      .innerJoin(generatedAsset, eq(showcaseGallery.assetId, generatedAsset.id))
      .where(
        and(
          eq(showcaseGallery.isActive, true),
          eq(generatedAsset.status, 'completed')
        )
      )
      .orderBy(showcaseGallery.displayOrder)
      .limit(12);

    return NextResponse.json({
      success: true,
      assets: (assets || []).map((asset) => ({
        id: asset.id,
        url: asset.url || '',
        type: asset.type as 'image' | 'video',
        title: asset.title || undefined,
      })),
    });
  } catch (error) {
    console.error('Get showcase error:', error);
    return NextResponse.json(
      {
        success: true,
        assets: [], // Return empty array on error
      },
      { status: 200 }
    );
  }
}
