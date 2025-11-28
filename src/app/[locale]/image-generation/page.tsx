'use client';

import ImageGenerator from '@/components/image-generator';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Suspense } from 'react';

export default function ImageGenerationPage() {
  const t = useTranslations('imageGeneration');

  return (
    <div className="container-base py-12">
      <div className="mb-8 text-center">
        <h1 className="h2-section mb-2">{t('title')}</h1>
        <p className="text-body">{t('subtitle')}</p>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <ImageGenerator />
      </Suspense>

      <div className="mt-12 bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 rounded-xl p-8 border border-teal-200 dark:border-teal-800 text-center">
        <h2 className="h2-section mb-3 text-slate-900 dark:text-white">
          {t('videoPromotionTitle')}
        </h2>
        <p className="text-body mb-6 max-w-2xl mx-auto">
          {t('videoPromotionDescription')}
        </p>
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
