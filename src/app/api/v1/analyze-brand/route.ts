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
  audienceSegments?: string[];
  brandPersonality: string[];
  contentThemes: string[];
  visualStyle?: {
    photography: string;
    layout: string;
    typography: string;
  };
  competitiveAdvantage?: string[];
  recommendedImageStyles?: string[];
  recommendedVideoStyles?: string[];
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
  locale = 'en'
): BrandAnalysisResult {
  const isZh = locale === 'zh';
  const separator = isZh ? '、' : ', ';

  const brandToneList = Array.isArray(analysis.brandTone) ? analysis.brandTone.filter(Boolean) : [];
  const productFeatures = Array.isArray(analysis.productFeatures)
    ? analysis.productFeatures.filter(Boolean)
    : [];
  const colorPalette = Array.isArray(analysis.colorPalette)
    ? analysis.colorPalette.filter(Boolean)
    : [];
  const styleKeywords = Array.isArray(analysis.styleKeywords)
    ? analysis.styleKeywords.filter(Boolean)
    : [];

  const brandName =
    analysis.brandName?.trim() ||
    new URL(websiteUrl).hostname.replace('www.', '').split('.')[0] ||
    (isZh ? '未知品牌' : 'Unknown Brand');

  const brandTone =
    brandToneList.length > 0
      ? brandToneList.join(separator)
      : isZh
        ? '专业、现代、创新'
        : 'Professional, Modern, Innovative';

  // Filter out invalid colors and common placeholder colors (purple/violet) unless they're actually in the palette
  const validColors = colorPalette.filter((color) => {
    if (!color || typeof color !== 'string') return false;
    const normalized = color.trim().toUpperCase();
    // Check if it's a valid hex color
    if (!/^#[0-9A-F]{6}$/.test(normalized)) return false;
    // Filter out common purple/violet placeholder colors unless they're explicitly in the first position
    const purpleColors = ['#9333EA', '#8B5CF6', '#A855F7', '#7C3AED', '#EC4899'];
    if (purpleColors.includes(normalized) && colorPalette.indexOf(color) > 0) return false;
    return true;
  });

  const secondaryColors = validColors.slice(1, 4);
  const colors = {
    primary: validColors[0] || '#6B7280', // Use neutral gray instead of blue/purple
    secondary: secondaryColors.length > 0 ? secondaryColors : ['#9CA3AF', '#D1D5DB', '#F3F4F6'], // Neutral grays instead of purple/pink
    accent: validColors[4] || validColors[1] || undefined,
  };

  const demographics = analysis.audienceDemographics || {};
  const demographicSegments = Array.isArray(demographics.keySegments)
    ? demographics.keySegments.filter(Boolean)
    : [];
  const targetAudienceList =
    analysis.targetAudience.length > 0 ? analysis.targetAudience : demographicSegments;

  const targetAudience =
    targetAudienceList.length > 0
      ? targetAudienceList.join(separator)
      : isZh
        ? '25-40岁的专业人士'
        : 'Professionals aged 25-40';

  const audienceAge = demographics.ageRange?.trim();
  const audienceIncome = demographics.incomeLevel?.trim();

  const productCategory =
    productFeatures.length > 0
      ? productFeatures
      : isZh
        ? ['产品类别 1', '产品类别 2']
        : ['Product Category 1', 'Product Category 2'];

  const brandPersonality =
    brandToneList.length > 0
      ? brandToneList
      : isZh
        ? ['专业', '创新', '可靠', '友好']
        : ['Professional', 'Innovative', 'Reliable', 'Friendly'];

  const contentThemes =
    styleKeywords.length > 0
      ? styleKeywords.slice(0, 5)
      : isZh
        ? ['产品创新', '用户体验', '行业领导', '客户成功']
        : ['Product Innovation', 'User Experience', 'Industry Leadership', 'Customer Success'];

  const creativeGuidance = analysis.creativeGuidance || {};
  const imageStyles = Array.isArray(creativeGuidance.imageStyles)
    ? creativeGuidance.imageStyles.filter(Boolean)
    : [];
  const videoStyles = Array.isArray(creativeGuidance.videoStyles)
    ? creativeGuidance.videoStyles.filter(Boolean)
    : [];
  const messagingAngles = Array.isArray(creativeGuidance.messagingAngles)
    ? creativeGuidance.messagingAngles.filter(Boolean)
    : [];

  const defaultImageStyles = isZh
    ? ['专业产品摄影', '现代办公场景', '用户使用场景', '简洁产品特写']
    : [
        'Professional Product Photography',
        'Modern Office Scenes',
        'User Usage Scenarios',
        'Clean Product Close-ups',
      ];
  const defaultVideoStyles = isZh
    ? ['动态产品演示', '真实用户见证', '品牌故事短片']
    : ['Dynamic Product Demo', 'Authentic User Testimonials', 'Brand Story Short Film'];

  const marketingFocus =
    messagingAngles.length > 0
      ? messagingAngles
      : isZh
        ? ['产品特性', '用户价值', '品牌故事']
        : ['Product Features', 'User Value', 'Brand Story'];

  return {
    brandName,
    website: websiteUrl,
    productCategory,
    brandTone,
    brandVoice: brandTone,
    colors,
    styleKeywords,
    targetAudience,
    audienceAge: audienceAge || (isZh ? '25-40岁' : '25-40 years'),
    audienceIncome: audienceIncome || (isZh ? '中等收入' : 'Middle Income'),
    audienceSegments: targetAudienceList.length > 0 ? targetAudienceList : undefined,
    brandPersonality,
    contentThemes,
    visualStyle: {
      photography: isZh
        ? '现代专业的产品摄影，清晰的背景'
        : 'Modern professional product photography with clean backgrounds',
      layout: isZh
        ? '简洁明了的布局，良好的视觉层次'
        : 'Clean and clear layout with good visual hierarchy',
      typography: isZh ? '现代无衬线字体，清晰易读' : 'Modern sans-serif fonts, clear and readable',
    },
    competitiveAdvantage: isZh
      ? ['产品质量', '用户体验', '创新能力']
      : ['Product Quality', 'User Experience', 'Innovation Capability'],
    recommendedImageStyles: (imageStyles.length > 0 ? imageStyles : defaultImageStyles).slice(0, 6),
    recommendedVideoStyles: videoStyles.length > 0 ? videoStyles.slice(0, 6) : defaultVideoStyles,
    metadata: {
      title: brandName,
      description: analysis.summary || (isZh ? '品牌网站' : 'Brand Website'),
      language: isZh ? 'zh-CN' : 'en-US',
    },
    socialMediaTone: isZh ? '专业且易于理解' : 'Professional and easy to understand',
    marketingFocus,
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
