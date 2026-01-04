import { BatchGenerationFeature } from '@/components/blocks/batch-generation-feature';
import { BrandAnalysis } from '@/components/blocks/brand-analysis';
import { FAQ } from '@/components/blocks/faq';
import { Hero } from '@/components/blocks/hero';
import { ShowcaseGallery } from '@/components/blocks/showcase-gallery';
import { SignupOverlay, SignupOverlayLoading } from '@/components/blocks/signup/signup-overlay';
import { TransformationShowcase } from '@/components/blocks/transformation-showcase';
import { VideoGenerationShowcase } from '@/components/blocks/video-generation-showcase';
import { Suspense } from 'react';

export default function SignupPage() {
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

      {/* Signup overlay */}
      <Suspense fallback={<SignupOverlayLoading />}>
        <SignupOverlay />
      </Suspense>
    </div>
  );
}

export const dynamic = 'force-dynamic';
