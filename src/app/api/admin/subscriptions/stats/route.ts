import { requireAdmin } from '@/lib/admin/auth';
// @ts-nocheck
import { db } from '@/server/db';
import { subscription, user } from '@/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Verify admin
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'all';

    // Calculate date range
    let startDate: Date | null = null;
    if (range === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else if (range !== 'all') {
      startDate = new Date();
      const daysAgo = range === '7d' ? 7 : range === '30d' ? 30 : 90;
      startDate.setDate(startDate.getDate() - daysAgo);
    }

    // Get plan counts
    // Free users = all users - users with active paid subscriptions
    const totalUsers = await db.execute(sql`SELECT COUNT(*) as count FROM ${user}`);
    const paidUsers = await db.execute(sql`
      SELECT 
        plan_type as plan,
        COUNT(DISTINCT user_id) as count
      FROM ${subscription}
      WHERE plan_type IN ('pro', 'enterprise')
        AND status = 'active'
      GROUP BY plan_type
    `);

    // Calculate plan counts
    const planCountsMap: Record<'free' | 'pro' | 'proplus', number> = {
      free: 0,
      pro: 0,
      proplus: 0,
    };
    const paidUserRows = paidUsers.rows as Array<{ plan: string; count: number | string }>;

    let totalPaidUsers = 0;
    paidUserRows.forEach((row) => {
      const planName = row.plan === 'enterprise' ? 'proplus' : row.plan;
      planCountsMap[planName] = Number(row.count);
      totalPaidUsers += Number(row.count);
    });

    // Free users = total users - paid users
    planCountsMap.free = Number(totalUsers.rows[0].count) - totalPaidUsers;

    // Get status counts
    const statusCounts = await db.execute(sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM ${subscription}
      GROUP BY status
    `);

    // Parse status counts
    const statusCountsMap: Record<'active' | 'canceled' | 'expired' | 'trial', number> = {
      active: 0,
      canceled: 0,
      expired: 0,
      trial: 0,
    };
    const statusRows = statusCounts.rows as Array<{ status: string; count: number | string }>;
    statusRows.forEach((row) => {
      if (row.status in statusCountsMap) {
        statusCountsMap[row.status as keyof typeof statusCountsMap] = Number(row.count);
      }
    });

    // Get recent subscriptions (with date filter if applicable)
    let recentQuery = db
      .select({
        id: subscription.id,
        userId: subscription.userId,
        userEmail: user.email,
        plan: subscription.planType,
        status: subscription.status,
        startDate: subscription.periodStart,
        endDate: subscription.periodEnd,
        amount: sql<number>`0`, // TODO: Add amount calculation based on plan
      })
      .from(subscription)
      .leftJoin(user, eq(subscription.userId, user.id))
      .orderBy(desc(subscription.createdAt))
      .limit(50);

    if (startDate) {
      recentQuery = recentQuery.where(sql`${subscription.createdAt} >= ${startDate}`);
    }

    const recentSubscriptions = await recentQuery;

    const response = NextResponse.json({
      planCounts: planCountsMap,
      statusCounts: statusCountsMap,
      recentSubscriptions: recentSubscriptions || [],
      creditPackPurchases: [], // TODO: Implement credit pack purchases query
    });

    // Prevent caching of admin data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');

    return response;
  } catch (error: unknown) {
    console.error('Admin subscriptions stats error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch subscriptions stats' }, { status: 500 });
  }
}
