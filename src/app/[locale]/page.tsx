import { BatchGenerationFeature } from '@/components/blocks/batch-generation-feature';
import { BrandAnalysis } from '@/components/blocks/brand-analysis';
import { FAQ } from '@/components/blocks/faq';
import { Hero } from '@/components/blocks/hero';
import { TransformationShowcase } from '@/components/blocks/transformation-showcase';
import { LazySection } from '@/components/performance/lazy-section';
import {
  ClientShowcaseGallery,
  ClientVideoGenerationShowcase,
} from '@/components/performance/client-showcases';
import { getSEOMetadata } from '@/lib/seo/metadata-translations';
import type { Metadata } from 'next';

const GALLERY_SKELETON_KEYS = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'];

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
      <LazySection
        placeholder={
          <section className="section-base bg-main">
            <div className="container-base">
              <div className="h-10 w-64 bg-slate-200/60 dark:bg-slate-800/50 rounded mb-4" />
              <div className="h-5 w-full max-w-2xl bg-slate-200/40 dark:bg-slate-800/40 rounded" />
              <div className="mt-8 h-[420px] rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5" />
            </div>
          </section>
        }
      >
        <ClientVideoGenerationShowcase />
      </LazySection>
      <LazySection
        placeholder={
          <section className="section-base bg-alt">
            <div className="container-base">
              <div className="h-10 w-56 bg-slate-200/60 dark:bg-slate-800/50 rounded mb-4" />
              <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
                {GALLERY_SKELETON_KEYS.map((key) => (
                  <div
                    key={key}
                    className="aspect-[4/3] rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5"
                  />
                ))}
              </div>
            </div>
          </section>
        }
      >
        <ClientShowcaseGallery />
      </LazySection>
      <FAQ />
    </div>
  );
}
