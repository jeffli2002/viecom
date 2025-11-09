import { HowItWorks } from '@/components/blocks/how-it-works';
import { LandingCTA } from '@/components/blocks/landing-cta';
import { LandingFeatures } from '@/components/blocks/landing-features';
import { LandingFooter } from '@/components/blocks/landing-footer';
import { LandingHeader } from '@/components/blocks/landing-header';
import { LandingHero } from '@/components/blocks/landing-hero';
import { ShowcaseGallery } from '@/components/blocks/showcase-gallery';
import { SocialProof } from '@/components/blocks/social-proof';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <LandingHeader />
      <LandingHero />
      <SocialProof />
      <LandingFeatures />
      <HowItWorks />
      <ShowcaseGallery />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
