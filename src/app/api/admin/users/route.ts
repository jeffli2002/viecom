import { db } from '@/server/db';
import { user, subscription, userCredits } from '@/server/db/schema';
import { requireAdmin } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';
import { eq, like, desc, sql, gte } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    // Verify admin
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const range = searchParams.get('range') || 'all';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

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

    // Build query
    let query = db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        plan: subscription.planType,
        subscriptionStatus: subscription.status,
        availableBalance: sql<number>`COALESCE(${userCredits.balance} - ${userCredits.frozenBalance}, 0)`,
        totalEarned: userCredits.totalEarned,
        totalSpent: userCredits.totalSpent,
      })
      .from(user)
      .leftJoin(subscription, eq(user.id, subscription.userId))
      .leftJoin(userCredits, eq(user.id, userCredits.userId))
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);

    // Add date range filter
    if (startDate) {
      query = query.where(
        search 
          ? sql`${user.email} LIKE ${`%${search}%`} AND ${user.createdAt} >= ${startDate}`
          : sql`${user.createdAt} >= ${startDate}`
      );
    } else if (search) {
      query = query.where(like(user.email, `%${search}%`));
    }

    const usersList = await query;

    // Get total count
    let totalCountQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(user);

    if (startDate && search) {
      totalCountQuery = totalCountQuery.where(
        sql`${user.email} LIKE ${`%${search}%`} AND ${user.createdAt} >= ${startDate}`
      );
    } else if (startDate) {
      totalCountQuery = totalCountQuery.where(sql`${user.createdAt} >= ${startDate}`);
    } else if (search) {
      totalCountQuery = totalCountQuery.where(like(user.email, `%${search}%`));
    }

    const totalCount = await totalCountQuery;

    const response = NextResponse.json({
      users: usersList,
      total: Number(totalCount[0]?.count) || 0,
      limit,
      offset,
    });

    // Prevent caching of admin data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    
    return response;
  } catch (error: any) {
    console.error('Admin users list error:', error);
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

