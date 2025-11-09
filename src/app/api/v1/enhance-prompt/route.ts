import { env } from '@/env';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface EnhancePromptRequest {
  prompt: string;
  context?: string;
  brandTone?: string[];
  productFeatures?: string[];
  productSellingPoints?: string[];
  styleKeywords?: string[];
  colorPalette?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: EnhancePromptRequest = await request.json();
    const {
      prompt,
      context = 'image',
      brandTone = [],
      productFeatures = [],
      productSellingPoints = [],
      styleKeywords = [],
      colorPalette = [],
    } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    const sanitizedPrompt = prompt.trim();
    const generationContext =
      typeof context === 'string' && context.trim().length > 0 ? context.trim() : 'image';

    const deepseekKey = env.DEEPSEEK_API_KEY;

    if (!deepseekKey) {
      return NextResponse.json({ error: 'DeepSeek API key not configured' }, { status: 500 });
    }

    // Build context information for enhancement
    const contextInfo: string[] = [];

    if (brandTone.length > 0) {
      contextInfo.push(`Brand tone: ${brandTone.join(', ')}`);
    }

    if (productFeatures.length > 0) {
      contextInfo.push(`Product features: ${productFeatures.join(', ')}`);
    }

    if (productSellingPoints.length > 0) {
      contextInfo.push(`Product selling points: ${productSellingPoints.join(', ')}`);
    }

    if (styleKeywords.length > 0) {
      contextInfo.push(`Style keywords: ${styleKeywords.join(', ')}`);
    }

    if (colorPalette.length > 0) {
      contextInfo.push(`Color palette: ${colorPalette.join(', ')}`);
    }

    const contextString = contextInfo.length > 0 ? `\n\nContext:\n${contextInfo.join('\n')}` : '';

    const buildMessages = (promptText: string, generationContext: string, contextStr: string) => [
      {
        role: 'system',
        content:
          'You are an expert AI prompt engineer for multimodal generation (text-to-image, image-to-video, etc). Enhance prompts with vivid artistic direction, lighting, composition, and camera/style cues. Incorporate brand tone, product features, and style keywords naturally into the prompt. Only return the improved prompt text.',
      },
      {
        role: 'user',
        content: `Enhance this prompt for ${generationContext} generation:${contextStr}\n\nPrompt:\n${promptText}\n\nRespond with the enhanced prompt only.`,
      },
    ];

    const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const controller = new AbortController();
      const timeout = Number(process.env.AI_ENHANCER_TIMEOUT_MS || 15000);
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(input, {
          ...init,
          signal: controller.signal,
        });
        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const extractContent = (rawContent: unknown) => {
      if (!rawContent) return null;
      if (typeof rawContent === 'string') {
        return rawContent.trim();
      }

      if (Array.isArray(rawContent)) {
        const combined = rawContent
          .map((part) => {
            if (typeof part === 'string') return part;
            if (typeof part?.text === 'string') return part.text;
            if (typeof part?.content === 'string') return part.content;
            return '';
          })
          .join('\n')
          .trim();
        return combined || null;
      }

      if (typeof rawContent?.text === 'string') {
        return rawContent.text.trim();
      }

      return null;
    };

    try {
      const response = await fetchWithTimeout('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${deepseekKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: buildMessages(sanitizedPrompt, generationContext, contextString),
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('DeepSeek enhance error:', errorData);
        return NextResponse.json(
          { error: 'Failed to enhance prompt' },
          { status: response.status }
        );
      }

      const data = await response.json();
      const enhancedPrompt = extractContent(data.choices?.[0]?.message?.content) || sanitizedPrompt;

      return NextResponse.json({
        enhancedPrompt,
        originalPrompt: sanitizedPrompt,
      });
    } catch (error) {
      console.error('DeepSeek enhance request failed:', error);
      return NextResponse.json(
        { error: 'Prompt enhancement temporarily unavailable. Please try again shortly.' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
