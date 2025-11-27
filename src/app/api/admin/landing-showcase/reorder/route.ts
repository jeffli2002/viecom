import { requireAdmin } from '@/lib/admin/auth';
import { db } from '@/server/db';
import { landingShowcaseEntries } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }

    await Promise.all(
      ids.map((id, index) =>
        db
          .update(landingShowcaseEntries)
          .set({ sortOrder: index + 1 })
          .where(eq(landingShowcaseEntries.id, id))
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reorder landing showcase entries:', error);
    return NextResponse.json({ error: 'Failed to reorder entries' }, { status: 500 });
  }
}
