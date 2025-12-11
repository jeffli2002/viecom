import { randomUUID } from 'node:crypto';
import { SHARE_REWARD_CONFIG } from '@/config/share.config';
import { SHOWCASE_CATEGORIES } from '@/config/showcase.config';
import { requireAdmin } from '@/lib/admin/auth';
import { creditService } from '@/lib/credits';
import { db } from '@/server/db';
import { publishSubmissions, socialShares } from '@/server/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

type PublishSubmission = typeof publishSubmissions.$inferSelect;

async function awardPublishReward(submission: PublishSubmission) {
  const reward = SHARE_REWARD_CONFIG.publishViecom;
  if (!submission.userId || reward.credits <= 0) {
    return;
  }

  const referenceId = `publish_submission_${submission.id}`;
  const existingReward = await db.query.socialShares.findFirst({
    where: and(
      eq(socialShares.userId, submission.userId),
      eq(socialShares.referenceId, referenceId)
    ),
  });

  if (existingReward) {
    return;
  }

  const shareId = randomUUID();
  await db.insert(socialShares).values({
    id: shareId,
    userId: submission.userId,
    assetId: submission.assetId ?? null,
    platform: reward.platform,
    shareUrl: submission.assetUrl,
    creditsEarned: reward.credits,
    referenceId,
  });

  try {
    await creditService.earnCredits({
      userId: submission.userId,
      amount: reward.credits,
      source: 'social_share',
      description: 'Publish on Viecom.pro (admin approved)',
      referenceId: `social_share_${shareId}`,
      metadata: {
        submissionId: submission.id,
        assetType: submission.assetType,
        rewardType: 'publishViecom',
      },
    });
  } catch (error) {
    await db.delete(socialShares).where(eq(socialShares.id, shareId));
    throw error;
  }
}

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

    const submission = await db.query.publishSubmissions.findFirst({
      where: eq(publishSubmissions.id, id),
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status, publishToLanding, publishToShowcase, category, adminNotes, rejectionReason } =
      body ?? {};

    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json({ error: 'Invalid status update' }, { status: 400 });
    }

    const shouldAwardReward = status === 'approved' && submission.status !== 'approved';
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
      const landingFlag =
        typeof publishToLanding === 'boolean' ? publishToLanding : submission.publishToLanding;
      const showcaseFlag =
        typeof publishToShowcase === 'boolean'
          ? publishToShowcase
          : submission.publishToShowcase || landingFlag;

      updateData.publishToLanding = landingFlag;
      updateData.publishToShowcase = showcaseFlag;
      updateData.category = category || null;
      updateData.approvedAt = now;
      updateData.rejectedAt = null;
      updateData.rejectionReason = null;

      if (landingFlag) {
        const existingOrder = submission.landingOrder;
        if (existingOrder && existingOrder > 0) {
          updateData.landingOrder = existingOrder;
        } else {
          const [maxRow] = await db
            .select({
              max: sql<number | null>`MAX(${publishSubmissions.landingOrder})`,
            })
            .from(publishSubmissions);
          const nextOrder = (maxRow?.max ?? 0) + 1;
          updateData.landingOrder = nextOrder;
        }
      } else {
        updateData.landingOrder = null;
      }
    } else {
      updateData.publishToLanding = false;
      updateData.publishToShowcase = false;
      updateData.category = null;
      updateData.landingOrder = null;
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

    if (shouldAwardReward) {
      try {
        await awardPublishReward(updated);
      } catch (error) {
        console.error('Failed to award publish reward:', error);
        await db
          .update(publishSubmissions)
          .set({
            status: submission.status,
            publishToLanding: submission.publishToLanding,
            publishToShowcase: submission.publishToShowcase,
            category: submission.category,
            landingOrder: submission.landingOrder,
            approvedAt: submission.approvedAt,
            rejectedAt: submission.rejectedAt,
            reviewedAt: submission.reviewedAt,
            reviewedBy: submission.reviewedBy,
            rejectionReason: submission.rejectionReason,
            adminNotes: submission.adminNotes,
            updatedAt: submission.updatedAt,
          })
          .where(eq(publishSubmissions.id, id));

        return NextResponse.json(
          { error: 'Failed to award publish reward. Approval was not saved.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, submission: updated });
  } catch (error) {
    console.error('Failed to update submission:', error);
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}
