'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/store/auth-store';
import { Download, Image as ImageIcon, Loader2, Search, Video } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

interface Asset {
  id: string;
  url: string;
  type: 'image' | 'video';
  prompt: string;
  createdAt: string;
  status: 'completed' | 'failed';
}

export default function AssetsPage() {
  const t = useTranslations('assets');
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchAssets();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/v1/assets', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAssets(data.assets || []);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || asset.type === filterType;
    return matchesSearch && matchesType && asset.status === 'completed';
  });

  const handleDownload = async (asset: Asset) => {
    try {
      const response = await fetch(asset.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = asset.type === 'image' ? 'png' : 'mp4';
      a.download = `asset-${asset.id}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Link href="/image-generation">
          <Button>{t('generateNew')}</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={filterType}
            onValueChange={(value: string) => setFilterType(value as 'all' | 'image' | 'video')}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder={t('filterType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all')}</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <Card className="p-12 text-center">
          <ImageIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">{t('noAssets')}</h3>
          <p className="mb-4 text-muted-foreground">
            {searchQuery ? t('noAssetsSearch') : t('noAssetsDesc')}
          </p>
          <Link href="/image-generation">
            <Button>{t('startGenerating')}</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className="overflow-hidden group">
              <div className="relative aspect-square bg-muted card-image-container">
                {asset.type === 'image' ? (
                  <Image
                    src={asset.url}
                    alt={asset.prompt}
                    fill
                    className="object-cover transition-transform duration-300"
                    unoptimized
                  />
                ) : (
                  <video
                    src={asset.url}
                    className="w-full h-full object-cover transition-transform duration-300"
                    muted
                    loop
                    playsInline
                  />
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={asset.type === 'image' ? 'default' : 'secondary'}>
                    {asset.type === 'image' ? (
                      <ImageIcon className="mr-1 h-3 w-3" />
                    ) : (
                      <Video className="mr-1 h-3 w-3" />
                    )}
                    {asset.type === 'image' ? 'Image' : 'Video'}
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{asset.prompt}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDownload(asset)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t('download')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
