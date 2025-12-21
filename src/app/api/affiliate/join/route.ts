import { getSessionFromRequest } from '@/lib/auth/auth-utils';
import { affiliateRepository } from '@/server/db/repositories/affiliate-repository';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request.headers);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const record = await affiliateRepository.createForUser(session.user.id);

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error('[Affiliate Join] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to join affiliate program',
      },
      { status: 500 }
    );
  }
}
