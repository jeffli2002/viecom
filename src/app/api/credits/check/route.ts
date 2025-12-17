import { auth } from '@/lib/auth/auth';
import { creditService } from '@/lib/credits';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the current session to verify authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await request.json();

    // Verify that the user can only check their own credits
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Can only check your own credits' },
        { status: 403 }
      );
    }

    // Check if credit account exists
    try {
      const creditAccount = await creditService.getOrCreateCreditAccount(userId);
      return NextResponse.json({
        success: true,
        hasAccount: true,
        balance: creditAccount.balance,
      });
    } catch (_error) {
      return NextResponse.json({
        success: true,
        hasAccount: false,
      });
    }
  } catch (error) {
    console.error('Failed to check credit account:', error);
    return NextResponse.json(
      {
        error: 'Failed to check credit account',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
