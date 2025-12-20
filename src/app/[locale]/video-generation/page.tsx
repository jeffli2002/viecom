'use client';

import VideoGenerator from '@/components/video-generator';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Suspense } from 'react';

export default function VideoGenerationPage() {
  const t = useTranslations('videoGeneration');

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
