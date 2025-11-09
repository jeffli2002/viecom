'use client';

import VideoGenerator from '@/components/video-generator';
import { useTranslations } from 'next-intl';

export default function VideoGenerationPage() {
  const t = useTranslations('videoGeneration');
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold">AI Video Generation</h1>
        <p className="text-gray-600">
          {t('subtitle')}
        </p>
      </div>
      <VideoGenerator />
    </div>
  );
}
