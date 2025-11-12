import { db } from '@/server/db';
import { creditTransactions, user, userCredits } from '@/server/db/schema';
import { requireAdmin } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';
import { sql, gte, and, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    // Verify admin
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    const daysAgo = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get total credits consumed
    const totalConsumed = await db
      .select({
        total: sql<number>`COALESCE(SUM(ABS(amount)), 0)`,
      })
      .from(creditTransactions)
      .where(gte(creditTransactions.createdAt, startDate));

    // Get image credits consumed
    const imageCredits = await db
      .select({
        total: sql<number>`COALESCE(SUM(ABS(amount)), 0)`,
      })
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.type, 'image_generation'),
          gte(creditTransactions.createdAt, startDate)
        )
      );

    // Get video credits consumed
    const videoCredits = await db
      .select({
        total: sql<number>`COALESCE(SUM(ABS(amount)), 0)`,
      })
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.type, 'video_generation'),
          gte(creditTransactions.createdAt, startDate)
        )
      );

    // Get top 10 users by credit consumption
    const top10Users = await db.execute(sql`
      SELECT 
        u.id,
        u.email,
        u.name,
        COALESCE(SUM(CASE WHEN ct.amount < 0 THEN ABS(ct.amount) ELSE 0 END), 0) as total_consumed,
        COALESCE(SUM(CASE WHEN ct.amount < 0 AND ct.source = 'api_call' THEN ABS(ct.amount) ELSE 0 END), 0) as image_credits,
        COALESCE(SUM(CASE WHEN ct.amount < 0 AND ct.source = 'api_call' THEN ABS(ct.amount) ELSE 0 END), 0) as video_credits,
        (uc.balance - uc.frozen_balance) as remaining
      FROM ${user} u
      LEFT JOIN ${creditTransactions} ct ON u.id = ct.user_id AND ct.created_at >= ${startDate}
      LEFT JOIN ${userCredits} uc ON u.id = uc.user_id
      GROUP BY u.id, u.email, u.name, uc.balance, uc.frozen_balance
      ORDER BY total_consumed DESC
      LIMIT 10
    `);

    // Get daily credits trend
    const creditsTrend = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        SUM(CASE WHEN type = 'image_generation' THEN ABS(amount) ELSE 0 END) as "imageCredits",
        SUM(CASE WHEN type = 'video_generation' THEN ABS(amount) ELSE 0 END) as "videoCredits"
      FROM ${creditTransactions}
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    return NextResponse.json({
      summary: {
        totalConsumed: Number(totalConsumed[0]?.total) || 0,
        imageCredits: Number(imageCredits[0]?.total) || 0,
        videoCredits: Number(videoCredits[0]?.total) || 0,
      },
      top10Users: top10Users.rows,
      trend: creditsTrend.rows,
    });
  } catch (error: any) {
    console.error('Admin credits summary error:', error);
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch credits summary' },
      { status: 500 }
    );
  }
}

