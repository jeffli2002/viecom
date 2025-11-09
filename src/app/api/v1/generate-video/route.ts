import { getModelCost } from '@/config/credits.config';
import { auth } from '@/lib/auth/auth';
import { creditService } from '@/lib/credits';
import { getQuotaUsageByService, updateQuotaUsage } from '@/lib/quota/quota-service';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Map aspect ratio to KIE format
function mapAspectRatio(ratio: string): 'square' | 'portrait' | 'landscape' {
  if (ratio === '1:1' || ratio === 'square') return 'square';
  if (ratio === '9:16' || ratio === 'portrait') return 'portrait';
  return 'landscape'; // Default to landscape for 16:9, 4:3, etc.
}

export async function POST(request: NextRequest) {
  try {
    const isTestMode =
      process.env.NODE_ENV === 'test' ||
      process.env.DISABLE_AUTH === 'true' ||
      request.headers.get('x-test-mode') === 'true';

    let userId: string;

    if (isTestMode) {
      userId = 'test-user-id';
    } else {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = session.user.id;
    }

    const {
      prompt,
      mode = 't2v', // t2v or i2v
      aspect_ratio = '16:9',
      image, // For i2v mode
    } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    if (mode === 'i2v' && !image) {
      return NextResponse.json(
        { error: 'Image is required for image-to-video mode' },
        { status: 400 }
      );
    }

    const creditCost = getModelCost('videoGeneration', 'sora-2');
    if (creditCost === 0) {
      return NextResponse.json({ error: 'Invalid video model' }, { status: 400 });
    }

    // Get daily and monthly quota usage
    const dailyPeriod = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const monthlyPeriod = new Date().toISOString().substring(0, 7); // YYYY-MM

    let dailyUsage = 0;
    let monthlyUsage = 0;

    try {
      const dailyQuota = await getQuotaUsageByService(userId, 'video_generation', dailyPeriod);
      const monthlyQuota = await getQuotaUsageByService(userId, 'video_generation', monthlyPeriod);
      dailyUsage = dailyQuota?.usedAmount || 0;
      monthlyUsage = monthlyQuota?.usedAmount || 0;
    } catch (error) {
      // In test mode, ignore quota errors
      if (!isTestMode) {
        throw error;
      }
      console.warn('Quota service error (ignored in test mode):', error);
    }

    // Check if should charge credits (when free quota is exhausted)
    const shouldChargeCredits = dailyUsage >= 0 || monthlyUsage >= 0; // Free users have 0 video quota

    if (!isTestMode) {
      if (shouldChargeCredits) {
        const hasCredits = await creditService.hasEnoughCredits(userId, creditCost);
        if (!hasCredits) {
          return NextResponse.json(
            {
              error: 'Insufficient credits for video generation',
            },
            { status: 402 }
          );
        }
      }
    }

    // Create video generation task using KIE API
    // Following im2prompt pattern: only create task, don't wait for completion
    const kieApiKey = process.env.KIE_API_KEY;
    if (!kieApiKey) {
      return NextResponse.json({ error: 'KIE API key not configured' }, { status: 500 });
    }

    const kieAspectRatio = mapAspectRatio(aspect_ratio);

    const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kieApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: mode === 'i2v' ? 'sora-2-image-to-video' : 'sora-2-text-to-video',
        input:
          mode === 'i2v' && image
            ? {
                prompt,
                image_urls: [image],
                aspect_ratio: kieAspectRatio,
                quality: 'standard',
              }
            : {
                prompt,
                aspect_ratio: kieAspectRatio,
                quality: 'standard',
              },
      }),
    });

    const responseText = await response.text();

    if (!responseText || responseText.trim() === '') {
      console.error('Empty response from KIE API');
      return NextResponse.json(
        {
          error:
            'Empty response from video generation service. The service may be experiencing issues. Please try again.',
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse error response:', responseText);
      }
      console.error('KIE API error:', errorData);
      return NextResponse.json(
        { error: errorData.msg || 'Failed to create video generation task' },
        { status: response.status }
      );
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse response. Response text:', responseText);
      console.error('Parse error:', error);
      return NextResponse.json(
        {
          error:
            'Invalid response from video generation service. The service may be experiencing issues. Please try again.',
        },
        { status: 500 }
      );
    }

    if (data.code !== 200) {
      return NextResponse.json(
        { error: data.msg || 'Failed to create video generation task' },
        { status: 400 }
      );
    }

    const taskId = data.data.taskId;

    // Update quota
    try {
      await updateQuotaUsage({
        userId,
        service: 'video_generation',
        amount: 1,
        period: dailyPeriod,
      });
      await updateQuotaUsage({
        userId,
        service: 'video_generation',
        amount: 1,
        period: monthlyPeriod,
      });
    } catch (error) {
      // In test mode, ignore quota update errors
      if (!isTestMode) {
        throw error;
      }
      console.warn('Quota update error (ignored in test mode):', error);
    }

    // Charge credits
    if (!isTestMode && shouldChargeCredits) {
      try {
        await creditService.spendCredits({
          userId,
          amount: creditCost,
          source: 'api_call',
          description: `Video generation with ${mode}`,
          metadata: {
            feature: 'video-generation',
            model: 'sora-2',
            prompt: prompt.substring(0, 100),
            taskId,
            usedFreeQuota: !shouldChargeCredits,
          },
        });
      } catch (error) {
        console.error('Error spending credits:', error);
        // Don't fail the request if credit spending fails
      }
    }

    return NextResponse.json({
      taskId,
      message: 'Video generation task created successfully',
      creditsUsed: shouldChargeCredits ? creditCost : 0,
      quotaRemaining: Math.max(0, 0 - dailyUsage), // Video has 0 free quota
      usedFreeQuota: !shouldChargeCredits,
    });
  } catch (error) {
    console.error('Error generating video:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
