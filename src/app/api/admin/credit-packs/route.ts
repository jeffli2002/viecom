import { requireAdmin } from '@/lib/admin/auth';
import { db } from '@/server/db';
import { creditPackPurchase, user } from '@/server/db/schema';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    const daysAgo = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const purchasesInRange = await db
      .select({
        amountCents: creditPackPurchase.amountCents,
        createdAt: creditPackPurchase.createdAt,
      })
      .from(creditPackPurchase)
      .where(
        and(gte(creditPackPurchase.createdAt, startDate), eq(creditPackPurchase.testMode, false))
      );

    const revenueInRange = purchasesInRange.reduce(
      (sum, purchase) => sum + purchase.amountCents / 100,
      0
    );

    const totalRevenueRows = await db
      .select({ amountCents: creditPackPurchase.amountCents })
      .from(creditPackPurchase)
      .where(eq(creditPackPurchase.testMode, false));

    const totalRevenue = totalRevenueRows.reduce((sum, row) => sum + row.amountCents / 100, 0);

    const recentPurchases = await db
      .select({
        id: creditPackPurchase.id,
        userEmail: user.email,
        credits: creditPackPurchase.credits,
        amountCents: creditPackPurchase.amountCents,
        currency: creditPackPurchase.currency,
        provider: creditPackPurchase.provider,
        createdAt: creditPackPurchase.createdAt,
      })
      .from(creditPackPurchase)
      .leftJoin(user, eq(user.id, creditPackPurchase.userId))
      .where(
        and(gte(creditPackPurchase.createdAt, startDate), eq(creditPackPurchase.testMode, false))
      )
      .orderBy(desc(creditPackPurchase.createdAt))
      .limit(100);

    const trendMap = new Map<
      string,
      {
        date: string;
        amount: number;
        count: number;
      }
    >();

    purchasesInRange.forEach((purchase) => {
      const dateKey = new Date(purchase.createdAt).toISOString().split('T')[0];
      const entry = trendMap.get(dateKey) ?? { date: dateKey, amount: 0, count: 0 };
      entry.amount += purchase.amountCents / 100;
      entry.count += 1;
      trendMap.set(dateKey, entry);
    });

    const trend = Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    const response = NextResponse.json({
      summary: {
        totalRevenue,
        revenueInRange,
        transactionCount: purchasesInRange.length,
        averageTransaction:
          purchasesInRange.length > 0 ? revenueInRange / purchasesInRange.length : 0,
      },
      trend,
      purchases: recentPurchases.map((purchase) => ({
        id: purchase.id,
        userEmail: purchase.userEmail || 'Unknown',
        credits: purchase.credits,
        amount: purchase.amountCents / 100,
        currency: purchase.currency,
        provider: purchase.provider,
        createdAt: purchase.createdAt,
      })),
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');

    return response;
  } catch (error) {
    console.error('Admin credit pack stats error:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch credit pack stats' }, { status: 500 });
  }
}
