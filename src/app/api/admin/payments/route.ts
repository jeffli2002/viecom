import { db } from '@/server/db';
import { payment, user } from '@/server/db/schema';
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

    // Get total revenue
    const totalRevenue = await db
      .select({
        total: sql<number>`COALESCE(SUM(amount), 0)`,
      })
      .from(payment)
      .where(gte(payment.createdAt, startDate));

    // Get payment count
    const paymentCount = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(payment)
      .where(gte(payment.createdAt, startDate));

    // Get average payment
    const avgPayment = await db
      .select({
        avg: sql<number>`COALESCE(AVG(amount), 0)`,
      })
      .from(payment)
      .where(gte(payment.createdAt, startDate));

    // Get daily revenue trend
    const revenueTrend = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        SUM(amount) as revenue,
        COUNT(*) as count
      FROM ${payment}
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Get recent payments with user info
    const recentPayments = await db
      .select({
        id: payment.id,
        userId: payment.userId,
        userEmail: user.email,
        userName: user.name,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        provider: payment.provider,
        createdAt: payment.createdAt,
      })
      .from(payment)
      .leftJoin(user, eq(payment.userId, user.id))
      .where(gte(payment.createdAt, startDate))
      .orderBy(desc(payment.createdAt))
      .limit(100);

    return NextResponse.json({
      summary: {
        totalRevenue: Number(totalRevenue[0]?.total) || 0,
        paymentCount: Number(paymentCount[0]?.count) || 0,
        avgPayment: Number(avgPayment[0]?.avg) || 0,
      },
      trend: revenueTrend.rows,
      recentPayments,
    });
  } catch (error: any) {
    console.error('Admin payments error:', error);
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

