import { db } from '@/server/db';
import { subscription, user, payment } from '@/server/db/schema';
import { requireAdmin } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';
import { eq, sql, gte, desc } from 'drizzle-orm';

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
        plan,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count
      FROM ${subscription}
      GROUP BY plan
    `);

    // Get recent subscriptions with user info
    const recentSubscriptions = await db
      .select({
        id: subscription.id,
        userId: subscription.userId,
        userEmail: user.email,
        userName: user.name,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
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
        plan
      FROM ${subscription}
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at), plan
      ORDER BY date ASC
    `);

    return NextResponse.json({
      planStats: planStats.rows,
      recentSubscriptions,
      trend: subscriptionTrend.rows,
    });
  } catch (error: any) {
    console.error('Admin subscriptions error:', error);
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

