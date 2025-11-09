'use client';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { ArrowRight, FileSpreadsheet, Image as ImageIcon, Sparkles, Video } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export function Hero() {
  const t = useTranslations('hero');
  const { isAuthenticated } = useAuthStore();

  return (
    <section className="section-container relative flex min-h-[85vh] items-center overflow-hidden bg-muted/30">
      {/* Apple-style background with subtle pattern */}
      <div className="-z-10 absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/40 via-muted/30 to-muted/20" />
        <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-[1400px] w-[1400px]">
          <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-primary/2 to-transparent blur-3xl" />
        </div>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[size:50px_50px] bg-grid-white/[0.02] dark:bg-grid-black/[0.02]" />
      </div>

      <div className="container relative py-20 md:py-24">
        {/* Announcement badge */}
        <div className="fade-in slide-up mb-12 flex animate-in justify-center duration-400">
          <div className="inline-flex items-center rounded-full border border-gray-300 bg-white px-6 py-3 text-gray-900 text-sm shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
            <Sparkles className="mr-2 h-4 w-4" />
            <span className="font-semibold">AI驱动的电商内容生成工具</span>
          </div>
        </div>

        <div className="mx-auto max-w-6xl text-center">
          {/* Heading */}
          <h1 className="fade-in slide-up animate-in delay-100 duration-700">
            <span className="font-bold text-3xl leading-[1.1] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              {t('title')}{' '}
              <span className="animate-gradient bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                {t('titleHighlight')}
              </span>
            </span>
          </h1>

          {/* Description */}
          <p className="fade-in slide-up mx-auto mt-8 max-w-3xl animate-in text-lg text-muted-foreground delay-200 duration-700 md:text-xl">
            {t('description')}
          </p>

          {/* CTA Buttons */}
          <div className="fade-in slide-up mt-10 flex flex-col items-center justify-center gap-4 animate-in delay-300 duration-700 sm:flex-row">
            {isAuthenticated ? (
              <>
                <Link href="/image-generation">
                  <Button size="lg" className="group h-12 px-8 text-base">
                    {t('featureImage')}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/batch-image-generation">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                    {t('featureBatch')}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="group h-12 px-8 text-base">
                    {t('ctaStart')}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                    {t('ctaLogin')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Features Grid */}
          <div className="fade-in slide-up mt-16 grid grid-cols-1 gap-6 animate-in delay-400 duration-700 sm:grid-cols-3">
            <div className="group rounded-2xl border border-gray-200 bg-white/80 p-8 text-center backdrop-blur-sm transition-all hover:border-primary/20 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/80">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <ImageIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{t('featureImage')}</h3>
              <p className="text-sm text-muted-foreground">{t('featureImageDesc')}</p>
            </div>
            <div className="group rounded-2xl border border-gray-200 bg-white/80 p-8 text-center backdrop-blur-sm transition-all hover:border-primary/20 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/80">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{t('featureVideo')}</h3>
              <p className="text-sm text-muted-foreground">{t('featureVideoDesc')}</p>
            </div>
            <div className="group rounded-2xl border border-gray-200 bg-white/80 p-8 text-center backdrop-blur-sm transition-all hover:border-primary/20 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/80">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{t('featureBatch')}</h3>
              <p className="text-sm text-muted-foreground">{t('featureBatchDesc')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
