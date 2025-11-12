import { db } from '@/server/db';
import { subscriptions, users } from '@/server/db/schema';
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
        COALESCE(plan, 'free') as plan,
        COUNT(*) as count
      FROM ${subscriptions}
      GROUP BY plan
    `);

    // Get status counts
    const statusCounts = await db.execute(sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM ${subscriptions}
      GROUP BY status
    `);

    // Get recent subscriptions (last 50)
    const recentSubscriptions = await db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        userEmail: users.email,
        plan: subscriptions.plan,
        status: subscriptions.status,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
        amount: subscriptions.amount,
      })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .orderBy(desc(subscriptions.createdAt))
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

