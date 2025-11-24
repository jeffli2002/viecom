import { Hero } from '@/components/blocks/hero';
import { BrandAnalysis } from '@/components/blocks/brand-analysis';
import { TransformationShowcase } from '@/components/blocks/transformation-showcase';
import { BatchGenerationFeature } from '@/components/blocks/batch-generation-feature';
import { VideoGenerationShowcase } from '@/components/blocks/video-generation-showcase';
import { ShowcaseGallery } from '@/components/blocks/showcase-gallery';
import { FAQ } from '@/components/blocks/faq';
import { buildLocaleCanonicalMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLocaleCanonicalMetadata(locale, '/');
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
