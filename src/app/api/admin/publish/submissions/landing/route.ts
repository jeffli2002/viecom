import { requireAdmin } from '@/lib/admin/auth';
import { db } from '@/server/db';
import { publishSubmissions } from '@/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const submissionId: string | undefined = body?.submissionId;
    const publishToLanding: boolean = Boolean(body?.publishToLanding);

    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      publishToLanding,
      updatedAt: new Date(),
    };

    if (publishToLanding) {
      const [maxRow] = await db
        .select({ max: sql<number | null>`MAX(${publishSubmissions.landingOrder})` })
        .from(publishSubmissions);
      updateData.landingOrder = (maxRow?.max ?? 0) + 1;
    } else {
      updateData.landingOrder = null;
    }

    const [updated] = await db
      .update(publishSubmissions)
      .set(updateData)
      .where(eq(publishSubmissions.id, submissionId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, submission: updated });
  } catch (error) {
    console.error('Failed to toggle landing submission:', error);
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}
