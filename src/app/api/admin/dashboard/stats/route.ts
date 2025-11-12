import { db } from '@/server/db';
import { user, subscription, payment, creditTransactions } from '@/server/db/schema';
import { requireAdmin } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';
import { eq, gte, and, sql } from 'drizzle-orm';

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

    // Get today's revenue
    const todayRevenue = await db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(payment)
      .where(gte(payment.createdAt, today));

    // Get today's image credits consumed
    const todayImageCredits = await db
      .select({ total: sql<number>`COALESCE(SUM(ABS(amount)), 0)` })
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.type, 'image_generation'),
          gte(creditTransactions.createdAt, today)
        )
      );

    // Get today's video credits consumed
    const todayVideoCredits = await db
      .select({ total: sql<number>`COALESCE(SUM(ABS(amount)), 0)` })
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.type, 'video_generation'),
          gte(creditTransactions.createdAt, today)
        )
      );

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

    // Get credits trend (last 30 days)
    const creditsTrend = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        SUM(CASE WHEN source = 'api_call' AND amount < 0 THEN ABS(amount) ELSE 0 END) as "imageCredits",
        SUM(CASE WHEN source = 'api_call' AND amount < 0 THEN ABS(amount) ELSE 0 END) as "videoCredits"
      FROM ${creditTransactions}
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    return NextResponse.json({
      kpis: {
        todayRegistrations: Number(todayRegistrations[0]?.count) || 0,
        registrationsInRange: Number(registrationsInRange[0]?.count) || 0,
        activeSubscriptions: Number(activeSubscriptions[0]?.count) || 0,
        todayRevenue: Number(todayRevenue[0]?.total) || 0,
        todayImageCredits: Number(todayImageCredits[0]?.total) || 0,
        todayVideoCredits: Number(todayVideoCredits[0]?.total) || 0,
      },
      trends: {
        registrations: registrationTrend.rows,
        credits: creditsTrend.rows,
      },
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

