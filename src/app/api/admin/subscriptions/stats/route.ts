import { db } from '@/server/db';
import { subscription, user } from '@/server/db/schema';
import { requireAdmin } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';
import { sql, eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    // Verify admin
    await requireAdmin();

    // Get plan counts
    const planCounts = await db.execute(sql`
      SELECT 
        COALESCE(plan_type, 'free') as plan,
        COUNT(*) as count
      FROM ${subscription}
      GROUP BY plan_type
    `);

    // Get status counts
    const statusCounts = await db.execute(sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM ${subscription}
      GROUP BY status
    `);

    // Get recent subscriptions (last 50)
    const recentSubscriptions = await db
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

    // Parse plan counts
    const planCountsMap: any = { free: 0, pro: 0, proplus: 0 };
    planCounts.rows.forEach((row: any) => {
      planCountsMap[row.plan] = Number(row.count);
    });

    // Parse status counts
    const statusCountsMap: any = { active: 0, canceled: 0, expired: 0 };
    statusCounts.rows.forEach((row: any) => {
      statusCountsMap[row.status] = Number(row.count);
    });

    return NextResponse.json({
      planCounts: planCountsMap,
      statusCounts: statusCountsMap,
      recentSubscriptions,
    });
  } catch (error: any) {
    console.error('Admin subscriptions stats error:', error);
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch subscriptions stats' },
      { status: 500 }
    );
  }
}

