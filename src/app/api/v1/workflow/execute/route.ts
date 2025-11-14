import { auth } from '@/lib/auth/auth';
import { workflowEngine } from '@/lib/workflow/workflow-engine';
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

    const body = await request.json();
    const {
      companyUrl,
      productImages,
      simpleRequirement,
      generationType,
      mode,
      count = 1,
      model,
      aspectRatio,
    } = body;

    if (!simpleRequirement || typeof simpleRequirement !== 'string') {
      return NextResponse.json({ error: 'Simple requirement is required' }, { status: 400 });
    }

    if (!generationType || !['image', 'video'].includes(generationType)) {
      return NextResponse.json(
        { error: 'Generation type must be "image" or "video"' },
        { status: 400 }
      );
    }

    if (!mode || !['t2i', 'i2i', 't2v', 'i2v'].includes(mode)) {
      return NextResponse.json({ error: 'Invalid generation mode' }, { status: 400 });
    }

    // Validate mode and type combination
    if (generationType === 'image' && !['t2i', 'i2i'].includes(mode)) {
      return NextResponse.json(
        { error: 'Image generation only supports t2i or i2i mode' },
        { status: 400 }
      );
    }

    if (generationType === 'video' && !['t2v', 'i2v'].includes(mode)) {
      return NextResponse.json(
        { error: 'Video generation only supports t2v or i2v mode' },
        { status: 400 }
      );
    }

    // Validate base image for i2i/i2v modes
    if ((mode === 'i2i' || mode === 'i2v') && (!productImages || productImages.length === 0)) {
      return NextResponse.json(
        { error: 'Product images are required for image-to-image/video modes' },
        { status: 400 }
      );
    }

    const result = await workflowEngine.executeWorkflow(session.user.id, {
      companyUrl,
      productImages,
      simpleRequirement,
      generationType,
      mode,
      count: Math.min(count || 1, 10), // Limit to 10 variations
      model,
      aspectRatio,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Workflow execution error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Workflow execution failed',
      },
      { status: 500 }
    );
  }
}
