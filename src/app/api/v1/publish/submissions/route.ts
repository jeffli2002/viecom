import { auth } from '@/lib/auth/auth';
import { createPublishSubmission } from '@/lib/publish/submissions';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assetUrl, previewUrl, assetId, prompt, title, category, assetType, metadata } =
      body ?? {};

    if (!assetUrl || typeof assetUrl !== 'string') {
      return NextResponse.json({ error: 'Asset URL is required' }, { status: 400 });
    }

    const submission = await createPublishSubmission({
      userId: session.user.id,
      assetUrl,
      previewUrl: typeof previewUrl === 'string' ? previewUrl : null,
      assetId: typeof assetId === 'string' ? assetId : null,
      prompt: typeof prompt === 'string' ? prompt : null,
      title: typeof title === 'string' ? title : null,
      category: typeof category === 'string' ? category : null,
      assetType: assetType === 'video' ? 'video' : 'image',
      metadata: metadata && typeof metadata === 'object' ? metadata : null,
    });

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error('Failed to create publish submission:', error);
    return NextResponse.json({ error: 'Failed to submit publish entry' }, { status: 500 });
  }
}
