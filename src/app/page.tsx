import { Hero } from '@/components/blocks/hero';
import { HowItWorks } from '@/components/blocks/how-it-works';
import { ShowcaseGallery } from '@/components/blocks/showcase-gallery';

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <ShowcaseGallery />
    </>
  );
}
