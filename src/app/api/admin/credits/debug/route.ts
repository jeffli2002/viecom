import { db } from '@/server/db';
import { creditTransactions, user, userCredits } from '@/server/db/schema';
import { requireAdmin } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';
import { sql, gte } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all credit transactions for today
    const allTransactions = await db
      .select({
        id: creditTransactions.id,
        userId: creditTransactions.userId,
        type: creditTransactions.type,
        amount: creditTransactions.amount,
        source: creditTransactions.source,
        description: creditTransactions.description,
        createdAt: creditTransactions.createdAt,
      })
      .from(creditTransactions)
      .where(gte(creditTransactions.createdAt, today))
      .limit(50);

    // Get unique users with transactions today
    const usersWithTransactions = await db.execute(sql`
      SELECT 
        u.id,
        u.email,
        u.name,
        ct.type,
        ct.source,
        ct.description,
        ct.amount,
        COUNT(*) as transaction_count,
        SUM(ABS(ct.amount)) as total_abs_amount
      FROM ${user} u
      INNER JOIN ${creditTransactions} ct ON u.id = ct.user_id
      WHERE ct.created_at >= ${today}
      GROUP BY u.id, u.email, u.name, ct.type, ct.source, ct.description, ct.amount
      ORDER BY u.email
    `);

    // Test the exact query used in Top 10
    const top10Test = await db.execute(sql`
      SELECT 
        u.id,
        u.email,
        u.name,
        COALESCE(SUM(CASE WHEN ct.type = 'spend' AND ct.source = 'api_call' AND ct.amount < 0 THEN ABS(ct.amount) ELSE 0 END), 0) as total_consumed,
        COALESCE(SUM(CASE WHEN ct.type = 'spend' AND ct.source = 'api_call' AND ct.amount < 0 AND (ct.description LIKE '%image%' OR ct.description LIKE '%Image%') THEN ABS(ct.amount) ELSE 0 END), 0) as image_credits,
        COALESCE(SUM(CASE WHEN ct.type = 'spend' AND ct.source = 'api_call' AND ct.amount < 0 AND (ct.description LIKE '%video%' OR ct.description LIKE '%Video%') THEN ABS(ct.amount) ELSE 0 END), 0) as video_credits,
        COALESCE(MAX(uc.balance) - MAX(uc.frozen_balance), 0) as remaining
      FROM ${user} u
      LEFT JOIN ${creditTransactions} ct ON u.id = ct.user_id AND ct.created_at >= ${today}
      LEFT JOIN ${userCredits} uc ON u.id = uc.user_id
      GROUP BY u.id, u.email, u.name
      ORDER BY total_consumed DESC
      LIMIT 10
    `);

    // Total credits consumed (for comparison)
    const totalConsumed = await db.execute(sql`
      SELECT 
        type,
        source,
        description,
        SUM(ABS(amount)) as total
      FROM ${creditTransactions}
      WHERE created_at >= ${today}
      GROUP BY type, source, description
    `);

    return NextResponse.json({
      debug: {
        message: 'Debug data for today',
        today: today.toISOString(),
      },
      allTransactions,
      usersWithTransactions: usersWithTransactions.rows,
      top10Test: top10Test.rows,
      totalConsumed: totalConsumed.rows,
    });

  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { 
        error: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}

