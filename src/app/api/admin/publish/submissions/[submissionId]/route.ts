import { requireAdmin } from '@/lib/admin/auth';
import { SHOWCASE_CATEGORIES } from '@/config/showcase.config';
import { db } from '@/server/db';
import { publishSubmissions } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const admin = await requireAdmin();
    const id = params.submissionId;
    if (!id) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const {
      status,
      publishToLanding,
      publishToShowcase,
      category,
      adminNotes,
      rejectionReason,
    } = body ?? {};

    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json({ error: 'Invalid status update' }, { status: 400 });
    }

    const now = new Date();
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: now,
      reviewedAt: now,
      reviewedBy: admin.email,
      adminNotes: typeof adminNotes === 'string' ? adminNotes : null,
    };

    if (status === 'approved') {
      if (category && !SHOWCASE_CATEGORIES.some((item) => item.id === category)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
      updateData.publishToLanding = Boolean(publishToLanding);
      updateData.publishToShowcase = Boolean(publishToShowcase || publishToLanding);
      updateData.category = category || null;
      updateData.approvedAt = now;
      updateData.rejectedAt = null;
      updateData.rejectionReason = null;
    } else {
      updateData.publishToLanding = false;
      updateData.publishToShowcase = false;
      updateData.category = null;
      updateData.rejectionReason =
        typeof rejectionReason === 'string' && rejectionReason.trim().length > 0
          ? rejectionReason
          : 'Rejected by admin review';
      updateData.rejectedAt = now;
      updateData.approvedAt = null;
    }

    const [updated] = await db
      .update(publishSubmissions)
      .set(updateData)
      .where(eq(publishSubmissions.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, submission: updated });
  } catch (error) {
    console.error('Failed to update submission:', error);
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}
