import { BatchGenerationFeature } from '@/components/blocks/batch-generation-feature';
import { BrandAnalysis } from '@/components/blocks/brand-analysis';
import { FAQ } from '@/components/blocks/faq';
import { Hero } from '@/components/blocks/hero';
import { ShowcaseGallery } from '@/components/blocks/showcase-gallery';
import { TransformationShowcase } from '@/components/blocks/transformation-showcase';
import { VideoGenerationShowcase } from '@/components/blocks/video-generation-showcase';
import { buildLocaleCanonicalMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const baseMetadata = buildLocaleCanonicalMetadata(locale, '/');

  if (locale === 'zh') {
    return {
      ...baseMetadata,
      title: 'AI视频生成器 | 电商产品照片秒变视频',
      description:
        '用AI将产品照片转换为吸引人的视频。注册送30积分免费试用。Sora 2模型，批量生成，720p视频几分钟完成。无需信用卡。',
      keywords: [
        'AI视频生成器',
        '图片转视频',
        '免费AI视频生成',
        '产品视频生成',
        '电商视频AI',
        '批量视频生成',
        'AI图像生成器',
        'Sora 2视频',
      ],
      openGraph: {
        title: 'AI视频生成器 | 电商产品照片秒变视频',
        description: '用AI将产品照片转换为吸引人的视频。注册送30积分免费试用。',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'AI视频生成器 | 电商产品照片秒变视频',
        description: '用AI将产品照片转换为吸引人的视频。注册送30积分免费试用。',
      },
    };
  }

  return {
    ...baseMetadata,
    title: 'AI Video Generator for E-commerce | Image to Video in Seconds',
    description:
      'Transform product photos into engaging videos with AI. Free trial with 30 credits. Sora 2 models, batch generation, 720p in minutes. No credit card required.',
    keywords: [
      'ai video generator',
      'image to video ai',
      'free ai video generator',
      'product video generator',
      'e-commerce video ai',
      'batch video generation',
      'ai image generator',
      'sora 2 video',
    ],
    openGraph: {
      title: 'AI Video Generator for E-commerce | Image to Video in Seconds',
      description:
        'Transform product photos into engaging videos with AI. Free trial with 30 credits.',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'AI Video Generator for E-commerce | Image to Video in Seconds',
      description:
        'Transform product photos into engaging videos with AI. Free trial with 30 credits.',
    },
  };
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <Hero />
      <BrandAnalysis />
      <TransformationShowcase />
      <BatchGenerationFeature />
      <VideoGenerationShowcase />
      <ShowcaseGallery />
      <FAQ />
    </div>
  );
}
