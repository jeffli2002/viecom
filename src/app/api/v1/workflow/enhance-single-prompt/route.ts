import { auth } from '@/lib/auth/auth';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface EnhanceSingleRequest {
  prompt: string;
  productSellingPoints?: string;
  rowIndex: number;
  style?: string;
  generationType: 'image' | 'video';
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: EnhanceSingleRequest = await request.json();
    const { prompt, productSellingPoints, rowIndex, style, generationType } = body;

    if (!prompt || !rowIndex) {
      return NextResponse.json({ error: 'Prompt and rowIndex are required' }, { status: 400 });
    }

    // Import DeepSeek service
    const { deepSeekService } = await import('@/lib/ai/deepseek');

    try {
      let promptToEnhance = prompt;

      // Parse product selling points
      const sellingPointsArray = productSellingPoints
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      // Add style enhancement if provided (before DeepSeek enhancement)
      if (style) {
        const { getImageStyle, getVideoStyle } = await import('@/config/styles.config');
        const styleConfig =
          generationType === 'image' ? getImageStyle(style) : getVideoStyle(style);
        if (styleConfig?.promptEnhancement) {
          promptToEnhance = `${promptToEnhance}, ${styleConfig.promptEnhancement}`;
        }
      }

      // Enhance prompt using DeepSeek
      const enhancedPrompt = await deepSeekService.enhancePrompt(promptToEnhance, generationType, {
        productSellingPoints: sellingPointsArray,
      });

      return NextResponse.json({
        success: true,
        data: {
          rowIndex,
          originalPrompt: prompt,
          enhancedPrompt,
        },
      });
    } catch (error) {
      console.error(`Failed to enhance prompt for row ${rowIndex}:`, error);
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Failed to enhance prompt',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Single prompt enhancement error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to enhance prompt',
      },
      { status: 500 }
    );
  }
}
