import { Link } from '@/i18n/navigation';
import { Play, Sparkles, Zap } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export async function Hero() {
  const t = await getTranslations('hero');
  const ctaHref = '/image-generation';

  return (
    <header className="relative pt-32 pb-20 overflow-hidden bg-main border-b border-slate-200 dark:border-white/5">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900" />
      <div className="absolute -left-24 -top-24 w-96 h-96 bg-teal-100/50 dark:bg-teal-900/20 blur-3xl rounded-full" />
      <div className="absolute right-0 top-10 w-[520px] h-[520px] bg-blue-100/40 dark:bg-blue-900/10 blur-[120px] rounded-full" />

      <div className="container-base relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-500 dark:text-teal-400 mb-8 backdrop-blur-sm">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">{t('badge')}</span>
        </div>

        <h1 className="text-[clamp(4rem,9vw,7.5rem)] font-semibold tracking-tight leading-tight text-slate-900 dark:text-white mb-6">
          <span className="text-gradient">{t('titleHighlight')}</span> {t('titleRest')}
        </h1>

        <p className="text-xl text-body mb-10 max-w-2xl mx-auto leading-relaxed">{t('subtitle')}</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Link href={ctaHref} className="btn-primary">
            <Zap className="w-5 h-5" />
            {t('ctaStart')}
          </Link>
          <a
            href="#video-sample"
            className="px-8 py-4 bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/20 text-slate-900 dark:text-white font-medium rounded-xl backdrop-blur-md border border-slate-200 dark:border-white/10 transition-all flex items-center gap-2 shadow-sm dark:shadow-none"
          >
            <Play className="w-5 h-5 fill-current" />
            {t('watchDemo')}
          </a>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-white/10">
          <p className="text-slate-500 text-sm font-medium mb-6 uppercase tracking-widest">
            {t('trustedBy')}
          </p>
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 items-center opacity-80 text-xs font-semibold uppercase tracking-wider">
            {['Amazon', 'TikTok', 'Shopee', 'eBay', 'Etsy'].map((name) => (
              <span
                key={name}
                className="px-3 py-2 rounded-full bg-white/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 shadow-sm"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
