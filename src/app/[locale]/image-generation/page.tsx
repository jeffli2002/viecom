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

      <div className="mt-12 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-8 border border-purple-200 dark:border-purple-800 text-center">
        <h2 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">
          Turn These Images into Videos
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-2xl mx-auto">
          Once you've created your perfect product image, transform it into an engaging video with
          our AI video generator. Perfect for social media, ads, and e-commerce listings.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/image-to-video-ai">
            <Button size="lg" className="group">
              Try Image to Video AI
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/video-generation">
            <Button size="lg" variant="outline">
              Go to Video Generator
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
