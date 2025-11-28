import { requireAdmin } from '@/lib/admin/auth';
import { getPlanPriceByPriceId } from '@/lib/admin/revenue-utils';
import { db } from '@/server/db';
import { creditPackPurchase, payment, user } from '@/server/db/schema';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Verify admin
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    const daysAgo = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const subscriptionPayments = await db
      .select({
        id: payment.id,
        userEmail: user.email,
        priceId: payment.priceId,
        createdAt: payment.createdAt,
        provider: payment.provider,
        status: payment.status,
      })
      .from(payment)
      .leftJoin(user, eq(payment.userId, user.id))
      .where(gte(payment.createdAt, startDate))
      .orderBy(desc(payment.createdAt))
      .limit(100);

    const subscriptionRevenueInRange = subscriptionPayments.reduce(
      (sum, row) => sum + getPlanPriceByPriceId(row.priceId),
      0
    );

    const subscriptionRows = subscriptionPayments.map((row) => ({
      id: row.id,
      userEmail: row.userEmail || 'Unknown',
      amount: getPlanPriceByPriceId(row.priceId),
      currency: 'USD',
      status: row.status,
      createdAt: row.createdAt,
      provider: row.provider || 'stripe',
      type: 'subscription' as const,
      credits: null,
    }));

    const creditPackRows = await db
      .select({
        id: creditPackPurchase.id,
        userEmail: user.email,
        amountCents: creditPackPurchase.amountCents,
        currency: creditPackPurchase.currency,
        createdAt: creditPackPurchase.createdAt,
        credits: creditPackPurchase.credits,
        provider: creditPackPurchase.provider,
      })
      .from(creditPackPurchase)
      .leftJoin(user, eq(user.id, creditPackPurchase.userId))
      .where(
        and(gte(creditPackPurchase.createdAt, startDate), eq(creditPackPurchase.testMode, false))
      )
      .orderBy(desc(creditPackPurchase.createdAt))
      .limit(100);

    const creditPackPayments = creditPackRows.map((row) => ({
      id: row.id,
      userEmail: row.userEmail || 'Unknown',
      amount: row.amountCents / 100,
      currency: row.currency || 'USD',
      status: 'completed',
      createdAt: row.createdAt,
      provider: row.provider || 'creem',
      type: 'credit_pack' as const,
      credits: row.credits,
    }));

    const recentPayments = [...creditPackPayments, ...subscriptionRows].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const trendMap = new Map<
      string,
      {
        date: string;
        amount: number;
        count: number;
      }
    >();

    recentPayments.forEach((entry) => {
      const dateKey = new Date(entry.createdAt).toISOString().split('T')[0];
      const current = trendMap.get(dateKey) ?? { date: dateKey, amount: 0, count: 0 };
      current.amount += entry.amount;
      current.count += 1;
      trendMap.set(dateKey, current);
    });

    const trend = Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    const totalPackRevenueRows = await db
      .select({ amountCents: creditPackPurchase.amountCents })
      .from(creditPackPurchase)
      .where(eq(creditPackPurchase.testMode, false));
    const totalPackRevenue = totalPackRevenueRows.reduce(
      (sum, row) => sum + row.amountCents / 100,
      0
    );

    const totalSubscriptionPayments = await db.select({ priceId: payment.priceId }).from(payment);
    const totalSubscriptionRevenue = totalSubscriptionPayments.reduce(
      (sum, row) => sum + getPlanPriceByPriceId(row.priceId),
      0
    );

    const totalRevenue = totalPackRevenue + totalSubscriptionRevenue;
    const revenueInRange =
      creditPackPayments.reduce((sum, p) => sum + p.amount, 0) + subscriptionRevenueInRange;
    const transactionCount = recentPayments.length;
    const averageTransaction = transactionCount > 0 ? revenueInRange / transactionCount : 0;

    const response = NextResponse.json({
      summary: {
        totalRevenue,
        revenueInRange,
        transactionCount,
        averageTransaction,
      },
      trend,
      recentPayments,
    });

    // Prevent caching of admin data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');

    return response;
  } catch (error: unknown) {
    console.error('Admin payments stats error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch payments stats' }, { status: 500 });
  }
}
