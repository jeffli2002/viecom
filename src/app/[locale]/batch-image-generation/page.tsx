'use client';

import { BatchImageUpload } from '@/components/workflow/batch-image-upload';
import { useTranslations } from 'next-intl';

export default function BatchImageGenerationPage() {
  const t = useTranslations('batchGeneration');

  return (
    <div className="container-base py-12">
      <div className="mb-8 text-center">
        <h1 className="h2-section mb-2">{t('titleImage')}</h1>
        <p className="text-body">{t('subtitleImage')}</p>
      </div>
      <BatchImageUpload />
    </div>
  );
}
