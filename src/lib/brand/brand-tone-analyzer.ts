import { env } from '@/env';
import Firecrawl from '@mendable/firecrawl-js';

export interface BrandToneAnalysis {
  brandName?: string;
  brandTone: string[];
  productFeatures: string[];
  targetAudience: string[];
  colorPalette: string[];
  styleKeywords: string[];
  summary: string;
  audienceDemographics?: {
    ageRange?: string;
    incomeLevel?: string;
    keySegments?: string[];
    geographicFocus?: string;
  };
  creativeGuidance?: {
    imageStyles?: string[];
    videoStyles?: string[];
    messagingAngles?: string[];
  };
}

/**
 * Analyze brand tone and product features from website URL using Firecrawl and DeepSeek AI
 */
export async function analyzeBrandTone(
  websiteUrl: string,
  locale: string = 'en'
): Promise<BrandToneAnalysis> {
  const isZh = locale === 'zh';
  const deepseekKey = env.DEEPSEEK_API_KEY;
  const firecrawlKey = env.FIRECRAWL_API_KEY;

  if (!deepseekKey) {
    throw new Error('DeepSeek API key not configured');
  }

  try {
    // Fetch website content using Firecrawl (better scraping with JS support)
    const websiteContent = await fetchWebsiteContentWithFirecrawl(websiteUrl, firecrawlKey);

    // Use DeepSeek to analyze brand tone
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deepseekKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: isZh
              ? `你是一位品牌分析与创意策略专家。结合提供的网页内容与公开品牌认知，完成以下任务：
1. 提取品牌调性（3-6个关键词，描述品牌个性）
2. 提炼核心产品/服务特性与独特卖点
3. 识别目标受众（列出关键人群分层/场景）
4. 分析主色调与辅助色（可依据页面视觉或品牌识别）
5. 总结视觉风格关键词（描述摄影视觉、构图、材质等）
6. 输出品牌总结（2-3句，概括定位、价值、差异化）
7. 推断受众画像信息（年龄区间、收入水平、关键人群分层）
8. 基于品牌调性、色彩与受众，推荐图片与视频创作方向，并给出3-5条核心叙事/营销角度

请以 JSON 对象返回，必须包含以下键：
{
  "brandName": string,
  "brandTone": string[],
  "productFeatures": string[],
  "targetAudience": string[],
  "colorPalette": string[],
  "styleKeywords": string[],
  "audienceDemographics": {
    "ageRange": string,
    "incomeLevel": string,
    "keySegments": string[]
  },
  "creativeGuidance": {
    "imageStyles": string[],
    "videoStyles": string[],
    "messagingAngles": string[]
  },
  "summary": string
}

所有字段必须使用中文。`
              : `You are a brand analyst and creative strategist. Using both the provided website content and any generally known brand context, complete the following:
1. Extract brand tone (3-6 keywords describing personality)
2. Identify core product/service features and value propositions
3. Describe the target audience (list key segments or scenarios)
4. Analyze the primary and secondary colors (based on visual identity or inferred palette)
5. Summarize visual style keywords (photography, composition, materials, etc.)
6. Produce a concise 2-3 sentence brand summary highlighting positioning and differentiation
7. Infer audience demographics (age range, income level, key audience segments)
8. Recommend image and video creative directions aligned with the tone/colors/audience, plus 3-5 narrative or marketing angles

Return a JSON object with the following exact keys:
{
  "brandName": string,
  "brandTone": string[],
  "productFeatures": string[],
  "targetAudience": string[],
  "colorPalette": string[],
  "styleKeywords": string[],
  "audienceDemographics": {
    "ageRange": string,
    "incomeLevel": string,
    "keySegments": string[]
  },
  "creativeGuidance": {
    "imageStyles": string[],
    "videoStyles": string[],
    "messagingAngles": string[]
  },
  "summary": string
}

All text must be in English.`,
          },
          {
            role: 'user',
            content: `Analyze this website content and extract brand tone and product information:\n\nURL: ${websiteUrl}\n\nContent:\n${websiteContent.substring(0, 8000)}`,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('DeepSeek brand analysis error:', errorData);
      throw new Error('Failed to analyze brand tone');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No analysis content returned');
    }

    // Try to parse JSON from the response
    let analysis: BrandToneAnalysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      analysis = JSON.parse(jsonString);
    } catch (parseError) {
      // Fallback: try to extract structured data from text
      console.warn('Failed to parse JSON, using fallback parsing');
      analysis = parseBrandAnalysisFromText(content);
    }

    const demographics = analysis.audienceDemographics || {};
    const creativeGuidance = analysis.creativeGuidance || {};

    // Validate and ensure all required fields exist
    const sanitizedAnalysis: BrandToneAnalysis = {
      brandName: analysis.brandName,
      brandTone: Array.isArray(analysis.brandTone) ? analysis.brandTone : [],
      productFeatures: Array.isArray(analysis.productFeatures) ? analysis.productFeatures : [],
      targetAudience: Array.isArray(analysis.targetAudience) ? analysis.targetAudience : [],
      colorPalette: Array.isArray(analysis.colorPalette) ? analysis.colorPalette : [],
      styleKeywords: Array.isArray(analysis.styleKeywords) ? analysis.styleKeywords : [],
      audienceDemographics: {
        ageRange: demographics.ageRange || '',
        incomeLevel: demographics.incomeLevel || '',
        keySegments: Array.isArray(demographics.keySegments) ? demographics.keySegments.filter(Boolean) : [],
        geographicFocus: demographics.geographicFocus,
      },
      creativeGuidance: {
        imageStyles: Array.isArray(creativeGuidance.imageStyles)
          ? creativeGuidance.imageStyles.filter(Boolean)
          : [],
        videoStyles: Array.isArray(creativeGuidance.videoStyles)
          ? creativeGuidance.videoStyles.filter(Boolean)
          : [],
        messagingAngles: Array.isArray(creativeGuidance.messagingAngles)
          ? creativeGuidance.messagingAngles.filter(Boolean)
          : [],
      },
      summary: analysis.summary || 'Brand analysis completed',
    };

    const needsAudienceEnhancement =
      !sanitizedAnalysis.audienceDemographics?.ageRange?.trim() ||
      !sanitizedAnalysis.audienceDemographics?.incomeLevel?.trim() ||
      !(sanitizedAnalysis.audienceDemographics?.keySegments?.length ?? 0);

    const needsCreativeEnhancement =
      !(sanitizedAnalysis.creativeGuidance?.imageStyles?.length ?? 0) ||
      !(sanitizedAnalysis.creativeGuidance?.videoStyles?.length ?? 0) ||
      !(sanitizedAnalysis.creativeGuidance?.messagingAngles?.length ?? 0);

    if (needsAudienceEnhancement || needsCreativeEnhancement) {
      const searchContext = await fetchBrandSearchContext(
        sanitizedAnalysis.brandName || new URL(websiteUrl).hostname.replace('www.', ''),
      );

      const enhancement = await enhanceAnalysisWithDeepseek({
        deepseekKey,
        locale,
        websiteUrl,
        websiteContent,
        searchContext,
        baseAnalysis: sanitizedAnalysis,
        needsAudience: needsAudienceEnhancement,
        needsCreative: needsCreativeEnhancement,
      });

      if (enhancement?.audienceDemographics) {
        const current = sanitizedAnalysis.audienceDemographics || {};
        const updated = enhancement.audienceDemographics;
        sanitizedAnalysis.audienceDemographics = {
          ageRange: updated.ageRange?.trim() || current.ageRange || '',
          incomeLevel: updated.incomeLevel?.trim() || current.incomeLevel || '',
          keySegments: normalizeStringArray(
            (updated.keySegments && updated.keySegments.length > 0
              ? updated.keySegments
              : current.keySegments) ?? [],
          ),
          geographicFocus: updated.geographicFocus || current.geographicFocus,
        };
      }

      if (enhancement?.creativeGuidance) {
        const current = sanitizedAnalysis.creativeGuidance || {};
        const updated = enhancement.creativeGuidance;
        sanitizedAnalysis.creativeGuidance = {
          imageStyles: normalizeStringArray(
            (updated.imageStyles && updated.imageStyles.length > 0
              ? updated.imageStyles
              : current.imageStyles) ?? [],
          ),
          videoStyles: normalizeStringArray(
            (updated.videoStyles && updated.videoStyles.length > 0
              ? updated.videoStyles
              : current.videoStyles) ?? [],
          ),
          messagingAngles: normalizeStringArray(
            (updated.messagingAngles && updated.messagingAngles.length > 0
              ? updated.messagingAngles
              : current.messagingAngles) ?? [],
          ),
        };
      }
    }

    return sanitizedAnalysis;
  } catch (error) {
    console.error('Error analyzing brand tone:', error);
    throw error;
  }
}

function normalizeStringArray(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter((value) => value.length > 0),
    ),
  );
}

async function fetchBrandSearchContext(query: string): Promise<string> {
  try {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return '';
    }

    const response = await fetch(
      `https://r.jina.ai/http://duckduckgo.com/?q=${encodeURIComponent(normalizedQuery)}&ia=web`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0 Safari/537.36',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Search fetch failed with status ${response.status}`);
    }

    const text = await response.text();
    return text.substring(0, 4000);
  } catch (error) {
    console.warn('Failed to fetch search context:', error);
    return '';
  }
}

interface DeepseekEnhancementInput {
  deepseekKey: string;
  locale: string;
  websiteUrl: string;
  websiteContent: string;
  searchContext: string;
  baseAnalysis: BrandToneAnalysis;
  needsAudience: boolean;
  needsCreative: boolean;
}

async function enhanceAnalysisWithDeepseek(
  input: DeepseekEnhancementInput,
): Promise<Partial<BrandToneAnalysis> | null> {
  const {
    deepseekKey,
    locale,
    websiteUrl,
    websiteContent,
    searchContext,
    baseAnalysis,
    needsAudience,
    needsCreative,
  } = input;

  if (!needsAudience && !needsCreative) {
    return null;
  }

  const isZh = locale === 'zh';

  const instruction = isZh
    ? `你是品牌策略专家。基于已有的品牌分析结果，补全缺失信息。

必须输出 JSON，包含以下键：
{
  "audienceDemographics": {
    "ageRange": string,
    "incomeLevel": string,
    "keySegments": string[],
    "geographicFocus": string | null
  },
  "creativeGuidance": {
    "imageStyles": string[],
    "videoStyles": string[],
    "messagingAngles": string[]
  }
}

请务必根据品牌调性、色彩、受众、网站与网络搜索结果生成真实、具体且差异化的内容。所有字段必须用中文，数组至少包含3项，且避免重复、泛泛的描述。`
    : `You are a brand strategist. Using the existing analysis, fill in any missing details.

Return a JSON object with:
{
  "audienceDemographics": {
    "ageRange": string,
    "incomeLevel": string,
    "keySegments": string[],
    "geographicFocus": string | null
  },
  "creativeGuidance": {
    "imageStyles": string[],
    "videoStyles": string[],
    "messagingAngles": string[]
  }
}

Ground your reasoning in the brand tone, color palette, audience insights, website content, and external search snippets. Provide specific, differentiated outputs. Arrays must contain at least three non-empty items.`;

  const payload = {
    websiteUrl,
    baseAnalysis,
    needsAudience,
    needsCreative,
    websiteContent: websiteContent.substring(0, 6000),
    searchContext: searchContext.substring(0, 4000),
  };

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${deepseekKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: instruction,
        },
        {
          role: 'user',
          content: JSON.stringify(payload, null, 2),
        },
      ],
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error('DeepSeek enhancement error:', errorBody);
    return null;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    return null;
  }

  try {
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;
    const parsed = JSON.parse(jsonString) as Partial<BrandToneAnalysis>;
    return parsed;
  } catch (error) {
    console.warn('Failed to parse DeepSeek enhancement JSON:', error);
    return null;
  }
}

/**
 * Fetch website content using Firecrawl (better scraping with JS support and anti-bot bypass)
 */
async function fetchWebsiteContentWithFirecrawl(
  url: string,
  firecrawlKey?: string
): Promise<string> {
  // If Firecrawl API key is available, use it for better scraping
  if (firecrawlKey) {
    try {
      const firecrawl = new Firecrawl({ apiKey: firecrawlKey });

      const scrapeMethod =
        typeof (firecrawl as any).scrapeUrl === 'function'
          ? (firecrawl as any).scrapeUrl.bind(firecrawl)
          : typeof (firecrawl as any).scrape === 'function'
            ? (firecrawl as any).scrape.bind(firecrawl)
            : null;

      const scrapeResult = scrapeMethod
        ? await scrapeMethod(url, {
            formats: ['markdown'],
            onlyMainContent: true,
          })
        : null;

      // Handle the response - check for both success flag and data structure
      if (scrapeResult && ((scrapeResult as any).markdown || (scrapeResult as any).data?.markdown)) {
        // Get markdown content (could be in scrapeResult.markdown or scrapeResult.data.markdown)
        const markdown =
          (scrapeResult as any).markdown || (scrapeResult as any).data?.markdown || '';
        
        // Get metadata (could be in scrapeResult.metadata or scrapeResult.data?.metadata)
        const metadata =
          (scrapeResult as any).metadata || (scrapeResult as any).data?.metadata || {};
        
        // Combine markdown content with metadata for better context
        let content = markdown;
        
        // Add metadata if available
        const metadataText = [
          metadata.title ? `Title: ${metadata.title}` : '',
          metadata.description ? `Description: ${metadata.description}` : '',
          metadata.language ? `Language: ${metadata.language}` : '',
        ]
          .filter(Boolean)
          .join('\n');
        
        if (metadataText) {
          content = `${metadataText}\n\n${content}`;
        }

        // Limit content length for AI analysis (keep it reasonable)
        return content.substring(0, 12000);
      }
    } catch (error) {
      console.error('Firecrawl scraping error:', error);
      // Fallback to simple fetch if Firecrawl fails
    }
  }

  // Fallback to simple fetch if Firecrawl is not available or fails
  return fetchWebsiteContentFallback(url);
}

/**
 * Fallback: Simple fetch when Firecrawl is not available
 */
async function fetchWebsiteContentFallback(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status}`);
    }

    const html = await response.text();

    // Simple HTML parsing - extract text content
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 8000); // Limit content length

    return textContent || `Website content from ${url}`;
  } catch (error) {
    console.error('Error fetching website content:', error);
    // Return URL as fallback
    return `Website URL: ${url}`;
  }
}

/**
 * Fallback parser for when JSON parsing fails
 */
function parseBrandAnalysisFromText(text: string): BrandToneAnalysis {
  const analysis: BrandToneAnalysis = {
    brandTone: [],
    productFeatures: [],
    targetAudience: [],
    colorPalette: [],
    styleKeywords: [],
    summary: text.substring(0, 500),
    audienceDemographics: {
      ageRange: '',
      incomeLevel: '',
      keySegments: [],
    },
    creativeGuidance: {
      imageStyles: [],
      videoStyles: [],
      messagingAngles: [],
    },
  };

  // Try to extract arrays from text patterns
  const brandToneMatch = text.match(/brand[_\s]tone[:\s]+\[?([^\]]+)\]?/i);
  if (brandToneMatch) {
    const toneSource = brandToneMatch[1] ?? '';
    analysis.brandTone = toneSource
      .split(',')
      .map((s) => s.trim().replace(/['"]/g, ''))
      .filter(Boolean);
  }

  const featuresMatch = text.match(/product[_\s]features[:\s]+\[?([^\]]+)\]?/i);
  if (featuresMatch) {
    const featureSource = featuresMatch[1] ?? '';
    analysis.productFeatures = featureSource
      .split(',')
      .map((s) => s.trim().replace(/['"]/g, ''))
      .filter(Boolean);
  }

  const ageMatch = text.match(/age(?:\s*range)?[:\s]+([^\n]+)/i);
  if (ageMatch) {
    const ageSource = ageMatch[1] ?? '';
    analysis.audienceDemographics = {
      ...analysis.audienceDemographics,
      ageRange: ageSource.trim(),
    };
  }

  const incomeMatch = text.match(/income[:\s]+([^\n]+)/i);
  if (incomeMatch) {
    const incomeSource = incomeMatch[1] ?? '';
    analysis.audienceDemographics = {
      ...analysis.audienceDemographics,
      incomeLevel: incomeSource.trim(),
    };
  }

  const segmentMatch = text.match(/segment[s]?[:\s]+\[?([^\]]+)\]?/i);
  if (segmentMatch) {
    const segmentSource = segmentMatch[1] ?? '';
    analysis.audienceDemographics = {
      ...analysis.audienceDemographics,
      keySegments: segmentSource
        .split(',')
        .map((s) => s.trim().replace(/['"]/g, ''))
        .filter(Boolean),
    };
  }

  const imageStyleMatch = text.match(/image[_\s]styles?[:\s]+\[?([^\]]+)\]?/i);
  if (imageStyleMatch) {
    const imageSource = imageStyleMatch[1] ?? '';
    analysis.creativeGuidance = {
      ...analysis.creativeGuidance,
      imageStyles: imageSource
        .split(',')
        .map((s) => s.trim().replace(/['"]/g, ''))
        .filter(Boolean),
    };
  }

  const videoStyleMatch = text.match(/video[_\s]styles?[:\s]+\[?([^\]]+)\]?/i);
  if (videoStyleMatch) {
    const videoSource = videoStyleMatch[1] ?? '';
    analysis.creativeGuidance = {
      ...analysis.creativeGuidance,
      videoStyles: videoSource
        .split(',')
        .map((s) => s.trim().replace(/['"]/g, ''))
        .filter(Boolean),
    };
  }

  const messagingMatch = text.match(/messaging[_\s]angles?[:\s]+\[?([^\]]+)\]?/i);
  if (messagingMatch) {
    const messagingSource = messagingMatch[1] ?? '';
    analysis.creativeGuidance = {
      ...analysis.creativeGuidance,
      messagingAngles: messagingSource
        .split(',')
        .map((s) => s.trim().replace(/['"]/g, ''))
        .filter(Boolean),
    };
  }

  return analysis;
}
