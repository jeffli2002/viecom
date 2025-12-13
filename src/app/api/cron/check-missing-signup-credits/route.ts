import { paymentConfig } from '@/config/payment.config';
import { creditService } from '@/lib/credits';
import { db } from '@/server/db';
import { creditTransactions, user, userCredits } from '@/server/db/schema';
import { and, eq, gte, isNull, sql } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Background task to check and fix missing signup credits for new users
 * Should be called periodically (e.g., every hour) via cron job
 * 
 * This checks users registered in the last 24 hours who don't have:
 * 1. A credit account, OR
 * 2. A signup bonus transaction
 * 
 * And automatically grants them the signup bonus.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is called from a cron job or admin
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Checking for users with missing signup credits...');

    // Find users registered in the last 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const recentUsers = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        banned: user.banned,
      })
      .from(user)
      .where(
        and(
          gte(user.createdAt, twentyFourHoursAgo),
          sql`${user.banned} IS NULL OR ${user.banned} = false`
        )
      );

    console.log(`Found ${recentUsers.length} users registered in the last 24 hours`);

    const freePlan = paymentConfig.plans.find((p) => p.id === 'free');
    const signupCredits = freePlan?.credits?.onSignup || 15;

    let fixedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const userRecord of recentUsers) {
      try {
        // Check if user has credit account
        const [creditAccount] = await db
          .select()
          .from(userCredits)
          .where(eq(userCredits.userId, userRecord.id))
          .limit(1);

        // Check if signup bonus was already granted
        const signupReferenceId = `signup_${userRecord.id}`;
        const [existingSignupTx] = await db
          .select()
          .from(creditTransactions)
          .where(eq(creditTransactions.referenceId, signupReferenceId))
          .limit(1);

        if (existingSignupTx) {
          skippedCount++;
          continue; // Already has signup bonus
        }

        // User needs signup bonus - grant it
        if (!creditAccount) {
          // Create credit account
          await creditService.getOrCreateCreditAccount(userRecord.id);
        }

        // Grant signup bonus
        await creditService.earnCredits({
          userId: userRecord.id,
          amount: signupCredits,
          source: 'bonus',
          description: 'Welcome bonus - thank you for signing up!',
          referenceId: signupReferenceId,
        });

        fixedCount++;
        console.log(`✅ Fixed signup credits for ${userRecord.email}`);
      } catch (error) {
        const errorMsg = `Failed to fix credits for ${userRecord.email}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Check completed',
      data: {
        totalUsers: recentUsers.length,
        fixed: fixedCount,
        skipped: skippedCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error('Failed to check missing signup credits:', error);
    return NextResponse.json(
      {
        error: 'Failed to check missing signup credits',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

