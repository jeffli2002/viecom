import { getAffiliateProgramConfig } from '@/lib/affiliate/affiliate-program';
import { getSessionFromRequest } from '@/lib/auth/auth-utils';
import { affiliateRepository } from '@/server/db/repositories/affiliate-repository';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request.headers);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const program = await getAffiliateProgramConfig();
    const affiliate = await affiliateRepository.findByUserId(session.user.id);

    if (!affiliate) {
      return NextResponse.json({
        success: true,
        data: {
          program,
          affiliate: null,
        },
      });
    }

    const overview = await affiliateRepository.getOverview(affiliate.id);

    return NextResponse.json({
      success: true,
      data: {
        program,
        affiliate,
        overview,
      },
    });
  } catch (error) {
    console.error('[Affiliate Me] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load affiliate data',
      },
      { status: 500 }
    );
  }
}
