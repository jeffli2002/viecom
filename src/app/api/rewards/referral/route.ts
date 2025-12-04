import { randomUUID } from 'node:crypto';
import { creditsConfig } from '@/config/credits.config';
import { auth } from '@/lib/auth/auth';
import { creditService } from '@/lib/credits';
import { db } from '@/server/db';
import { user, userReferrals } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Register a referral when a new user signs up with a referral code
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { referralCode } = await request.json();

    if (!referralCode || typeof referralCode !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Referral code is required' },
        { status: 400 }
      );
    }

    const referredUserId = session.user.id;

    // Find referrer by referral code
    // Note: In a real implementation, you might want to store referral codes in a separate table
    // For now, we'll use userId as referral code (you can enhance this)
    const referrerId = referralCode; // Assuming referral code is the referrer's userId
    // TODO: Implement proper referral code lookup if using custom codes

    if (referrerId === referredUserId) {
      return NextResponse.json({ success: false, error: 'Cannot refer yourself' }, { status: 400 });
    }

    // Check if referral already exists
    const existingReferral = await db
      .select()
      .from(userReferrals)
      .where(eq(userReferrals.referredId, referredUserId))
      .limit(1);

    if (existingReferral.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Referral already registered',
          data: existingReferral[0],
        },
        { status: 400 }
      );
    }

    // Create referral record
    const referralId = randomUUID();
    await db.insert(userReferrals).values({
      id: referralId,
      referrerId,
      referredId: referredUserId,
      referralCode,
      creditsAwarded: false,
      referredUserFirstGenerationCompleted: false,
    });

    return NextResponse.json({
      success: true,
      data: {
        referralId,
        referrerId,
        referredId: referredUserId,
      },
    });
  } catch (error) {
    console.error('Error registering referral:', error);
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

/**
 * Get user's referral code and stats
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get referrals made by this user
    const referrals = await db
      .select({
        id: userReferrals.id,
        referralCode: userReferrals.referralCode,
        referrerId: userReferrals.referrerId,
        referredId: userReferrals.referredId,
        creditsAwarded: userReferrals.creditsAwarded,
        referredUserFirstGenerationCompleted: userReferrals.referredUserFirstGenerationCompleted,
        createdAt: userReferrals.createdAt,
        creditsAwardedAt: userReferrals.creditsAwardedAt,
        referredEmail: user.email,
        referredName: user.name,
      })
      .from(userReferrals)
      .leftJoin(user, eq(user.id, userReferrals.referredId))
      .where(eq(userReferrals.referrerId, userId));

    // Generate referral code (using userId for now, can be enhanced)
    const referralCode = userId; // TODO: Generate a more user-friendly code
    const successfulReferrals = referrals.filter((r) => r.creditsAwarded).length;
    const pendingReferrals = referrals.length - successfulReferrals;

    return NextResponse.json({
      success: true,
      data: {
        referralCode,
        totalReferrals: referrals.length,
        successfulReferrals,
        pendingReferrals,
        totalEarnedCredits: successfulReferrals * creditsConfig.rewards.referral.creditsPerReferral,
        referrals,
      },
    });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
