import { requireAdmin } from '@/lib/admin/auth';
import { db } from '@/server/db';
import { creditTransactions, generatedAsset, user, userCredits } from '@/server/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Verify admin
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'today';

    const startDate = new Date();
    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else {
      const daysAgo = range === '7d' ? 7 : range === '30d' ? 30 : 90;
      startDate.setDate(startDate.getDate() - daysAgo);
    }

    // Get total credits consumed (all spend transactions, not just api_call)
    const totalConsumed = await db
      .select({
        total: sql<number>`COALESCE(SUM(ABS(amount)), 0)`,
      })
      .from(creditTransactions)
      .where(
        and(eq(creditTransactions.type, 'spend'), gte(creditTransactions.createdAt, startDate))
      );

    // Get image credits consumed (check description for image generation, any source)
    const imageCredits = await db.execute(sql`
      SELECT COALESCE(SUM(ABS(amount)), 0) as total
      FROM ${creditTransactions}
      WHERE type = 'spend'
        AND created_at >= ${startDate}
        AND (description LIKE '%image%' OR description LIKE '%Image%')
    `);

    // Get video credits consumed (check description for video generation, any source)
    const videoCredits = await db.execute(sql`
      SELECT COALESCE(SUM(ABS(amount)), 0) as total
      FROM ${creditTransactions}
      WHERE type = 'spend'
        AND created_at >= ${startDate}
        AND (description LIKE '%video%' OR description LIKE '%Video%')
    `);

    // Get top 10 users by credit consumption
    // Use a more inclusive query - check for any spend transaction, not just api_call
    const top10Users = await db.execute(sql`
      SELECT 
        u.id,
        u.email,
        u.name,
        COALESCE(SUM(CASE WHEN ct.type = 'spend' THEN ABS(ct.amount) ELSE 0 END), 0) as total_consumed,
        COALESCE(SUM(CASE WHEN ct.type = 'spend' AND (ct.description LIKE '%image%' OR ct.description LIKE '%Image%' OR ct.source = 'api_call') THEN ABS(ct.amount) ELSE 0 END), 0) as image_credits,
        COALESCE(SUM(CASE WHEN ct.type = 'spend' AND (ct.description LIKE '%video%' OR ct.description LIKE '%Video%') THEN ABS(ct.amount) ELSE 0 END), 0) as video_credits,
        COALESCE(MAX(uc.balance) - MAX(uc.frozen_balance), 0) as remaining
      FROM ${user} u
      LEFT JOIN ${creditTransactions} ct ON u.id = ct.user_id AND ct.created_at >= ${startDate}
      LEFT JOIN ${userCredits} uc ON u.id = uc.user_id
      GROUP BY u.id, u.email, u.name
      HAVING COALESCE(SUM(CASE WHEN ct.type = 'spend' THEN ABS(ct.amount) ELSE 0 END), 0) > 0
      ORDER BY total_consumed DESC
      LIMIT 10
    `);

    // Get completed asset counts
    const generationCounts = await db.execute(sql`
      SELECT 
        asset_type,
        COUNT(*)::int as count
      FROM ${generatedAsset}
      WHERE status = 'completed' AND created_at >= ${startDate}
      GROUP BY asset_type
    `);

    const imageGenerations =
      generationCounts.rows.find((row) => row.asset_type === 'image')?.count ?? 0;
    const videoGenerations =
      generationCounts.rows.find((row) => row.asset_type === 'video')?.count ?? 0;

    // Get daily generation trend based on actual assets
    const generationTrend = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(CASE WHEN asset_type = 'image' THEN 1 ELSE 0 END), 0)::int as "imageCount",
        COALESCE(SUM(CASE WHEN asset_type = 'video' THEN 1 ELSE 0 END), 0)::int as "videoCount"
      FROM ${generatedAsset}
      WHERE status = 'completed' AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    const response = NextResponse.json({
      summary: {
        totalConsumed: Number(totalConsumed[0]?.total) || 0,
        imageCredits: Number(imageCredits.rows[0]?.total) || 0,
        videoCredits: Number(videoCredits.rows[0]?.total) || 0,
        imageGenerations,
        videoGenerations,
      },
      top10Users: top10Users.rows,
      trend: generationTrend.rows,
    });

    // Prevent caching of admin data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');

    return response;
  } catch (error: unknown) {
    console.error('Admin credits summary error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch credits summary' }, { status: 500 });
  }
}
