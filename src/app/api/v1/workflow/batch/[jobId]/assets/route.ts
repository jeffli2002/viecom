import { auth } from '@/lib/auth/auth';
import { db } from '@/server/db';
import { batchGenerationJob, generatedAsset } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get batch job
    const [job] = await db
      .select()
      .from(batchGenerationJob)
      .where(eq(batchGenerationJob.id, jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get generated assets for this job
    const assets = await db
      .select()
      .from(generatedAsset)
      .where(eq(generatedAsset.batchJobId, jobId))
      .orderBy(generatedAsset.createdAt);

    // Format assets for frontend
    const formattedAssets = assets.map((asset, index) => {
      const generationParams =
        typeof asset.generationParams === 'object' && asset.generationParams !== null
          ? (asset.generationParams as { model?: string })
          : undefined;
      const metadata =
        typeof asset.metadata === 'object' && asset.metadata !== null
          ? (asset.metadata as { rowIndex?: number; previewUrl?: string })
          : undefined;

      return {
        id: asset.id,
        publicUrl: asset.publicUrl,
        url: asset.publicUrl, // Alias for compatibility
        type: asset.assetType as 'image' | 'video',
        prompt: asset.prompt,
        enhancedPrompt: asset.enhancedPrompt || undefined,
        model: generationParams?.model || asset.model || undefined,
        status: asset.status as 'completed' | 'failed',
        error: asset.errorMessage || undefined,
        rowIndex: metadata?.rowIndex ?? index,
        previewUrl: metadata?.previewUrl || undefined,
        r2Key: asset.r2Key || undefined,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        assets: formattedAssets,
      },
    });
  } catch (error) {
    console.error('Get batch assets error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get batch assets',
      },
      { status: 500 }
    );
  }
}
