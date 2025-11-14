'use client';

import { BatchVideoUpload } from '@/components/workflow/batch-video-upload';
import { useTranslations } from 'next-intl';

export default function BatchVideoGenerationPage() {
  const t = useTranslations('batchGeneration');

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold">{t('titleVideo')}</h1>
        <p className="text-gray-600">{t('subtitleVideo')}</p>
      </div>
      <BatchVideoUpload />
    </div>
  );
}
