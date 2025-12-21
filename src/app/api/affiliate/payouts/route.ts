import { randomUUID } from 'node:crypto';
import { getSessionFromRequest } from '@/lib/auth/auth-utils';
import { db } from '@/server/db';
import { affiliate, affiliatePayout, affiliateWalletLedger } from '@/server/db/schema';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const createPayoutSchema = z.object({
  amountCents: z.number().int().positive(),
  currency: z.string().min(3).max(10).default('USD'),
});

async function getAffiliateBalanceCents(affiliateId: string): Promise<number> {
  const [row] = await db
    .select({ balance: sql<number>`coalesce(sum(${affiliateWalletLedger.amountCents}), 0)::int` })
    .from(affiliateWalletLedger)
    .where(eq(affiliateWalletLedger.affiliateId, affiliateId));

  return row?.balance ?? 0;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request.headers);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const [affiliateRow] = await db
      .select({ id: affiliate.id })
      .from(affiliate)
      .where(eq(affiliate.userId, session.user.id))
      .limit(1);

    if (!affiliateRow) {
      return NextResponse.json({ success: true, data: [] });
    }

    const payouts = await db
      .select()
      .from(affiliatePayout)
      .where(eq(affiliatePayout.affiliateId, affiliateRow.id))
      .orderBy(desc(affiliatePayout.createdAt))
      .limit(50);

    return NextResponse.json({ success: true, data: payouts });
  } catch (error) {
    console.error('[Affiliate Payouts] GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load payouts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request.headers);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = createPayoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [affiliateRow] = await db
      .select({ id: affiliate.id, status: affiliate.status })
      .from(affiliate)
      .where(eq(affiliate.userId, session.user.id))
      .limit(1);

    if (!affiliateRow) {
      return NextResponse.json(
        { success: false, error: 'You are not an affiliate yet' },
        { status: 400 }
      );
    }

    if (affiliateRow.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Affiliate account is not active' },
        { status: 403 }
      );
    }

    const balanceCents = await getAffiliateBalanceCents(affiliateRow.id);
    const amountCents = parsed.data.amountCents;

    if (balanceCents <= 0) {
      return NextResponse.json(
        { success: false, error: 'No available balance to withdraw' },
        { status: 400 }
      );
    }

    if (amountCents > balanceCents) {
      return NextResponse.json(
        { success: false, error: 'Insufficient available balance' },
        { status: 400 }
      );
    }

    const payoutId = randomUUID();
    const now = new Date();
    const currency = parsed.data.currency.toUpperCase();

    await db.insert(affiliatePayout).values({
      id: payoutId,
      affiliateId: affiliateRow.id,
      amountCents,
      currency,
      status: 'requested',
      evidenceUrl: null,
      externalReference: null,
      paidAt: null,
      metadata: null,
      createdAt: now,
      updatedAt: now,
    });

    await db
      .insert(affiliateWalletLedger)
      .values({
        id: randomUUID(),
        affiliateId: affiliateRow.id,
        type: 'payout',
        amountCents: -amountCents,
        currency,
        referenceType: 'payout_request',
        referenceId: payoutId,
        metadata: { status: 'requested' },
        createdAt: now,
      })
      .onConflictDoNothing();

    return NextResponse.json({ success: true, data: { id: payoutId } });
  } catch (error) {
    console.error('[Affiliate Payouts] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payout request' },
      { status: 500 }
    );
  }
}
