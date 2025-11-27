import { randomUUID } from 'node:crypto';
import { SHOWCASE_CATEGORIES } from '@/config/showcase.config';
import { requireAdmin } from '@/lib/admin/auth';
import { db } from '@/server/db';
import { landingShowcaseEntries } from '@/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    await requireAdmin();
    const entries = await db
      .select()
      .from(landingShowcaseEntries)
      .orderBy(landingShowcaseEntries.sortOrder, desc(landingShowcaseEntries.createdAt));

    return NextResponse.json({ success: true, entries });
  } catch (error) {
    console.error('Failed to load landing showcase entries:', error);
    return NextResponse.json({ success: false, error: 'Failed to load entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { imageUrl, title, subtitle, category, ctaUrl, isVisible = true } = body ?? {};

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (category && !SHOWCASE_CATEGORIES.some((item) => item.id === category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const [maxRow] = await db
      .select({ max: sql<number | null>`MAX(${landingShowcaseEntries.sortOrder})` })
      .from(landingShowcaseEntries);
    const nextOrder = (maxRow?.max ?? 0) + 1;

    const [created] = await db
      .insert(landingShowcaseEntries)
      .values({
        id: randomUUID(),
        imageUrl,
        title,
        subtitle: subtitle || null,
        category: category || null,
        ctaUrl: ctaUrl || null,
        isVisible: Boolean(isVisible),
        sortOrder: nextOrder,
      })
      .returning();

    return NextResponse.json({ success: true, entry: created });
  } catch (error) {
    console.error('Failed to create landing showcase entry:', error);
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}
