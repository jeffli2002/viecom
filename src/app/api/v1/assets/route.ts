import { auth } from '@/lib/auth/auth';
import { r2StorageService } from '@/lib/storage/r2';
import { db } from '@/server/db';
import { generatedAsset } from '@/server/db/schema';
import { and, desc, eq } from 'drizzle-orm';
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
        metadata: generatedAsset.metadata,
        r2Key: generatedAsset.r2Key,
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
        previewUrl:
          typeof asset.metadata === 'object' && asset.metadata
            ? // @ts-expect-error metadata comes from JSONB
              ((asset.metadata.previewUrl as string | undefined) ?? undefined)
            : undefined,
        r2Key: asset.r2Key || undefined,
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('id');

    if (!assetId) {
      return NextResponse.json({ error: 'Missing asset id' }, { status: 400 });
    }

    const [asset] = await db
      .select({
        id: generatedAsset.id,
        r2Key: generatedAsset.r2Key,
      })
      .from(generatedAsset)
      .where(and(eq(generatedAsset.id, assetId), eq(generatedAsset.userId, session.user.id)))
      .limit(1);

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    if (asset.r2Key) {
      await r2StorageService.deleteFile(asset.r2Key);
    }

    await db
      .delete(generatedAsset)
      .where(and(eq(generatedAsset.id, assetId), eq(generatedAsset.userId, session.user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete asset error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete asset',
      },
      { status: 500 }
    );
  }
}
