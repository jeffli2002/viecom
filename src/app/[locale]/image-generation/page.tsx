import { LazySection } from '@/components/performance/lazy-section';
import { ClientImageGenerator } from '@/components/performance/client-image-generator';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function ImageGenerationPage() {
  const t = await getTranslations('imageGeneration');

  return (
    <div className="container-base py-12">
      <div className="mb-8 text-center">
        <h1 className="h2-section mb-2">{t('title')}</h1>
        <p className="text-body">{t('subtitle')}</p>
      </div>
      <LazySection
        placeholder={
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/30 p-8">
            <div className="h-8 w-56 bg-slate-200/60 dark:bg-slate-800/60 rounded mb-4" />
            <div className="h-5 w-full max-w-2xl bg-slate-200/40 dark:bg-slate-800/40 rounded" />
            <div className="mt-8 h-[520px] rounded-xl bg-white/70 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10" />
          </div>
        }
        rootMargin="1200px"
      >
        <ClientImageGenerator />
      </LazySection>

      <div className="mt-12 bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 rounded-xl p-8 border border-teal-200 dark:border-teal-800 text-center">
        <h2 className="h2-section mb-3 text-slate-900 dark:text-white">
          {t('videoPromotionTitle')}
        </h2>
        <p className="text-body mb-6 max-w-2xl mx-auto">{t('videoPromotionDescription')}</p>
        <div className="flex justify-center gap-4">
          <Link href="/image-to-video-ai">
            <Button size="lg" className="btn-primary group">
              {t('videoPromotionCtaPrimary')}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/video-generation">
            <Button size="lg" variant="outline">
              {t('videoPromotionCtaSecondary')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
