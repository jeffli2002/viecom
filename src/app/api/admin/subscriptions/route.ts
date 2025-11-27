import { paymentConfig } from '@/config/payment.config';
import { requireAdmin } from '@/lib/admin/auth';
import { db } from '@/server/db';
import { creditTransactions, subscription, user } from '@/server/db/schema';
import { desc, eq, gte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

const parsePurchaseMetadata = (metadata: string | null) => {
  if (!metadata) {
    return { amount: 0, currency: 'USD', credits: 0 };
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
      credits: creditsValue ?? pack?.credits ?? 0,
      productName: typeof parsed.productName === 'string' ? parsed.productName : pack?.name || '',
    };
  } catch (error) {
    console.error('Failed to parse purchase metadata:', error);
    return { amount: 0, currency: 'USD', credits: 0, productName: '' };
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

    // Get subscription stats by plan
    const planStats = await db.execute(sql`
      SELECT 
        plan_type as plan,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count
      FROM ${subscription}
      GROUP BY plan_type
    `);

    // Get recent subscriptions with user info
    const recentSubscriptions = await db
      .select({
        id: subscription.id,
        userId: subscription.userId,
        userEmail: user.email,
        userName: user.name,
        plan: subscription.planType,
        status: subscription.status,
        currentPeriodStart: subscription.periodStart,
        currentPeriodEnd: subscription.periodEnd,
        createdAt: subscription.createdAt,
      })
      .from(subscription)
      .leftJoin(user, eq(subscription.userId, user.id))
      .where(gte(subscription.createdAt, startDate))
      .orderBy(desc(subscription.createdAt))
      .limit(50);

    // Get subscription trend
    const subscriptionTrend = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        plan_type as plan
      FROM ${subscription}
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at), plan_type
      ORDER BY date ASC
    `);

    const creditPackPurchases = await db
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
      .limit(30);

    const parsedCreditPacks = creditPackPurchases.map((purchase) => {
      const parsed = parsePurchaseMetadata(purchase.metadata);
      return {
        id: purchase.id,
        userId: purchase.userId,
        userEmail: purchase.userEmail || 'Unknown',
        credits: parsed.credits,
        amount: parsed.amount,
        currency: parsed.currency,
        createdAt: purchase.createdAt,
        productName: parsed.productName || `${parsed.credits} credits`,
      };
    });

    return NextResponse.json({
      planStats: planStats.rows,
      recentSubscriptions,
      trend: subscriptionTrend.rows,
      creditPackPurchases: parsedCreditPacks,
    });
  } catch (error: unknown) {
    console.error('Admin subscriptions error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}
