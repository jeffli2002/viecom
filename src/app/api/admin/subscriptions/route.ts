import { requireAdmin } from '@/lib/admin/auth';
import { db } from '@/server/db';
import { payment, subscription, user } from '@/server/db/schema';
import { desc, eq, gte, sql } from 'drizzle-orm';
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

    return NextResponse.json({
      planStats: planStats.rows,
      recentSubscriptions,
      trend: subscriptionTrend.rows,
    });
  } catch (error: unknown) {
    console.error('Admin subscriptions error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}
