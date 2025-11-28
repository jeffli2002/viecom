import { SHOWCASE_CATEGORIES } from '@/config/showcase.config';
import { requireAdmin } from '@/lib/admin/auth';
import { db } from '@/server/db';
import { landingShowcaseEntries } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function PATCH(request: NextRequest, { params }: { params: { entryId: string } }) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { title, subtitle, category, ctaUrl, isVisible } = body ?? {};
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (typeof title === 'string') {
      updates.title = title;
    }
    if (typeof subtitle === 'string') {
      updates.subtitle = subtitle;
    }
    if (typeof ctaUrl === 'string') {
      updates.ctaUrl = ctaUrl;
    }
    if (typeof isVisible === 'boolean') {
      updates.isVisible = isVisible;
    }
    if (category) {
      if (!SHOWCASE_CATEGORIES.some((item) => item.id === category)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
      updates.category = category;
    }

    const [updated] = await db
      .update(landingShowcaseEntries)
      .set(updates)
      .where(eq(landingShowcaseEntries.id, params.entryId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, entry: updated });
  } catch (error) {
    console.error('Failed to update landing showcase entry:', error);
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { entryId: string } }) {
  try {
    await requireAdmin();
    await db.delete(landingShowcaseEntries).where(eq(landingShowcaseEntries.id, params.entryId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete landing showcase entry:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
