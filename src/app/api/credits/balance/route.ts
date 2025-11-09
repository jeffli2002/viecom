import { auth } from '@/lib/auth/auth';
import { creditService } from '@/lib/credits';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const account = await creditService.getOrCreateCreditAccount(userId);

    return NextResponse.json({
      success: true,
      data: {
        balance: account.balance,
        totalEarned: account.totalEarned,
        totalSpent: account.totalSpent,
        frozenBalance: account.frozenBalance,
        availableBalance: account.balance - account.frozenBalance,
      },
    });
  } catch (error) {
    console.error('Error getting credit balance:', error);
    return NextResponse.json(
      {
        error: 'Failed to get credit balance',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


