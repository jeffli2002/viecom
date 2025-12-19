import { LazySection } from '@/components/performance/lazy-section';
import { ClientVideoGenerator } from '@/components/performance/client-video-generator';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';

export default async function VideoGenerationPage() {
  const t = await getTranslations('videoGeneration');

  return (
    <div className="container-base py-12">
      <div className="mb-8 text-center">
        <h1 className="h2-section mb-2">{t('title')}</h1>
        <p className="text-body mb-4">{t('subtitle')}</p>
        <div className="flex justify-center gap-4 text-sm">
          <Link href="/image-to-video-ai" className="text-primary hover:underline">
            Learn about Image to Video AI →
          </Link>
          <Link href="/pricing" className="text-primary hover:underline">
            View Pricing →
          </Link>
        </div>
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
        <ClientVideoGenerator />
      </LazySection>
    </div>
  );
}
