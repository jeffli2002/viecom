import { getShowcaseCategoryLabel } from '@/config/showcase.config';
import { db } from '@/server/db';
import { landingShowcaseEntries, publishSubmissions } from '@/server/db/schema';
import { and, asc, desc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placementParam = searchParams.get('placement');
    const placement = placementParam === 'landing' ? 'landing' : 'showcase';
    const limitParam = Number.parseInt(searchParams.get('limit') || '0', 10);
    const limit =
      placement === 'landing'
        ? Math.min(Math.max(limitParam || 12, 1), 20)
        : Math.min(Math.max(limitParam || 48, 4), 200);

    const adminEntries = await db
      .select({
        id: landingShowcaseEntries.id,
        imageUrl: landingShowcaseEntries.imageUrl,
        title: landingShowcaseEntries.title,
        category: landingShowcaseEntries.category,
      })
      .from(landingShowcaseEntries)
      .where(eq(landingShowcaseEntries.isVisible, true))
      .orderBy(asc(landingShowcaseEntries.sortOrder), desc(landingShowcaseEntries.createdAt));

    const userRows = await db
      .select({
        id: publishSubmissions.id,
        assetUrl: publishSubmissions.assetUrl,
        previewUrl: publishSubmissions.previewUrl,
        title: publishSubmissions.title,
        category: publishSubmissions.category,
        assetType: publishSubmissions.assetType,
      })
      .from(publishSubmissions)
      .where(
        and(
          eq(publishSubmissions.status, 'approved'),
          placement === 'landing'
            ? eq(publishSubmissions.publishToLanding, true)
            : eq(publishSubmissions.publishToShowcase, true)
        )
      )
      .orderBy(
        placement === 'landing'
          ? asc(publishSubmissions.landingOrder)
          : desc(publishSubmissions.approvedAt),
        desc(publishSubmissions.createdAt)
      )
      .limit(limit);

    const adminItems = adminEntries.map((entry) => ({
      id: `admin-${entry.id}`,
      type: 'image' as const,
      url: entry.imageUrl,
      previewUrl: entry.imageUrl,
      title: entry.title,
      category: getShowcaseCategoryLabel(entry.category),
    }));

    const userItems = userRows.map((row) => ({
      id: row.id,
      type: row.assetType === 'video' ? 'video' : 'image',
      url: row.assetUrl,
      previewUrl: row.previewUrl ?? row.assetUrl,
      title: row.title ?? 'Showcase Item',
      category: getShowcaseCategoryLabel(row.category),
    }));

    const combined =
      limit > 0 ? [...adminItems, ...userItems].slice(0, limit) : [...adminItems, ...userItems];

    return NextResponse.json({ success: true, placement, items: combined });
  } catch (error) {
    console.error('Failed to load showcase items:', error);
    return NextResponse.json(
      { success: true, placement: 'showcase', items: [] },
      { status: 200 }
    );
  }
}
