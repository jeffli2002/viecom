'use client';

import { Card } from '@/components/ui/card';
import { Image as ImageIcon, Loader2, Video } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface ShowcaseAsset {
  id: string;
  url: string;
  type: 'image' | 'video';
  title?: string;
}

export function ShowcaseGallery() {
  const t = useTranslations('showcase');
  const [assets, setAssets] = useState<ShowcaseAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch showcase assets from API
    const fetchShowcase = async () => {
      try {
        const response = await fetch('/api/v1/showcase');
        if (response.ok) {
          const data = await response.json();
          setAssets(data.assets || []);
        }
      } catch (error) {
        console.error('Failed to fetch showcase:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShowcase();
  }, []);

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="container">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-bold">{t('title')}</h2>
            <p className="text-muted-foreground">{t('subtitle')}</p>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (assets.length === 0) {
    return null;
  }

  return (
    <section className="section-container relative overflow-hidden bg-muted/30 py-24">
      {/* Apple-style background */}
      <div className="-z-10 absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/40 via-muted/30 to-muted/20" />
        <div className="absolute inset-0 bg-[size:50px_50px] bg-grid-white/[0.02] dark:bg-grid-black/[0.02]" />
      </div>

      <div className="container relative">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-bold tracking-tight" style={{ fontSize: 'clamp(1.875rem, 5vw, 3.75rem)' }}>
            作品展示
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
            查看我们生成的优质内容
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm transition-all hover:border-primary/20 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900/80"
            >
              <div className="relative aspect-square bg-muted">
                {asset.type === 'image' ? (
                  <Image
                    src={asset.url}
                    alt={asset.title || 'Showcase image'}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    unoptimized
                  />
                ) : (
                  <video
                    src={asset.url}
                    className="h-full w-full object-cover"
                    muted
                    loop
                    playsInline
                  />
                )}
                <div className="absolute top-3 right-3 rounded-full bg-black/50 p-2 backdrop-blur-sm">
                  {asset.type === 'image' ? (
                    <ImageIcon className="h-4 w-4 text-white" />
                  ) : (
                    <Video className="h-4 w-4 text-white" />
                  )}
                </div>
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
