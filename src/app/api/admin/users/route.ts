import { db } from '@/server/db';
import { user, subscription, userCredits } from '@/server/db/schema';
import { requireAdmin } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';
import { eq, like, desc, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    // Verify admin
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        plan: subscription.plan,
        subscriptionStatus: subscription.status,
        availableBalance: sql<number>`${userCredits.balance} - ${userCredits.frozenBalance}`,
        totalEarned: userCredits.totalEarned,
        totalSpent: userCredits.totalSpent,
      })
      .from(user)
      .leftJoin(subscription, eq(user.id, subscription.userId))
      .leftJoin(userCredits, eq(user.id, userCredits.userId))
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);

    // Add search filter if provided
    if (search) {
      query = query.where(like(user.email, `%${search}%`));
    }

    const usersList = await query;

    // Get total count
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(search ? like(user.email, `%${search}%`) : undefined);

    return NextResponse.json({
      users: usersList,
      total: Number(totalCount[0]?.count) || 0,
      limit,
      offset,
    });
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

