import { auth } from '@/lib/auth/auth';
import { analyzeBrandTone } from '@/lib/brand/brand-tone-analyzer';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { websiteUrl } = await request.json();

    if (!websiteUrl || typeof websiteUrl !== 'string') {
      return NextResponse.json(
        { error: 'Website URL is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(websiteUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const analysis = await analyzeBrandTone(websiteUrl);

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Error analyzing brand tone:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to analyze brand tone',
      },
      { status: 500 }
    );
  }
}


