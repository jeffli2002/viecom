import { env } from '@/env';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface EnhancePromptRequest {
  prompt: string;
  context?: string;
  aspectRatio?: string;
  style?: string;
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
      aspectRatio,
      style,
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

    // Add user-selected parameters
    if (aspectRatio) {
      contextInfo.push(`Target aspect ratio: ${aspectRatio}`);
    }

    if (style) {
      contextInfo.push(`Selected style: ${style}`);
    }

    // Add brand context
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

    const buildMessages = (promptText: string, generationContext: string, contextStr: string) => {
      // Image generation system prompt
      const imageSystemPrompt = `You are a professional e-commerce website designer and creative director, specialized in creating high-converting product showcase images for online stores.

[Creation Goal]:
Design a visually stunning e-commerce product hero image, optimized for modern shopping apps and responsive web layouts (mobile-first).

[Visual Style]:
Use commercial-grade photography style, clean layout, and professional lighting. Emphasize product clarity, space for overlay text or price tags on one side. Follow e-commerce visual hierarchy: product in focus, minimal props, soft shadows, and balanced negative space.

[Product Display]:
The product should be centered or slightly off-centered depending on layout balance. Show full texture, reflections, and accurate materials. Use realistic shadows and ambient reflections. If product has brand logo, show it clearly and elegantly.

[Background & Environment]:
Choose background based on product category:
- Tech/Electronics → neutral grey or gradient metallic background
- Skincare/Beauty → soft beige or pastel tone with gentle diffused light
- Home/Lifestyle → cozy setting with natural styles and natural daylight

[Composition]:
Include empty clean space (20-30%) on either left or right side for UI elements or promotional text. Symmetrical composition preferred for single product focus. Use 3D lighting realism, high dynamic range.

[Photography Style & Details]:
Cinematic lighting, ultra-sharp focus, realistic texture details. Professional color grading, 8K resolution, product photography realism. Studio setup or minimal lifestyle scene according to context.

[E-commerce Platform Optimization]:
Optimized for Amazon / TikTok / Shopee / Taobao / Shopify / Douyin / Tmall product listings. The product needs to be the main focus and not less than 50% of the image (85% for Amazon if specified).

[Exclusions]:
No human unless required. Avoid clutter, harsh shadows, or busy backgrounds.

[Instructions]:
Optimize the prompt for the user's selected aspect ratio and style preference. Naturally incorporate any provided brand tone, product features, and style keywords into the enhanced prompt. Ensure composition and framing match the specified aspect ratio. Only return the enhanced prompt text without any additional commentary.`;

      // Video generation system prompt
      const videoSystemPrompt = `You are a professional e-commerce creative director and video designer specializing in producing high-converting product showcase videos for online stores. Your design style blends commercial realism, elegant motion, and platform-optimized composition.

[Video Goal]:
Create a visually stunning product showcase video that highlights the product's design, texture, and features in a clean, professional, and emotionally appealing way suitable for e-commerce platforms like Amazon, Shopee, TikTok, and Shopify.

[Video Structure]:
Scene 1 — Opening Hero Shot: product appears with soft cinematic lighting, slow pan-in or rotation, elegant reveal animation.
Scene 2 — Product Detail Close-up: focus on texture, materials, color, or feature demonstration. Use macro depth of field and controlled camera movement.
Scene 3 — Context/Lifestyle Scene: product in a realistic environment (bathroom, desk, kitchen, etc.), showing its use or emotional context.
Scene 4 — Closing Shot: product centered, brand or tagline area with empty space on one side for overlay text or price tag.

[Visual & Photography Style]:
Cinematic lighting, shallow depth of field, 4K or 8K detail realism. Smooth dolly or rotation motion, professional product photography style. Soft natural light or studio lighting depending on product type. Balanced color palette and gentle transitions.

[Pacing & Duration]:
Duration: 10-20 seconds. Pacing: smooth, elegant, no hard cuts, consistent motion.

[Sound & Atmosphere]:
Background music matching the product style (e.g., soft ambient for beauty, upbeat tech tone for electronics). No voiceover unless user specified.

[Platform Adaptation]:
Aspect ratio:
- 16:9 for website banners or YouTube ads
- 9:16 for TikTok / Shopee short video ads
- 4:5 for product detail page display

[Exclusions]:
No watermark, no human faces unless specified, no excessive text or logos. Clean professional e-commerce mood only.

[Example]:
For a wireless Bluetooth headset:
Scene 1: dark gradient background, product slowly rotates with metallic reflections.
Scene 2: close-up of earbuds charging in sleek case with glowing LED indicator.
Scene 3: transition to lifestyle setup on a clean modern desk, laptop nearby.
Scene 4: final centered product shot with space for CTA text "Next-Level Sound."
Lighting: cool tone, futuristic, sharp focus, smooth motion transitions, 16:9 cinematic layout.

[Instructions]:
Optimize the video for the user's selected aspect ratio and style preference. Naturally incorporate any provided brand tone, product features, and style keywords into the enhanced prompt. Structure the prompt with clear scene descriptions and camera movements appropriate for the specified aspect ratio. Only return the enhanced prompt text without any additional commentary.`;

      return [
        {
          role: 'system',
          content: generationContext === 'video' ? videoSystemPrompt : imageSystemPrompt,
        },
        {
          role: 'user',
          content: `Enhance this prompt for ${generationContext} generation:${contextStr}\n\nPrompt:\n${promptText}\n\nRespond with the enhanced prompt only.`,
        },
      ];
    };

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
