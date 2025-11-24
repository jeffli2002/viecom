'use client';

import VideoGenerator from '@/components/video-generator';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';

export default function VideoGenerationPage() {
  const t = useTranslations('videoGeneration');

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
        <VideoGenerator />
      </Suspense>
    </div>
  );
}
