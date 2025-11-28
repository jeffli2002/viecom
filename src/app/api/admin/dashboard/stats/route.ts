import { paymentConfig } from '@/config/payment.config';
import { requireAdmin } from '@/lib/admin/auth';
import { db } from '@/server/db';
import {
  creditTransactions,
  generatedAsset,
  payment,
  subscription,
  user,
} from '@/server/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

const parsePurchaseMetadata = (metadata: string | null) => {
  if (!metadata) {
    return { amount: 0, currency: 'USD', provider: 'unknown', credits: 0 };
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
    };
  } catch (error) {
    console.error('Failed to parse purchase metadata:', error);
    return { amount: 0, currency: 'USD', provider: 'unknown', credits: 0 };
  }
};

export async function GET(request: Request) {
  try {
    // Verify admin
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d'; // 7d, 30d, 90d

    // Calculate date range
    const daysAgo = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's registrations
    const todayRegistrations = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(gte(user.createdAt, today));

    // Get registrations in range
    const registrationsInRange = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(gte(user.createdAt, startDate));

    // Get active subscriptions
    const activeSubscriptions = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscription)
      .where(eq(subscription.status, 'active'));

    // Revenue calculations
    const subscriptionPaymentsInRange = await db
      .select({
        priceId: payment.priceId,
        createdAt: payment.createdAt,
      })
      .from(payment)
      .where(gte(payment.createdAt, startDate));

    const subscriptionPaymentsToday = subscriptionPaymentsInRange.filter(
      (row) => row.createdAt >= today
    );

    const subscriptionRevenueInRange = subscriptionPaymentsInRange.reduce(
      (sum, row) => sum + getPlanPriceByPriceId(row.priceId),
      0
    );
    const todaySubscriptionRevenue = subscriptionPaymentsToday.reduce(
      (sum, row) => sum + getPlanPriceByPriceId(row.priceId),
      0
    );

    const packPurchasesInRange = await db
      .select({
        amountCents: creditPackPurchase.amountCents,
        createdAt: creditPackPurchase.createdAt,
      })
      .from(creditPackPurchase)
      .where(gte(creditPackPurchase.createdAt, startDate));

    const packPurchasesToday = packPurchasesInRange.filter((row) => row.createdAt >= today);

    const packRevenueInRange = packPurchasesInRange.reduce(
      (sum, row) => sum + row.amountCents / 100,
      0
    );
    const todayPackRevenue = packPurchasesToday.reduce(
      (sum, row) => sum + row.amountCents / 100,
      0
    );

    const todayRevenueTotal = todaySubscriptionRevenue + todayPackRevenue;

    // Get today's credits consumed from generated assets
    const todayImageCreditsResult = await db
      .select({ total: sql<number>`COALESCE(SUM(credits_spent), 0)` })
      .from(generatedAsset)
      .where(
        and(
          eq(generatedAsset.assetType, 'image'),
          eq(generatedAsset.status, 'completed'),
          gte(generatedAsset.createdAt, today)
        )
      );

    const todayVideoCreditsResult = await db
      .select({ total: sql<number>`COALESCE(SUM(credits_spent), 0)` })
      .from(generatedAsset)
      .where(
        and(
          eq(generatedAsset.assetType, 'video'),
          eq(generatedAsset.status, 'completed'),
          gte(generatedAsset.createdAt, today)
        )
      );

    const todayImageCredits = todayImageCreditsResult;
    const todayVideoCredits = todayVideoCreditsResult;

    // Get registration trend (last 30 days)
    const registrationTrend = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM ${user}
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Get credits trend from generated assets (more accurate)
    const creditsTrend = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(CASE WHEN asset_type = 'image' AND status = 'completed' THEN credits_spent ELSE 0 END), 0) as "imageCredits",
        COALESCE(SUM(CASE WHEN asset_type = 'video' AND status = 'completed' THEN credits_spent ELSE 0 END), 0) as "videoCredits"
      FROM ${generatedAsset}
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    const response = NextResponse.json({
      kpis: {
        todayRegistrations: Number(todayRegistrations[0]?.count) || 0,
        registrationsInRange: Number(registrationsInRange[0]?.count) || 0,
        activeSubscriptions: Number(activeSubscriptions[0]?.count) || 0,
        todayRevenue: todayRevenueTotal,
        todaySubscriptionRevenue,
        todayPackRevenue,
        todayImageCredits: Number(todayImageCredits[0]?.total) || 0,
        todayVideoCredits: Number(todayVideoCredits[0]?.total) || 0,
      },
      revenueSummary: {
        subscriptionRevenueInRange,
        packRevenueInRange,
        totalRevenueInRange: subscriptionRevenueInRange + packRevenueInRange,
      },
      trends: {
        registrations: registrationTrend.rows,
        credits: creditsTrend.rows,
      },
    });

    // Prevent caching of admin data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');

    return response;
  } catch (error: unknown) {
    console.error('Admin stats error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
