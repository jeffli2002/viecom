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
      typeof parsed.credits === 'number' ? parsed.credits : Number(parsed.credits) || undefined;
    const pack =
      paymentConfig.creditPacks.find((pack) => pack.creemProductKey === productId) ||
      (typeof creditsValue === 'number'
        ? paymentConfig.creditPacks.find((pack) => pack.credits === creditsValue)
        : undefined);
    const rawAmount = Number(parsed.amount);
    const amount = Number.isFinite(rawAmount) && rawAmount > 0 ? rawAmount : (pack?.price ?? 0);
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

    // Note: payment table doesn't have amount/currency columns yet
    // TODO: Add amount and currency columns to payment schema

    const _paymentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(payment)
      .where(gte(payment.createdAt, startDate));

    // Get recent payments with user info (without amount/currency)
    const recentPayments = await db
      .select({
        id: payment.id,
        userId: payment.userId,
        userEmail: user.email,
        userName: user.name,
        status: payment.status,
        provider: payment.provider,
        priceId: payment.priceId,
        type: payment.type,
        interval: payment.interval,
        createdAt: payment.createdAt,
      })
      .from(payment)
      .leftJoin(user, eq(payment.userId, user.id))
      .where(gte(payment.createdAt, startDate))
      .orderBy(desc(payment.createdAt))
      .limit(100);

    const creditPackRows = await db
      .select({
        id: creditTransactions.id,
        userId: creditTransactions.userId,
        userEmail: user.email,
        metadata: creditTransactions.metadata,
        createdAt: creditTransactions.createdAt,
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
        description: parsed.productName || `${parsed.credits} credits`,
      };
    });

    const allCreditPackRows = await db
      .select({ metadata: creditTransactions.metadata })
      .from(creditTransactions)
      .where(eq(creditTransactions.source, 'purchase'));

    const totalRevenue = allCreditPackRows.reduce(
      (sum, row) => sum + parsePurchaseMetadata(row.metadata).amount,
      0
    );

    const revenueInRange = creditPackPayments.reduce((sum, item) => sum + item.amount, 0);

    const recentSubscriptionPayments = recentPayments.map((p) => ({
      ...p,
      amount: 0,
      currency: 'usd',
      provider: p.provider || 'unknown',
      type: 'subscription' as const,
      credits: null,
      description: p.priceId || p.interval || 'Subscription',
    }));

    const combinedRecentPayments = [...creditPackPayments, ...recentSubscriptionPayments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const transactionsCount = creditPackPayments.length;
    const averageTransaction = transactionsCount > 0 ? revenueInRange / transactionsCount : 0;

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

    const trend = Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    const response = NextResponse.json({
      summary: {
        totalRevenue,
        revenueInRange,
        transactionCount: transactionsCount,
        averageTransaction,
      },
      trend,
      recentPayments: combinedRecentPayments,
    });

    // Prevent caching of admin data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');

    return response;
  } catch (error: unknown) {
    console.error('Admin payments error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}
