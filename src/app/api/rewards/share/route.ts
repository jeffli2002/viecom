import { creditsConfig } from '@/config/credits.config';
import { auth } from '@/lib/auth/auth';
import { creditService } from '@/lib/credits';
import { db } from '@/server/db';
import { socialShares } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
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
    const { platform, assetId, shareUrl, referenceId } = await request.json();

    if (!platform || typeof platform !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Platform is required' },
        { status: 400 }
      );
    }

    // Validate platform
    const validPlatforms = ['twitter', 'facebook', 'instagram', 'linkedin', 'pinterest', 'tiktok', 'other'];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { success: false, error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` },
        { status: 400 }
      );
    }

    // Check for duplicate share using referenceId (for idempotency)
    if (referenceId) {
      const existingShare = await db
        .select()
        .from(socialShares)
        .where(and(eq(socialShares.userId, userId), eq(socialShares.referenceId, referenceId)))
        .limit(1);

      if (existingShare.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'This share has already been rewarded',
            data: existingShare[0],
          },
          { status: 400 }
        );
      }
    }

    const creditsToAward = creditsConfig.rewards.socialShare.creditsPerShare;

    // Create share record and award credits in a transaction
    const result = await db.transaction(async (tx) => {
      const shareId = randomUUID();
      const shareReferenceId = referenceId || `share_${userId}_${Date.now()}`;

      // Create share record
      await tx.insert(socialShares).values({
        id: shareId,
        userId,
        assetId: assetId || null,
        platform,
        shareUrl: shareUrl || null,
        creditsEarned: creditsToAward,
        referenceId: shareReferenceId,
      });

      // Award credits
      await creditService.earnCredits({
        userId,
        amount: creditsToAward,
        source: 'social_share',
        description: `Social media share on ${platform}`,
        referenceId: `social_share_${shareId}`,
        metadata: {
          platform,
          assetId,
          shareUrl,
          referenceId: shareReferenceId,
        },
      });

      return {
        shareId,
        platform,
        creditsEarned: creditsToAward,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error processing social share:', error);
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

    // Get user's share history
    const shares = await db
      .select()
      .from(socialShares)
      .where(eq(socialShares.userId, userId))
      .orderBy(socialShares.createdAt);

    const totalCreditsEarned = shares.reduce((sum, share) => sum + share.creditsEarned, 0);

    return NextResponse.json({
      success: true,
      data: {
        totalShares: shares.length,
        totalCreditsEarned,
        shares,
      },
    });
  } catch (error) {
    console.error('Error fetching share history:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

