import { BatchGenerationFeature } from '@/components/blocks/batch-generation-feature';
import { BrandAnalysis } from '@/components/blocks/brand-analysis';
import { FAQ } from '@/components/blocks/faq';
import { Hero } from '@/components/blocks/hero';
import { LoginOverlay, LoginOverlayLoading } from '@/components/blocks/login/login-overlay';
import { ShowcaseGallery } from '@/components/blocks/showcase-gallery';
import { TransformationShowcase } from '@/components/blocks/transformation-showcase';
import { VideoGenerationShowcase } from '@/components/blocks/video-generation-showcase';
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {/* Real homepage content as background */}
      <div className="pointer-events-none">
        <Hero />
        <BrandAnalysis />
        <TransformationShowcase />
        <BatchGenerationFeature />
        <VideoGenerationShowcase />
        <ShowcaseGallery />
        <FAQ />
      </div>

      {/* Login overlay */}
      <Suspense fallback={<LoginOverlayLoading />}>
        <LoginOverlay />
      </Suspense>
    </div>
  );
}

export const dynamic = 'force-dynamic';
