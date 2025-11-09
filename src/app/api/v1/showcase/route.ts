import { db } from '@/server/db';
import { showcaseGallery } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    // Get featured showcase assets
    const assets = await db
      .select({
        id: showcaseGallery.id,
        url: showcaseGallery.assetUrl,
        type: showcaseGallery.assetType,
        title: showcaseGallery.title,
      })
      .from(showcaseGallery)
      .where(eq(showcaseGallery.isActive, true))
      .orderBy(showcaseGallery.displayOrder)
      .limit(12);

    return NextResponse.json({
      success: true,
      assets: assets.map((asset) => ({
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
