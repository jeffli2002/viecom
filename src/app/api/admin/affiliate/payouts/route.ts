import { requireAdmin } from '@/lib/admin/auth';
import { db } from '@/server/db';
import { affiliate, affiliatePayout, users } from '@/server/db/schema';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status')?.trim() || null;
    const q = searchParams.get('q')?.trim() || null;
    const statusParsed = z
      .enum(['requested', 'approved', 'paid', 'rejected', 'failed'])
      .safeParse(status);

    const queryBase = db
      .select({
        id: affiliatePayout.id,
        affiliateId: affiliatePayout.affiliateId,
        affiliateCode: affiliate.code,
        userId: affiliate.userId,
        userEmail: users.email,
        amountCents: affiliatePayout.amountCents,
        currency: affiliatePayout.currency,
        status: affiliatePayout.status,
        evidenceUrl: affiliatePayout.evidenceUrl,
        externalReference: affiliatePayout.externalReference,
        paidAt: affiliatePayout.paidAt,
        createdAt: affiliatePayout.createdAt,
        updatedAt: affiliatePayout.updatedAt,
      })
      .from(affiliatePayout)
      .innerJoin(affiliate, eq(affiliate.id, affiliatePayout.affiliateId))
      .leftJoin(users, eq(users.id, affiliate.userId));

    const conditions = [];
    if (statusParsed.success) {
      conditions.push(eq(affiliatePayout.status, statusParsed.data));
    }
    if (q) {
      conditions.push(
        or(
          ilike(users.email, `%${q}%`),
          ilike(affiliate.code, `%${q}%`),
          ilike(affiliatePayout.id, `%${q}%`)
        )
      );
    }

    const rows = await (conditions.length > 0 ? queryBase.where(and(...conditions)) : queryBase)
      .orderBy(desc(affiliatePayout.createdAt))
      .limit(100);

    const response = NextResponse.json({ success: true, data: rows });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return response;
  } catch (error) {
    console.error('[Admin Affiliate Payouts] GET error:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to load payouts' }, { status: 500 });
  }
}
