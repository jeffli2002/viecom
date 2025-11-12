import { db } from '@/server/db';
import { payment, user } from '@/server/db/schema';
import { requireAdmin } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';
import { sql, gte, eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    // Verify admin
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    const daysAgo = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get total revenue (all time)
    const totalRevenue = await db
      .select({
        total: sql<number>`COALESCE(SUM(amount), 0)`,
      })
      .from(payment)
      .where(eq(payment.status, 'succeeded'));

    // Get revenue in range
    const revenueInRange = await db
      .select({
        total: sql<number>`COALESCE(SUM(amount), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(payment)
      .where(
        sql`status = 'succeeded' AND created_at >= ${startDate}`
      );

    // Get revenue trend
    const revenueTrend = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(amount), 0) as amount,
        COUNT(*) as count
      FROM ${payment}
      WHERE created_at >= ${startDate} AND status = 'succeeded'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Get recent payments
    const recentPayments = await db
      .select({
        id: payment.id,
        userEmail: user.email,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        createdAt: payment.createdAt,
        provider: payment.provider,
      })
      .from(payment)
      .leftJoin(user, eq(payment.userId, user.id))
      .orderBy(desc(payment.createdAt))
      .limit(50);

    const revenueData = revenueInRange[0];
    const avgTransaction = revenueData.count > 0 
      ? Number(revenueData.total) / Number(revenueData.count) 
      : 0;

    return NextResponse.json({
      summary: {
        totalRevenue: Number(totalRevenue[0]?.total) || 0,
        revenueInRange: Number(revenueData?.total) || 0,
        transactionCount: Number(revenueData?.count) || 0,
        averageTransaction: avgTransaction,
      },
      trend: revenueTrend.rows,
      recentPayments,
    });
  } catch (error: any) {
    console.error('Admin payments stats error:', error);
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch payments stats' },
      { status: 500 }
    );
  }
}

