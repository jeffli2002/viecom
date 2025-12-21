import { randomUUID } from 'node:crypto';
import { requireAdmin } from '@/lib/admin/auth';
import { db } from '@/server/db';
import { affiliatePayout, affiliateWalletLedger } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const updateSchema = z.object({
  action: z.enum(['approve', 'reject', 'mark_paid', 'mark_failed']),
  evidenceUrl: z.string().url().optional(),
  externalReference: z.string().max(256).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ payoutId: string }> }
) {
  try {
    await requireAdmin();

    const { payoutId } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [payout] = await db
      .select()
      .from(affiliatePayout)
      .where(eq(affiliatePayout.id, payoutId))
      .limit(1);
    if (!payout) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const now = new Date();

    if (parsed.data.action === 'approve') {
      if (payout.status !== 'requested') {
        return NextResponse.json(
          { success: false, error: `Cannot approve payout in status ${payout.status}` },
          { status: 400 }
        );
      }

      await db
        .update(affiliatePayout)
        .set({ status: 'approved', updatedAt: now })
        .where(eq(affiliatePayout.id, payoutId));

      return NextResponse.json({ success: true });
    }

    if (parsed.data.action === 'reject' || parsed.data.action === 'mark_failed') {
      if (payout.status === 'paid') {
        return NextResponse.json(
          { success: false, error: 'Cannot change a paid payout' },
          { status: 400 }
        );
      }

      const newStatus = parsed.data.action === 'reject' ? 'rejected' : 'failed';

      await db
        .update(affiliatePayout)
        .set({
          status: newStatus,
          updatedAt: now,
          metadata: parsed.data.metadata ?? payout.metadata,
        })
        .where(eq(affiliatePayout.id, payoutId));

      await db
        .insert(affiliateWalletLedger)
        .values({
          id: randomUUID(),
          affiliateId: payout.affiliateId,
          type: 'adjustment',
          amountCents: payout.amountCents,
          currency: payout.currency,
          referenceType: 'payout_revert',
          referenceId: payoutId,
          metadata: { status: newStatus },
          createdAt: now,
        })
        .onConflictDoNothing();

      return NextResponse.json({ success: true });
    }

    if (parsed.data.action === 'mark_paid') {
      if (payout.status !== 'approved' && payout.status !== 'requested') {
        return NextResponse.json(
          { success: false, error: `Cannot mark paid payout in status ${payout.status}` },
          { status: 400 }
        );
      }

      await db
        .update(affiliatePayout)
        .set({
          status: 'paid',
          evidenceUrl: parsed.data.evidenceUrl ?? payout.evidenceUrl,
          externalReference: parsed.data.externalReference ?? payout.externalReference,
          paidAt: now,
          updatedAt: now,
          metadata: parsed.data.metadata ?? payout.metadata,
        })
        .where(eq(affiliatePayout.id, payoutId));

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    console.error('[Admin Affiliate Payouts] PATCH error:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to update payout' }, { status: 500 });
  }
}
