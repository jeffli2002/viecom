'use client';

import ImageGenerator from '@/components/image-generator';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';

export default function ImageGenerationPage() {
  const t = useTranslations('imageGeneration');

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold">{t('title')}</h1>
        <p className="text-gray-600">{t('subtitle')}</p>
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
    </div>
  );
}
