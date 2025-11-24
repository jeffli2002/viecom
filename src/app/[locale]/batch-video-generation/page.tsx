'use client';

import { BatchVideoUpload } from '@/components/workflow/batch-video-upload';
import { useTranslations } from 'next-intl';

export default function BatchVideoGenerationPage() {
  const t = useTranslations('batchGeneration');

  return (
    <div className="container-base py-12">
      <div className="mb-8 text-center">
        <h1 className="h2-section mb-2">{t('titleVideo')}</h1>
        <p className="text-body">{t('subtitleVideo')}</p>
      </div>
      <BatchVideoUpload />
    </div>
  );
}
