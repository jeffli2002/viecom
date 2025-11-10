import { auth } from '@/lib/auth/auth';
import { analyzeBrandTone } from '@/lib/brand/brand-tone-analyzer';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export interface BrandAnalysisResult {
  brandName?: string;
  website: string;
  productCategory: string[];
  brandTone: string;
  brandVoice: string;
  colors: {
    primary: string;
    secondary: string[];
    accent?: string;
  };
  styleKeywords: string[];
  targetAudience: string;
  audienceAge?: string;
  audienceIncome?: string;
  brandPersonality: string[];
  contentThemes: string[];
  visualStyle?: {
    photography: string;
    layout: string;
    typography: string;
  };
  competitiveAdvantage?: string[];
  recommendedImageStyles?: string[];
  metadata: {
    title: string;
    description: string;
    language: string;
  };
  socialMediaTone?: string;
  marketingFocus?: string[];
}

/**
 * Transform BrandToneAnalysis to BrandAnalysisResult
 */
function transformAnalysisResult(
  analysis: Awaited<ReturnType<typeof analyzeBrandTone>>,
  websiteUrl: string,
  locale: string = 'en'
): BrandAnalysisResult {
  const isZh = locale === 'zh';
  const separator = isZh ? '、' : ', ';
  
  // Extract brand name from URL or use first product feature
  const brandName =
    analysis.brandName ||
    new URL(websiteUrl).hostname.replace('www.', '').split('.')[0] ||
    (isZh ? '未知品牌' : 'Unknown Brand');

  // Transform brand tone array to string
  const brandTone = analysis.brandTone.length > 0
    ? analysis.brandTone.join(separator)
    : isZh ? '专业、现代、创新' : 'Professional, Modern, Innovative';

  // Extract primary color (first color) and secondary colors (rest)
  const colors = {
    primary: analysis.colorPalette[0] || '#3B82F6',
    secondary: analysis.colorPalette.slice(1, 4) || ['#8B5CF6', '#EC4899', '#10B981'],
    accent: analysis.colorPalette[1] || undefined,
  };

  // Transform target audience array to string
  const targetAudience = analysis.targetAudience.length > 0
    ? analysis.targetAudience.join(separator)
    : isZh ? '25-40岁的专业人士' : 'Professionals aged 25-40';

  // Use product features as product category
  const productCategory = analysis.productFeatures.length > 0
    ? analysis.productFeatures
    : isZh ? ['产品类别 1', '产品类别 2'] : ['Product Category 1', 'Product Category 2'];

  // Use brand tone as brand personality
  const brandPersonality = analysis.brandTone.length > 0
    ? analysis.brandTone
    : isZh ? ['专业', '创新', '可靠', '友好'] : ['Professional', 'Innovative', 'Reliable', 'Friendly'];

  // Use style keywords as content themes (or create from summary)
  const contentThemes = analysis.styleKeywords.length > 0
    ? analysis.styleKeywords.slice(0, 5)
    : isZh
      ? ['产品创新', '用户体验', '行业领导', '客户成功']
      : ['Product Innovation', 'User Experience', 'Industry Leadership', 'Customer Success'];

  return {
    brandName,
    website: websiteUrl,
    productCategory,
    brandTone,
    brandVoice: brandTone, // Use brand tone as voice for now
    colors,
    styleKeywords: analysis.styleKeywords,
    targetAudience,
    audienceAge: isZh ? '25-40岁' : '25-40 years',
    audienceIncome: isZh ? '中等收入' : 'Middle Income',
    brandPersonality,
    contentThemes,
    visualStyle: {
      photography: isZh
        ? '现代专业的产品摄影，清晰的背景'
        : 'Modern professional product photography with clean backgrounds',
      layout: isZh
        ? '简洁明了的布局，良好的视觉层次'
        : 'Clean and clear layout with good visual hierarchy',
      typography: isZh
        ? '现代无衬线字体，清晰易读'
        : 'Modern sans-serif fonts, clear and readable',
    },
    competitiveAdvantage: isZh
      ? ['产品质量', '用户体验', '创新能力']
      : ['Product Quality', 'User Experience', 'Innovation Capability'],
    recommendedImageStyles: isZh
      ? ['专业产品摄影', '现代办公场景', '用户使用场景', '简洁产品特写']
      : ['Professional Product Photography', 'Modern Office Scenes', 'User Usage Scenarios', 'Clean Product Close-ups'],
    metadata: {
      title: brandName,
      description: analysis.summary || (isZh ? '品牌网站' : 'Brand Website'),
      language: isZh ? 'zh-CN' : 'en-US',
    },
    socialMediaTone: isZh ? '专业且易于理解' : 'Professional and easy to understand',
    marketingFocus: isZh ? ['产品特性', '用户价值', '品牌故事'] : ['Product Features', 'User Value', 'Brand Story'],
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { websiteUrl, locale = 'en' } = await request.json();

    if (!websiteUrl || typeof websiteUrl !== 'string') {
      return NextResponse.json(
        { error: 'Website URL is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(websiteUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Validate locale
    const validLocale = locale === 'zh' ? 'zh' : 'en';

    // Analyze brand tone
    const analysis = await analyzeBrandTone(websiteUrl, validLocale);

    // Transform to detailed result
    const result = transformAnalysisResult(analysis, websiteUrl, validLocale);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error analyzing brand:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to analyze brand',
      },
      { status: 500 }
    );
  }
}

