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
              ? `你是一位品牌分析专家。分析提供的网站内容并提取：
1. 品牌调性（3-5个描述品牌个性的关键词，例如："现代"、"奢华"、"活泼"、"专业"）
2. 产品特性（提到的关键特性和优势）
3. 目标受众（品牌针对的人群）
4. 色彩方案（提到或推断的主要颜色）
5. 风格关键词（视觉风格描述词，例如："极简"、"大胆"、"优雅"）
6. 总结（2-3句话的品牌总结）

以JSON对象形式返回分析结果，包含以下键：brandTone（数组）、productFeatures（数组）、targetAudience（数组）、colorPalette（数组）、styleKeywords（数组）、summary（字符串）。

所有内容必须使用中文。`
              : `You are a brand analyst expert. Analyze the provided website content and extract:
1. Brand tone (3-5 keywords describing the brand personality, e.g., "modern", "luxury", "playful", "professional")
2. Product features (key features and benefits mentioned)
3. Target audience (who the brand targets)
4. Color palette (dominant colors mentioned or inferred)
5. Style keywords (visual style descriptors, e.g., "minimalist", "bold", "elegant")
6. Summary (a brief 2-3 sentence summary of the brand)

Return the analysis as a JSON object with these exact keys: brandTone (array), productFeatures (array), targetAudience (array), colorPalette (array), styleKeywords (array), summary (string).

All content must be in English.`,
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

    // Validate and ensure all required fields exist
    return {
      brandTone: analysis.brandTone || [],
      productFeatures: analysis.productFeatures || [],
      targetAudience: analysis.targetAudience || [],
      colorPalette: analysis.colorPalette || [],
      styleKeywords: analysis.styleKeywords || [],
      summary: analysis.summary || 'Brand analysis completed',
    };
  } catch (error) {
    console.error('Error analyzing brand tone:', error);
    throw error;
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

      // Use scrape to get the main page content
      // For brand analysis, we mainly need the homepage with clean content
      const scrapeResult = await firecrawl.scrapeUrl(url, {
        formats: ['markdown'], // Get clean markdown content
        onlyMainContent: true, // Focus on main content, ignore navigation/footer
      });

      // Handle the response - check for both success flag and data structure
      if (scrapeResult && (scrapeResult.markdown || scrapeResult.data?.markdown)) {
        // Get markdown content (could be in scrapeResult.markdown or scrapeResult.data.markdown)
        const markdown = scrapeResult.markdown || scrapeResult.data?.markdown || '';
        
        // Get metadata (could be in scrapeResult.metadata or scrapeResult.data?.metadata)
        const metadata = scrapeResult.metadata || scrapeResult.data?.metadata || {};
        
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
  };

  // Try to extract arrays from text patterns
  const brandToneMatch = text.match(/brand[_\s]tone[:\s]+\[?([^\]]+)\]?/i);
  if (brandToneMatch) {
    analysis.brandTone = brandToneMatch[1]
      .split(',')
      .map((s) => s.trim().replace(/['"]/g, ''))
      .filter(Boolean);
  }

  const featuresMatch = text.match(/product[_\s]features[:\s]+\[?([^\]]+)\]?/i);
  if (featuresMatch) {
    analysis.productFeatures = featuresMatch[1]
      .split(',')
      .map((s) => s.trim().replace(/['"]/g, ''))
      .filter(Boolean);
  }

  return analysis;
}
