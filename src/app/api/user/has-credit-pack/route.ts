import { auth } from '@/lib/auth/auth';
import { db } from '@/server/db';
import { creditPackPurchase } from '@/server/db/schema';
import { type NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ hasCreditPack: false }, { status: 200 });
    }

    const userId = session.user.id;

    // Check if user has any credit pack purchase
    const purchases = await db
      .select()
      .from(creditPackPurchase)
      .where(eq(creditPackPurchase.userId, userId))
      .limit(1);

    return NextResponse.json({
      hasCreditPack: purchases.length > 0,
    });
  } catch (error) {
    console.error('Error checking credit pack:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        hasCreditPack: false,
      },
      { status: 500 }
    );
  }
}

