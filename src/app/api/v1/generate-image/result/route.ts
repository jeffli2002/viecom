import { auth } from '@/lib/auth/auth';
import { db } from '@/server/db';
import { generatedAsset } from '@/server/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }

    const assets = await db
      .select({
        id: generatedAsset.id,
        userId: generatedAsset.userId,
        publicUrl: generatedAsset.publicUrl,
        metadata: generatedAsset.metadata,
        width: generatedAsset.width,
        height: generatedAsset.height,
        creditsSpent: generatedAsset.creditsSpent,
        generationParams: generatedAsset.generationParams,
        status: generatedAsset.status,
        prompt: generatedAsset.prompt,
      })
      .from(generatedAsset)
      .where(
        and(
          eq(generatedAsset.userId, session.user.id),
          sql`${generatedAsset.metadata} ->> 'clientRequestId' = ${requestId}`
        )
      )
      .limit(1);

    if (assets.length === 0) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    const asset = assets[0];
    if (asset.status !== 'completed') {
      return NextResponse.json(
        {
          status: asset.status,
          message: 'Generation still in progress',
        },
        { status: 202 }
      );
    }

    const metadata =
      asset.metadata && typeof asset.metadata === 'object'
        ? (asset.metadata as Record<string, unknown>)
        : {};
    const generationParams =
      asset.generationParams && typeof asset.generationParams === 'object'
        ? (asset.generationParams as Record<string, unknown>)
        : {};

    const previewUrl = typeof metadata.previewUrl === 'string' ? metadata.previewUrl : undefined;
    const taskId = typeof metadata.taskId === 'string' ? metadata.taskId : undefined;
    const storedRequestId =
      typeof metadata.clientRequestId === 'string' ? metadata.clientRequestId : requestId;
    const model =
      typeof generationParams.model === 'string'
        ? (generationParams.model as string)
        : 'nano-banana';

    return NextResponse.json({
      imageUrl: asset.publicUrl,
      previewUrl: previewUrl ?? asset.publicUrl,
      model,
      prompt: asset.prompt,
      width: asset.width ?? undefined,
      height: asset.height ?? undefined,
      creditsUsed: asset.creditsSpent,
      taskId,
      assetId: asset.id,
      clientRequestId: storedRequestId,
      status: asset.status,
    });
  } catch (error) {
    console.error('[Image Generation] Result lookup failed:', error);
    return NextResponse.json({ error: 'Failed to retrieve result' }, { status: 500 });
  }
}
