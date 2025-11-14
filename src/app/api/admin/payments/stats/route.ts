import { requireAdmin } from '@/lib/admin/auth';
import { db } from '@/server/db';
import { payment, user } from '@/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
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

    // Note: payment table doesn't have amount/currency columns yet
    // TODO: Add amount and currency columns to payment schema

    // Get payment count in range
    const paymentCount = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(payment)
      .where(sql`created_at >= ${startDate}`);

    // Get recent payments (without amount/currency)
    const recentPayments = await db
      .select({
        id: payment.id,
        userEmail: user.email,
        status: payment.status,
        createdAt: payment.createdAt,
        provider: payment.provider,
        priceId: payment.priceId,
        type: payment.type,
      })
      .from(payment)
      .leftJoin(user, eq(payment.userId, user.id))
      .orderBy(desc(payment.createdAt))
      .limit(50);

    const response = NextResponse.json({
      summary: {
        totalRevenue: 0, // TODO: Add amount column to payment table
        revenueInRange: 0, // TODO: Calculate from subscription plans
        transactionCount: Number(paymentCount[0]?.count) || 0,
        averageTransaction: 0, // TODO: Calculate when amount is available
      },
      trend: [], // TODO: Calculate trend when amount is available
      recentPayments: recentPayments.map((p) => ({
        ...p,
        amount: 0, // TODO: Calculate from priceId or add amount column
        currency: 'usd',
      })),
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
