import { createHash } from 'node:crypto';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { getShowcaseCategoryLabel } from '@/config/showcase.config';
import { db } from '@/server/db';
import { landingShowcaseEntries, publishSubmissions } from '@/server/db/schema';
import { and, asc, desc, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

function inferCategory(filename: string): string {
  const lowerName = filename.toLowerCase();
  if (lowerName.includes('fashion') || lowerName.includes('apparel')) return 'Fashion';
  if (lowerName.includes('beauty') || lowerName.includes('cosmetic')) return 'Beauty';
  if (lowerName.includes('home') || lowerName.includes('living')) return 'Home';
  if (lowerName.includes('tech') || lowerName.includes('gadget')) return 'Tech';
  if (lowerName.includes('shoe')) return 'Shoes';
  if (lowerName.includes('jewelry') || lowerName.includes('accessory')) return 'Accessories';
  return 'Showcase';
}

function getFileType(filename: string): 'image' | 'video' {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov')) return 'video';
  return 'image';
}

function generateItemId(filename: string) {
  return createHash('md5').update(filename).digest('hex').slice(0, 12);
}

async function loadLocalShowcaseItems(limit: number) {
  try {
    const dir = join(process.cwd(), 'public', 'showcase');
    const files = await readdir(dir);
    const media = files.filter((file) => file.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)$/i));
    return media.slice(0, limit).map((filename) => ({
      id: `local-${generateItemId(filename)}`,
      type: getFileType(filename),
      url: `/showcase/${filename}`,
      previewUrl: `/showcase/${filename}`,
      title: filename.replace(/[_-]/g, ' ').replace(/\.[^/.]+$/, ''),
      category: inferCategory(filename),
    }));
  } catch (error) {
    console.error('Failed to load local showcase files:', error);
    return [];
  }
}

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

    const localItems = await loadLocalShowcaseItems(limit || 20);
    const seen = new Set<string>();
    const pushUnique = (arr: typeof adminItems, source: (typeof adminItems)[number]) => {
      if (seen.has(source.id)) return;
      seen.add(source.id);
      arr.push(source);
    };

    const merged: typeof adminItems = [];
    [...adminItems, ...userItems].forEach((item) => pushUnique(merged, item));
    localItems.forEach((item) => pushUnique(merged, item));

    const combined = limit > 0 ? merged.slice(0, limit) : merged;

    return NextResponse.json({ success: true, placement, items: combined });
  } catch (error) {
    console.error('Failed to load showcase items:', error);
    return NextResponse.json({ success: true, placement: 'showcase', items: [] }, { status: 200 });
  }
}
