import { auth } from '@/lib/auth/auth';
import { db } from '@/server/db';
import { platformPublish } from '@/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');
    const platform = searchParams.get('platform');
    const limit = Number.parseInt(searchParams.get('limit') || '50');
    const offset = Number.parseInt(searchParams.get('offset') || '0');

    let query = db
      .select()
      .from(platformPublish)
      .where(eq(platformPublish.userId, session.user.id))
      .orderBy(desc(platformPublish.createdAt))
      .limit(limit)
      .offset(offset);

    if (assetId) {
      query = query.where(eq(platformPublish.assetId, assetId));
    }

    if (platform) {
      query = query.where(eq(platformPublish.platform, platform));
    }

    const records = await query;

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error('Get publish history error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get publish history',
      },
      { status: 500 }
    );
  }
}
