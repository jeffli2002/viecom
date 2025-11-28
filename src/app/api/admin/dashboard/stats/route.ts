import { paymentConfig } from '@/config/payment.config';
import { requireAdmin } from '@/lib/admin/auth';
import { getPlanPriceByPriceId } from '@/lib/admin/revenue-utils';
import { db } from '@/server/db';
import {
  creditPackPurchase,
  creditTransactions,
  generatedAsset,
  payment,
  subscription,
  user,
} from '@/server/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

const _parsePurchaseMetadata = (metadata: string | null) => {
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
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'today';

    let startDate: Date;
    let endDate: Date;

    if (range === 'custom') {
      const startParam = searchParams.get('start');
      const endParam = searchParams.get('end');
      if (!startParam || !endParam) {
        return NextResponse.json(
          { error: 'Custom range requires start and end dates' },
          { status: 400 }
        );
      }
      startDate = new Date(startParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(endParam);
      endDate.setHours(23, 59, 59, 999);
    } else if (range === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else {
      const daysAgo = range === '7d' ? 7 : range === '30d' ? 30 : 90;
      startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    const registrations = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(and(gte(user.createdAt, startDate), sql`${user.createdAt} <= ${endDate}`));

    const subscriptionUsersResult = await db
      .select({ count: sql<number>`count(DISTINCT ${payment.userId})` })
      .from(payment)
      .where(and(gte(payment.createdAt, startDate), sql`${payment.createdAt} <= ${endDate}`));

    const packPurchaseUsersResult = await db
      .select({ count: sql<number>`count(DISTINCT ${creditPackPurchase.userId})` })
      .from(creditPackPurchase)
      .where(
        and(
          gte(creditPackPurchase.createdAt, startDate),
          sql`${creditPackPurchase.createdAt} <= ${endDate}`,
          eq(creditPackPurchase.testMode, false)
        )
      );

    const subscriptionPayments = await db
      .select({
        priceId: payment.priceId,
        createdAt: payment.createdAt,
      })
      .from(payment)
      .where(and(gte(payment.createdAt, startDate), sql`${payment.createdAt} <= ${endDate}`));

    const subscriptionRevenue = subscriptionPayments.reduce(
      (sum, row) => sum + getPlanPriceByPriceId(row.priceId),
      0
    );

    const packPurchases = await db
      .select({
        amountCents: creditPackPurchase.amountCents,
        createdAt: creditPackPurchase.createdAt,
      })
      .from(creditPackPurchase)
      .where(
        and(
          gte(creditPackPurchase.createdAt, startDate),
          sql`${creditPackPurchase.createdAt} <= ${endDate}`,
          eq(creditPackPurchase.testMode, false)
        )
      );

    const packRevenue = packPurchases.reduce((sum, row) => sum + row.amountCents / 100, 0);

    const totalRevenue = subscriptionRevenue + packRevenue;

    const imageCreditsResult = await db
      .select({ total: sql<number>`COALESCE(SUM(credits_spent), 0)` })
      .from(generatedAsset)
      .where(
        and(
          eq(generatedAsset.assetType, 'image'),
          eq(generatedAsset.status, 'completed'),
          gte(generatedAsset.createdAt, startDate),
          sql`${generatedAsset.createdAt} <= ${endDate}`
        )
      );

    const videoCreditsResult = await db
      .select({ total: sql<number>`COALESCE(SUM(credits_spent), 0)` })
      .from(generatedAsset)
      .where(
        and(
          eq(generatedAsset.assetType, 'video'),
          eq(generatedAsset.status, 'completed'),
          gte(generatedAsset.createdAt, startDate),
          sql`${generatedAsset.createdAt} <= ${endDate}`
        )
      );

    const imageCredits = Number(imageCreditsResult[0]?.total) || 0;
    const videoCredits = Number(videoCreditsResult[0]?.total) || 0;
    const totalCredits = imageCredits + videoCredits;

    const registrationTrend = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM ${user}
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    const creditsTrend = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(CASE WHEN asset_type = 'image' AND status = 'completed' THEN credits_spent ELSE 0 END), 0) as "imageCredits",
        COALESCE(SUM(CASE WHEN asset_type = 'video' AND status = 'completed' THEN credits_spent ELSE 0 END), 0) as "videoCredits"
      FROM ${generatedAsset}
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    const response = NextResponse.json({
      kpis: {
        registrations: Number(registrations[0]?.count) || 0,
        subscriptionUsers: Number(subscriptionUsersResult[0]?.count) || 0,
        packPurchaseUsers: Number(packPurchaseUsersResult[0]?.count) || 0,
        totalRevenue,
        subscriptionRevenue,
        packRevenue,
        totalCredits,
        imageCredits,
        videoCredits,
      },
      revenueSummary: {
        subscriptionRevenueInRange: subscriptionRevenue,
        packRevenueInRange: packRevenue,
        totalRevenueInRange: totalRevenue,
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
