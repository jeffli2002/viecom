import { requireAdmin } from '@/lib/admin/auth';
import { db } from '@/server/db';
import { creditTransactions, generatedAsset, user, userCredits } from '@/server/db/schema';
import { sql } from 'drizzle-orm';
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

    // Total credits consumed from all spend transactions within the range
    const totalCreditsResult = await db.execute(sql`
      SELECT COALESCE(SUM(ABS(amount)), 0)::int as "total"
      FROM ${creditTransactions}
      WHERE type = 'spend'
        AND created_at >= ${startDate}
    `);

    // Summaries based on generated assets for accurate per-type metrics
    const assetSummary = await db.execute(sql`
      SELECT 
        COALESCE(SUM(ga.credits_spent), 0)::int as "totalCredits",
        COALESCE(SUM(CASE WHEN ga.asset_type = 'image' THEN ga.credits_spent ELSE 0 END), 0)::int as "imageCredits",
        COALESCE(SUM(CASE WHEN ga.asset_type = 'video' THEN ga.credits_spent ELSE 0 END), 0)::int as "videoCredits",
        COALESCE(SUM(CASE WHEN ga.asset_type = 'image' THEN 1 ELSE 0 END), 0)::int as "imageGenerations",
        COALESCE(SUM(CASE WHEN ga.asset_type = 'video' THEN 1 ELSE 0 END), 0)::int as "videoGenerations"
      FROM ${generatedAsset} ga
      WHERE ga.status = 'completed' AND ga.created_at >= ${startDate}
    `);

    // Get top 10 users by credit consumption
    const top10Users = await db.execute(sql`
      SELECT 
        u.id,
        u.email,
        u.name,
        COALESCE(SUM(ga.credits_spent), 0)::int as total_consumed,
        COALESCE(SUM(CASE WHEN ga.asset_type = 'image' THEN ga.credits_spent ELSE 0 END), 0)::int as image_credits,
        COALESCE(SUM(CASE WHEN ga.asset_type = 'video' THEN ga.credits_spent ELSE 0 END), 0)::int as video_credits,
        (COALESCE(MAX(uc.balance), 0) - COALESCE(MAX(uc.frozen_balance), 0))::int as remaining
      FROM ${user} u
      LEFT JOIN ${generatedAsset} ga 
        ON ga.user_id = u.id 
        AND ga.status = 'completed' 
        AND ga.created_at >= ${startDate}
      LEFT JOIN ${userCredits} uc ON u.id = uc.user_id
      GROUP BY u.id, u.email, u.name
      HAVING COALESCE(SUM(ga.credits_spent), 0) > 0
      ORDER BY total_consumed DESC
      LIMIT 10
    `);

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
        totalConsumed: Number(totalCreditsResult.rows[0]?.total) || 0,
        imageCredits: Number(assetSummary.rows[0]?.imageCredits) || 0,
        videoCredits: Number(assetSummary.rows[0]?.videoCredits) || 0,
        imageGenerations: Number(assetSummary.rows[0]?.imageGenerations) || 0,
        videoGenerations: Number(assetSummary.rows[0]?.videoGenerations) || 0,
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
