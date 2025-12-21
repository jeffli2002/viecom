'use client';

import dynamic from 'next/dynamic';

const VideoGenerationShowcase = dynamic(
  () =>
    import('@/components/blocks/video-generation-showcase').then((m) => m.VideoGenerationShowcase),
  { ssr: false }
);

const ShowcaseGallery = dynamic(
  () => import('@/components/blocks/showcase-gallery').then((m) => m.ShowcaseGallery),
  { ssr: false }
);

export function ClientVideoGenerationShowcase() {
  return <VideoGenerationShowcase />;
}

export function ClientShowcaseGallery() {
  return <ShowcaseGallery />;
}
