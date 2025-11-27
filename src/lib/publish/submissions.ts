import { randomUUID } from 'node:crypto';
import { LANDING_SHOWCASE_LIMIT } from '@/config/showcase.config';
import { db } from '@/server/db';
import { landingShowcaseEntries, publishSubmissions } from '@/server/db/schema';
import { and, asc, desc, eq } from 'drizzle-orm';

export type PublishSubmissionRecord = typeof publishSubmissions.$inferSelect;

type CreateSubmissionInput = {
  userId: string;
  assetUrl: string;
  previewUrl?: string | null;
  assetId?: string | null;
  assetType?: 'image' | 'video';
  prompt?: string | null;
  title?: string | null;
  category?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function createPublishSubmission(input: CreateSubmissionInput) {
  const now = new Date();
  const {
    userId,
    assetUrl,
    previewUrl,
    assetId,
    prompt,
    assetType,
    title,
    category,
    metadata,
  } = input;

  const normalizedTitle =
    title?.trim() ||
    prompt?.trim()?.slice(0, 120) ||
    'Untitled Showcase';

  const existing =
    assetId && assetId.length > 0
      ? await db.query.publishSubmissions.findFirst({
          where: and(eq(publishSubmissions.userId, userId), eq(publishSubmissions.assetId, assetId)),
        })
      : null;

  if (existing) {
    const [updated] = await db
      .update(publishSubmissions)
      .set({
        assetUrl,
        previewUrl: previewUrl || assetUrl,
        assetType: assetType || existing.assetType,
        title: normalizedTitle,
        prompt: prompt || existing.prompt,
        category: category || existing.category,
        status: 'pending',
        publishToLanding: false,
        publishToShowcase: false,
        rejectionReason: null,
        adminNotes: null,
        metadata: metadata ? metadata : existing.metadata,
        reviewedAt: null,
        reviewedBy: null,
        approvedAt: null,
        rejectedAt: null,
        updatedAt: now,
      })
      .where(eq(publishSubmissions.id, existing.id))
      .returning();

    return updated ?? existing;
  }

  const [created] = await db
    .insert(publishSubmissions)
    .values({
      id: randomUUID(),
      userId,
      assetId: assetId ?? null,
      assetUrl,
      previewUrl: previewUrl || assetUrl,
      assetType: assetType || 'image',
      title: normalizedTitle,
      prompt: prompt || null,
      category: category || null,
      status: 'pending',
      publishToLanding: false,
      publishToShowcase: false,
      metadata: metadata ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return created;
}

type ShowcasePlacement = 'landing' | 'showcase';

export async function getApprovedShowcaseEntries(options: {
  placement: ShowcasePlacement;
  limit?: number;
}) {
  const { placement, limit } = options;
  const queryLimit =
    typeof limit === 'number' && limit > 0
      ? limit
      : placement === 'landing'
        ? LANDING_SHOWCASE_LIMIT
        : 200;

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
      approvedAt: publishSubmissions.approvedAt,
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
    .limit(queryLimit);

  const adminItems = adminEntries.map((entry) => ({
    id: entry.id,
    assetUrl: entry.imageUrl,
    previewUrl: entry.imageUrl,
    title: entry.title,
    category: entry.category,
    assetType: 'image' as const,
    approvedAt: null,
  }));

  const combined = [...adminItems, ...userRows];
  return combined.slice(0, queryLimit);
}
