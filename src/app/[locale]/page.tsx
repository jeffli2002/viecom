import { HowItWorks } from '@/components/blocks/how-it-works';
import { LandingCTA } from '@/components/blocks/landing-cta';
import { LandingFeatures } from '@/components/blocks/landing-features';
import { LandingHero } from '@/components/blocks/landing-hero';
import { SocialProof } from '@/components/blocks/social-proof';
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
      <LandingHero />
      <SocialProof />
      <LandingFeatures />
      <HowItWorks />
      <LandingCTA />
    </div>
  );
}
