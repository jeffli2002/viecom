import { requireAdmin } from '@/lib/admin/auth';
import { db } from '@/server/db';
import {
  affiliate,
  affiliateClick,
  affiliateCommission,
  affiliateWalletLedger,
  users,
} from '@/server/db/schema';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || null;
    const status = searchParams.get('status')?.trim() || null;
    const statusParsed = z.enum(['pending', 'active', 'suspended', 'banned']).safeParse(status);

    const conditions = [];
    if (statusParsed.success) {
      conditions.push(eq(affiliate.status, statusParsed.data));
    }
    if (q) {
      conditions.push(
        or(
          ilike(users.email, `%${q}%`),
          ilike(affiliate.code, `%${q}%`),
          ilike(affiliate.userId, `%${q}%`)
        )
      );
    }

    const rows = await (conditions.length > 0
      ? db
          .select({
            id: affiliate.id,
            userId: affiliate.userId,
            code: affiliate.code,
            status: affiliate.status,
            createdAt: affiliate.createdAt,
            updatedAt: affiliate.updatedAt,
            userEmail: users.email,
            clicks: sql<number>`coalesce((
              select count(*)::int from ${affiliateClick} c where c.affiliate_id = ${affiliate.id}
            ), 0)::int`,
            pendingCommissionCents: sql<number>`coalesce((
              select sum(${affiliateCommission.commissionAmountCents})::int
              from ${affiliateCommission} ac
              where ac.affiliate_id = ${affiliate.id} and ac.status = 'pending'
            ), 0)::int`,
            totalCommissionCents: sql<number>`coalesce((
              select sum(${affiliateCommission.commissionAmountCents})::int
              from ${affiliateCommission} ac
              where ac.affiliate_id = ${affiliate.id}
            ), 0)::int`,
            balanceCents: sql<number>`coalesce((
              select sum(${affiliateWalletLedger.amountCents})::int
              from ${affiliateWalletLedger} wl
              where wl.affiliate_id = ${affiliate.id}
            ), 0)::int`,
          })
          .from(affiliate)
          .leftJoin(users, eq(users.id, affiliate.userId))
          .where(and(...conditions))
      : db
          .select({
            id: affiliate.id,
            userId: affiliate.userId,
            code: affiliate.code,
            status: affiliate.status,
            createdAt: affiliate.createdAt,
            updatedAt: affiliate.updatedAt,
            userEmail: users.email,
            clicks: sql<number>`coalesce((
              select count(*)::int from ${affiliateClick} c where c.affiliate_id = ${affiliate.id}
            ), 0)::int`,
            pendingCommissionCents: sql<number>`coalesce((
              select sum(${affiliateCommission.commissionAmountCents})::int
              from ${affiliateCommission} ac
              where ac.affiliate_id = ${affiliate.id} and ac.status = 'pending'
            ), 0)::int`,
            totalCommissionCents: sql<number>`coalesce((
              select sum(${affiliateCommission.commissionAmountCents})::int
              from ${affiliateCommission} ac
              where ac.affiliate_id = ${affiliate.id}
            ), 0)::int`,
            balanceCents: sql<number>`coalesce((
              select sum(${affiliateWalletLedger.amountCents})::int
              from ${affiliateWalletLedger} wl
              where wl.affiliate_id = ${affiliate.id}
            ), 0)::int`,
          })
          .from(affiliate)
          .leftJoin(users, eq(users.id, affiliate.userId))
    )
      .orderBy(desc(affiliate.createdAt))
      .limit(200);

    const response = NextResponse.json({ success: true, data: rows });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return response;
  } catch (error) {
    console.error('[Admin Affiliates] GET error:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to load affiliates' },
      { status: 500 }
    );
  }
}
