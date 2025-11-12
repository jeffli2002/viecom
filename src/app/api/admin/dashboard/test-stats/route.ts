import { db } from '@/server/db';
import { user, subscription, payment, creditTransactions } from '@/server/db/schema';
import { requireAdmin } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';
import { eq, gte, and, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    // Verify admin
    await requireAdmin();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results: any = {};
    const errors: any = {};

    // Test 1: Today's registrations
    try {
      const todayRegistrations = await db
        .select({ count: sql<number>`count(*)` })
        .from(user)
        .where(gte(user.createdAt, today));
      results.todayRegistrations = todayRegistrations;
    } catch (error: any) {
      errors.todayRegistrations = error.message;
    }

    // Test 2: Active subscriptions
    try {
      const activeSubscriptions = await db
        .select({ count: sql<number>`count(*)` })
        .from(subscription)
        .where(eq(subscription.status, 'active'));
      results.activeSubscriptions = activeSubscriptions;
    } catch (error: any) {
      errors.activeSubscriptions = error.message;
    }

    // Test 3: Today's revenue
    try {
      const todayRevenue = await db
        .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
        .from(payment)
        .where(gte(payment.createdAt, today));
      results.todayRevenue = todayRevenue;
    } catch (error: any) {
      errors.todayRevenue = error.message;
    }

    // Test 4: Today's credits (the problematic query)
    try {
      const todayCreditsConsumed = await db
        .select({ total: sql<number>`COALESCE(SUM(ABS(amount)), 0)` })
        .from(creditTransactions)
        .where(
          and(
            eq(creditTransactions.type, 'spend'),
            eq(creditTransactions.source, 'api_call'),
            gte(creditTransactions.createdAt, today)
          )
        );
      results.todayCreditsConsumed = todayCreditsConsumed;
    } catch (error: any) {
      errors.todayCreditsConsumed = error.message;
    }

    // Test 5: Registration trend
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const registrationTrend = await db.execute(sql`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM ${user}
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `);
      results.registrationTrend = registrationTrend.rows;
    } catch (error: any) {
      errors.registrationTrend = error.message;
    }

    // Test 6: Credits trend
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const creditsTrend = await db.execute(sql`
        SELECT 
          DATE(created_at) as date,
          SUM(CASE WHEN type = 'spend' AND source = 'api_call' AND amount < 0 THEN ABS(amount) ELSE 0 END) as "imageCredits",
          SUM(CASE WHEN type = 'spend' AND source = 'api_call' AND amount < 0 THEN ABS(amount) ELSE 0 END) as "videoCredits"
        FROM ${creditTransactions}
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `);
      results.creditsTrend = creditsTrend.rows;
    } catch (error: any) {
      errors.creditsTrend = error.message;
    }

    return NextResponse.json({
      success: true,
      message: 'Test completed',
      results,
      errors,
      hasErrors: Object.keys(errors).length > 0
    });

  } catch (error: any) {
    console.error('Admin test stats error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}

