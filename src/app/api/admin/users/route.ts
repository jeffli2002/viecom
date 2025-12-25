import { requireAdmin } from '@/lib/admin/auth';
import { db } from '@/server/db';
import { creditPackPurchase, subscription, user, userCredits } from '@/server/db/schema';
import { and, desc, eq, like, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Verify admin
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const range = searchParams.get('range') || 'all';
    const verified = searchParams.get('verified') || 'all';
    const paid = searchParams.get('paid') || 'all';
    const limit = Number.parseInt(searchParams.get('limit') || '100');
    const offset = Number.parseInt(searchParams.get('offset') || '0');

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

    const paidSubscription = sql`exists (select 1 from ${subscription} paid_sub where paid_sub.user_id = ${user.id} and paid_sub.plan_type <> 'free')`;
    const paidCreditPack = sql`exists (select 1 from ${creditPackPurchase} paid_pack where paid_pack.user_id = ${user.id})`;
    const filters = [];

    if (startDate) {
      filters.push(sql`${user.createdAt} >= ${startDate}`);
    }
    if (search) {
      filters.push(like(user.email, `%${search}%`));
    }
    if (verified === 'yes') {
      filters.push(eq(user.emailVerified, true));
    } else if (verified === 'no') {
      filters.push(eq(user.emailVerified, false));
    }
    if (paid === 'yes') {
      filters.push(sql`(${paidSubscription} OR ${paidCreditPack})`);
    } else if (paid === 'no') {
      filters.push(sql`NOT (${paidSubscription} OR ${paidCreditPack})`);
    }

    // Build query
    let query = db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        emailVerified: user.emailVerified,
        banned: user.banned,
        banReason: user.banReason,
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

    if (filters.length > 0) {
      query = query.where(and(...filters));
    }

    const usersList = await query;

    // Get total count
    let totalCountQuery = db.select({ count: sql<number>`count(*)` }).from(user);

    if (filters.length > 0) {
      totalCountQuery = totalCountQuery.where(and(...filters));
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
  } catch (error: unknown) {
    console.error('Admin users list error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
