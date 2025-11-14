'use client';

import { BatchImageUpload } from '@/components/workflow/batch-image-upload';
import { useTranslations } from 'next-intl';

export default function BatchImageGenerationPage() {
  const t = useTranslations('batchGeneration');

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold">{t('titleImage')}</h1>
        <p className="text-gray-600">{t('subtitleImage')}</p>
      </div>
      <BatchImageUpload />
    </div>
  );
}
