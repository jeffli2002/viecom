import { auth } from '@/lib/auth/auth';
import { db } from '@/server/db';
import { generatedAsset } from '@/server/db/schema';
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
    const limit = Number.parseInt(searchParams.get('limit') || '50');
    const offset = Number.parseInt(searchParams.get('offset') || '0');

    const assets = await db
      .select({
        id: generatedAsset.id,
        url: generatedAsset.publicUrl,
        type: generatedAsset.assetType,
        prompt: generatedAsset.prompt,
        createdAt: generatedAsset.createdAt,
        status: generatedAsset.status,
      })
      .from(generatedAsset)
      .where(eq(generatedAsset.userId, session.user.id))
      .orderBy(desc(generatedAsset.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      assets: assets.map((asset) => ({
        id: asset.id,
        url: asset.url,
        type: asset.type as 'image' | 'video',
        prompt: asset.prompt,
        createdAt: asset.createdAt.toISOString(),
        status: asset.status as 'completed' | 'failed',
      })),
    });
  } catch (error) {
    console.error('Get assets error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get assets',
      },
      { status: 500 }
    );
  }
}


