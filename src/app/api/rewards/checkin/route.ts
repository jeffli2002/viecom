import { creditsConfig } from '@/config/credits.config';
import { auth } from '@/lib/auth/auth';
import { creditService } from '@/lib/credits';
import { db } from '@/server/db';
import { userDailyCheckin } from '@/server/db/schema';
import { eq, desc, gte, and } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Check if user already checked in today
    const existingCheckin = await db
      .select()
      .from(userDailyCheckin)
      .where(and(
        eq(userDailyCheckin.checkinDate, today),
        eq(userDailyCheckin.userId, userId)
      ))
      .limit(1);

    if (existingCheckin.length > 0) {
      // Verify if credits were actually awarded by checking for the transaction
      const { creditTransactions } = await import('@/server/db/schema');
      const referenceId = `checkin_${userId}_${today}`;
      
      const creditTransaction = await db
        .select()
        .from(creditTransactions)
        .where(and(
          eq(creditTransactions.userId, userId),
          eq(creditTransactions.referenceId, referenceId)
        ))
        .limit(1);

      if (creditTransaction.length === 0) {
        // Checkin record exists but no credit transaction - something went wrong
        console.warn('[Checkin] Found orphaned checkin record (no credits awarded), deleting it:', {
          userId,
          today,
          checkinId: existingCheckin[0].id,
        });
        
        // Delete the orphaned checkin record to allow retry
        await db
          .delete(userDailyCheckin)
          .where(eq(userDailyCheckin.id, existingCheckin[0].id));
        
        console.log('[Checkin] Orphaned record deleted, proceeding with checkin');
        // Continue with normal checkin flow below
      } else {
        // Both checkin and credit transaction exist - already checked in
        return NextResponse.json(
          {
            success: false,
            error: 'Already checked in today',
            data: {
              checkinDate: today,
              consecutiveDays: existingCheckin[0].consecutiveDays,
              creditsEarned: existingCheckin[0].creditsEarned,
              weeklyBonusEarned: existingCheckin[0].weeklyBonusEarned,
            },
          },
          { status: 400 }
        );
      }
    }

    // Get last checkin to calculate consecutive days
    const lastCheckin = await db
      .select()
      .from(userDailyCheckin)
      .where(eq(userDailyCheckin.userId, userId))
      .orderBy(desc(userDailyCheckin.checkinDate))
      .limit(1);

    let consecutiveDays = 1;
    if (lastCheckin.length > 0) {
      const lastDate = new Date(lastCheckin[0].checkinDate);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        consecutiveDays = lastCheckin[0].consecutiveDays + 1;
      } else {
        // Reset consecutive days
        consecutiveDays = 1;
      }
    }

    // Calculate credits to award
    const dailyCredits = creditsConfig.rewards.checkin.dailyCredits;
    let totalCredits = dailyCredits;
    let weeklyBonusEarned = false;

    // Check if user qualifies for weekly bonus
    if (consecutiveDays >= creditsConfig.rewards.checkin.consecutiveDaysRequired) {
      // Check if weekly bonus was already awarded in the last 7 days
      const recentCheckins = await db
        .select()
        .from(userDailyCheckin)
        .where(eq(userDailyCheckin.userId, userId))
        .orderBy(desc(userDailyCheckin.checkinDate))
        .limit(creditsConfig.rewards.checkin.consecutiveDaysRequired);

      const hasRecentWeeklyBonus = recentCheckins.some(
        (c) => c.weeklyBonusEarned && c.consecutiveDays >= creditsConfig.rewards.checkin.consecutiveDaysRequired
      );

      if (!hasRecentWeeklyBonus) {
        totalCredits += creditsConfig.rewards.checkin.weeklyBonusCredits;
        weeklyBonusEarned = true;
      }
    }

    // Create checkin record and award credits (neon-http doesn't support transactions)
    const checkinId = randomUUID();
    
    console.log('[Checkin] Creating checkin record:', {
      userId,
      today,
      consecutiveDays,
      totalCredits,
      weeklyBonusEarned,
    });
    
    // Create checkin record first
    await db.insert(userDailyCheckin).values({
      id: checkinId,
      userId,
      checkinDate: today,
      consecutiveDays,
      creditsEarned: totalCredits,
      weeklyBonusEarned,
    });

    console.log('[Checkin] Checkin record created, awarding credits...');

    // Award credits
    const referenceId = `checkin_${userId}_${today}`;
    try {
      const creditTransaction = await creditService.earnCredits({
        userId,
        amount: totalCredits,
        source: 'checkin',
        description: weeklyBonusEarned
          ? `Daily checkin (Day ${consecutiveDays}) + Weekly bonus`
          : `Daily checkin (Day ${consecutiveDays})`,
        referenceId,
        metadata: {
          checkinDate: today,
          consecutiveDays,
          weeklyBonusEarned,
        },
      });
      
      console.log('[Checkin] Credits awarded successfully:', creditTransaction);
    } catch (creditError) {
      console.error('[Checkin] Failed to award credits:', creditError);
      // Note: Checkin record already created, but credits failed
      // This needs manual intervention or a cleanup job
      throw new Error(`Checkin created but credits failed: ${creditError}`);
    }

    const result = {
      checkinId,
      checkinDate: today,
      consecutiveDays,
      creditsEarned: totalCredits,
      weeklyBonusEarned,
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error processing checkin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Get today's checkin status
    const todayCheckin = await db
      .select()
      .from(userDailyCheckin)
      .where(eq(userDailyCheckin.checkinDate, today))
      .where(eq(userDailyCheckin.userId, userId))
      .limit(1);

    // Get last checkin for consecutive days
    const lastCheckin = await db
      .select()
      .from(userDailyCheckin)
      .where(eq(userDailyCheckin.userId, userId))
      .orderBy(desc(userDailyCheckin.checkinDate))
      .limit(1);

    // Get recent checkins for calendar display (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const recentCheckins = await db
      .select()
      .from(userDailyCheckin)
      .where(
        and(
          eq(userDailyCheckin.userId, userId),
          gte(userDailyCheckin.checkinDate, sevenDaysAgoStr)
        )
      )
      .orderBy(desc(userDailyCheckin.checkinDate));

    let consecutiveDays = 0;
    if (lastCheckin.length > 0) {
      const lastDate = new Date(lastCheckin[0].checkinDate);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Already checked in today
        consecutiveDays = lastCheckin[0].consecutiveDays;
      } else if (diffDays === 1) {
        // Consecutive day (but not checked in yet today)
        consecutiveDays = lastCheckin[0].consecutiveDays;
      } else {
        // Reset
        consecutiveDays = 0;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        checkedInToday: todayCheckin.length > 0,
        consecutiveDays,
        todayCheckin: todayCheckin[0] || null,
        lastCheckin: lastCheckin[0] || null,
        recentCheckins: recentCheckins.map((c) => ({
          checkinDate: c.checkinDate,
          consecutiveDays: c.consecutiveDays,
          creditsEarned: c.creditsEarned,
          weeklyBonusEarned: c.weeklyBonusEarned,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching checkin status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

