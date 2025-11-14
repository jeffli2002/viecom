import { requireAdmin } from '@/lib/admin/auth';
import { db } from '@/server/db';
import { payment, user } from '@/server/db/schema';
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

    // Note: payment table doesn't have amount/currency columns yet
    // TODO: Add amount and currency columns to payment schema

    // Get payment count
    const paymentCount = await db
      .select({
        count: sql<number>`count(*)`,
      })
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

    // Calculate revenue from subscription plans (temporary solution)
    // This is approximate based on plan types in payments
    const revenueEstimate = recentPayments.length * 14.9; // Average plan price

    const response = NextResponse.json({
      summary: {
        totalRevenue: 0, // TODO: Calculate from subscription plans or add amount column
        paymentCount: Number(paymentCount[0]?.count) || 0,
        avgPayment: 0, // TODO: Calculate when amount column is added
        revenueInRange: revenueEstimate,
        transactionCount: recentPayments.length,
        averageTransaction: recentPayments.length > 0 ? revenueEstimate / recentPayments.length : 0,
      },
      trend: [], // TODO: Calculate from subscription plans
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
    console.error('Admin payments error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}
