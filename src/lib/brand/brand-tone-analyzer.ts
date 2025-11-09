import { env } from '@/env';

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
 * Analyze brand tone and product features from website URL using DeepSeek AI
 */
export async function analyzeBrandTone(websiteUrl: string): Promise<BrandToneAnalysis> {
  const deepseekKey = env.DEEPSEEK_API_KEY;

  if (!deepseekKey) {
    throw new Error('DeepSeek API key not configured');
  }

  try {
    // Fetch website content (simplified - in production, use a proper web scraper)
    const websiteContent = await fetchWebsiteContent(websiteUrl);

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
            content: `You are a brand analyst expert. Analyze the provided website content and extract:
1. Brand tone (3-5 keywords describing the brand personality, e.g., "modern", "luxury", "playful", "professional")
2. Product features (key features and benefits mentioned)
3. Target audience (who the brand targets)
4. Color palette (dominant colors mentioned or inferred)
5. Style keywords (visual style descriptors, e.g., "minimalist", "bold", "elegant")
6. Summary (a brief 2-3 sentence summary of the brand)

Return the analysis as a JSON object with these exact keys: brandTone (array), productFeatures (array), targetAudience (array), colorPalette (array), styleKeywords (array), summary (string).`,
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
 * Fetch website content (simplified version - in production use a proper scraper)
 */
async function fetchWebsiteContent(url: string): Promise<string> {
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
    // In production, use a proper HTML parser like cheerio or puppeteer
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
