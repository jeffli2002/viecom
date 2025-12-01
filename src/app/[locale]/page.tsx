import { BatchGenerationFeature } from '@/components/blocks/batch-generation-feature';
import { BrandAnalysis } from '@/components/blocks/brand-analysis';
import { FAQ } from '@/components/blocks/faq';
import { Hero } from '@/components/blocks/hero';
import { ShowcaseGallery } from '@/components/blocks/showcase-gallery';
import { TransformationShowcase } from '@/components/blocks/transformation-showcase';
import { VideoGenerationShowcase } from '@/components/blocks/video-generation-showcase';
import { getSEOMetadata } from '@/lib/seo/metadata-translations';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return getSEOMetadata(locale, 'landing', '/');
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
