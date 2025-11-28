import { paymentConfig } from '@/config/payment.config';
import { requireAdmin } from '@/lib/admin/auth';
import { db } from '@/server/db';
import { creditTransactions, payment, user } from '@/server/db/schema';
import { desc, eq, gte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

const parsePurchaseMetadata = (metadata: string | null) => {
  if (!metadata) {
    return { amount: 0, currency: 'USD', provider: 'unknown', credits: 0, productName: '' };
  }
  try {
    const parsed = JSON.parse(metadata) as Record<string, unknown>;
    const productId = typeof parsed.productId === 'string' ? parsed.productId : undefined;
    const creditsValue =
      typeof parsed.credits === 'number'
        ? parsed.credits
        : Number(parsed.credits) || undefined;
    const pack =
      paymentConfig.creditPacks.find((pack) => pack.creemProductKey === productId) ||
      (typeof creditsValue === 'number'
        ? paymentConfig.creditPacks.find((pack) => pack.credits === creditsValue)
        : undefined);
    const rawAmount = Number(parsed.amount);
    const amount =
      Number.isFinite(rawAmount) && rawAmount > 0 ? rawAmount : pack?.price ?? 0;
    return {
      amount,
      currency: typeof parsed.currency === 'string' ? parsed.currency : 'USD',
      provider: typeof parsed.provider === 'string' ? parsed.provider : 'unknown',
      credits: creditsValue ?? pack?.credits ?? 0,
      productName: typeof parsed.productName === 'string' ? parsed.productName : pack?.name || '',
    };
  } catch (error) {
    console.error('Failed to parse purchase metadata:', error);
    return { amount: 0, currency: 'USD', provider: 'unknown', credits: 0, productName: '' };
  }
};

export async function GET(request: Request) {
  try {
    // Verify admin
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    const daysAgo = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const paymentCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(payment)
      .where(gte(payment.createdAt, startDate));

    const creditPackRows = await db
      .select({
        id: creditTransactions.id,
        metadata: creditTransactions.metadata,
        createdAt: creditTransactions.createdAt,
        userEmail: user.email,
      })
      .from(creditTransactions)
      .leftJoin(user, eq(user.id, creditTransactions.userId))
      .where(
        and(eq(creditTransactions.source, 'purchase'), gte(creditTransactions.createdAt, startDate))
      )
      .orderBy(desc(creditTransactions.createdAt))
      .limit(100);

    const creditPackPayments = creditPackRows.map((row) => {
      const parsed = parsePurchaseMetadata(row.metadata);
      return {
        id: row.id,
        userEmail: row.userEmail || 'Unknown',
        amount: parsed.amount,
        currency: parsed.currency,
        status: 'completed',
        createdAt: row.createdAt,
        provider: parsed.provider,
        type: 'credit_pack' as const,
        credits: parsed.credits,
      };
    });

    const trendMap = new Map<
      string,
      {
        date: string;
        amount: number;
        count: number;
      }
    >();

    creditPackPayments.forEach((payment) => {
      const dateKey = new Date(payment.createdAt).toISOString().split('T')[0];
      const entry = trendMap.get(dateKey) ?? { date: dateKey, amount: 0, count: 0 };
      entry.amount += payment.amount;
      entry.count += 1;
      trendMap.set(dateKey, entry);
    });

    const trend = Array.from(trendMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const totalRevenueRows = await db
      .select({ metadata: creditTransactions.metadata })
      .from(creditTransactions)
      .where(eq(creditTransactions.source, 'purchase'));

    const totalRevenue = totalRevenueRows.reduce(
      (sum, row) => sum + parsePurchaseMetadata(row.metadata).amount,
      0
    );
    const revenueInRange = creditPackPayments.reduce((sum, p) => sum + p.amount, 0);
    const transactionCount = creditPackPayments.length;
    const averageTransaction = transactionCount > 0 ? revenueInRange / transactionCount : 0;

    const response = NextResponse.json({
      summary: {
        totalRevenue,
        revenueInRange,
        transactionCount,
        averageTransaction,
      },
      trend,
      recentPayments: creditPackPayments,
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
