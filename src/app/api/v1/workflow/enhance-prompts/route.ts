import { auth } from '@/lib/auth/auth';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface EnhanceRequest {
  rows: Array<{
    prompt: string;
    productSellingPoints?: string;
    rowIndex: number;
  }>;
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

    const body: EnhanceRequest = await request.json();
    const { rows, style, generationType } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Rows are required' }, { status: 400 });
    }

    // Import DeepSeek service
    const { deepSeekService } = await import('@/lib/ai/deepseek');

    // Enhance prompts sequentially
    const enhancedPrompts: Array<{
      rowIndex: number;
      originalPrompt: string;
      enhancedPrompt: string;
      error?: string;
    }> = [];

    for (const row of rows) {
      try {
        let promptToEnhance = row.prompt;

        // Parse product selling points
        const sellingPointsArray = row.productSellingPoints
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
        const enhancedPrompt = await deepSeekService.enhancePrompt(
          promptToEnhance,
          generationType,
          {
            productSellingPoints: sellingPointsArray,
          }
        );

        enhancedPrompts.push({
          rowIndex: row.rowIndex,
          originalPrompt: row.prompt,
          enhancedPrompt,
        });
      } catch (error) {
        console.error(`Failed to enhance prompt for row ${row.rowIndex}:`, error);
        enhancedPrompts.push({
          rowIndex: row.rowIndex,
          originalPrompt: row.prompt,
          enhancedPrompt: row.prompt, // Fallback to original prompt
          error: error instanceof Error ? error.message : 'Failed to enhance prompt',
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        enhancedPrompts,
      },
    });
  } catch (error) {
    console.error('Batch prompt enhancement error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to enhance prompts',
      },
      { status: 500 }
    );
  }
}
