'use client';

import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const VideoGenerator = dynamic(
  () => import('@/components/video-generator').then((mod) => mod.default || mod),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  }
);

export function ClientVideoGenerator() {
  return <VideoGenerator />;
}
