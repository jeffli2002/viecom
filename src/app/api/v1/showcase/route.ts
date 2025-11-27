import { getShowcaseCategoryLabel } from '@/config/showcase.config';
import { db } from '@/server/db';
import { publishSubmissions } from '@/server/db/schema';
import { and, desc, eq } from 'drizzle-orm';
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

    const rows = await db
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
      .orderBy(desc(publishSubmissions.approvedAt), desc(publishSubmissions.createdAt))
      .limit(limit);

    const items = rows.map((row) => ({
      id: row.id,
      type: row.assetType === 'video' ? 'video' : 'image',
      url: row.assetUrl,
      previewUrl: row.previewUrl ?? row.assetUrl,
      title: row.title ?? 'Showcase Item',
      category: getShowcaseCategoryLabel(row.category),
    }));

    return NextResponse.json({ success: true, placement, items });
  } catch (error) {
    console.error('Failed to load showcase items:', error);
    return NextResponse.json(
      { success: true, placement: 'showcase', items: [] },
      { status: 200 }
    );
  }
}
