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
import { Download, Image as ImageIcon, Loader2, Search, Video, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

interface Asset {
  id: string;
  url: string;
  type: 'image' | 'video';
  prompt: string;
  createdAt: string;
  status: 'completed' | 'failed';
  previewUrl?: string | null;
  r2Key?: string | null;
}

function AssetsPageContent() {
  const t = useTranslations('assets');
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      void fetchAssets();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/v1/assets', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAssets(
          (data.assets || []).map((asset: Asset) => ({
            ...asset,
            previewUrl: asset.previewUrl || null,
            r2Key: asset.r2Key || null,
          }))
        );
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

  const getDownloadUrl = (asset: Asset) => {
    if (asset.r2Key) {
      return `/api/v1/media?key=${encodeURIComponent(asset.r2Key)}&download=1`;
    }
    if (asset.url?.startsWith('/api/v1/media')) {
      return `${asset.url}${asset.url.includes('?') ? '&' : '?'}download=1`;
    }
    return asset.url;
  };

  const getPreviewUrl = (asset: Asset) => {
    if (asset.previewUrl) {
      return asset.previewUrl;
    }

    if (asset.url?.startsWith('/api/v1/media') && asset.r2Key) {
      return `/api/v1/media?key=${encodeURIComponent(asset.r2Key)}`;
    }

    return asset.url;
  };

  const handleDownload = async (asset: Asset) => {
    let downloadUrl: string | undefined;
    try {
      downloadUrl = getDownloadUrl(asset);
      const response = await fetch(downloadUrl, {
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch asset: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const extension = asset.type === 'image' ? 'png' : 'mp4';
      anchor.download = `${asset.type}-${asset.id}-${Date.now()}.${extension}`;
      document.body.appendChild(anchor);
      anchor.click();
      if (anchor.remove) {
        anchor.remove();
      } else if (anchor.parentNode) {
        anchor.parentNode.removeChild(anchor);
      }
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);

      if (!downloadUrl) {
        downloadUrl = getDownloadUrl(asset);
      }
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.target = '_blank';
      anchor.download = `${asset.type}-${asset.id}.${asset.type === 'image' ? 'png' : 'mp4'}`;
      document.body.appendChild(anchor);
      anchor.click();
      if (anchor.remove) {
        anchor.remove();
      } else if (anchor.parentNode) {
        anchor.parentNode.removeChild(anchor);
      }
    }
  };

  const handleDelete = async (asset: Asset) => {
    if (deletingId) {
      return;
    }

    const confirmed = window.confirm(t('confirmDelete'));
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(asset.id);
      const response = await fetch(`/api/v1/assets?id=${encodeURIComponent(asset.id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete asset: ${response.status}`);
      }

      setAssets((current) => current.filter((item) => item.id !== asset.id));
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeletingId(null);
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
          <Button className="bg-teal-500 text-white hover:bg-teal-600 shadow shadow-teal-500/30">
            {t('generateNew')}
          </Button>
        </Link>
      </div>

      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
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

      {filteredAssets.length === 0 ? (
        <Card className="p-12 text-center">
          <ImageIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">{t('noAssets')}</h3>
          <p className="mb-4 text-muted-foreground">
            {searchQuery ? t('noAssetsSearch') : t('noAssetsDesc')}
          </p>
          <Link href="/image-generation">
            <Button className="bg-teal-500 text-white hover:bg-teal-600 shadow shadow-teal-500/30">
              {t('startGenerating')}
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className="overflow-hidden group">
              <div className="relative aspect-square bg-muted card-image-container">
                {asset.type === 'image' ? (
                  <Image
                    src={getPreviewUrl(asset)}
                    alt={asset.prompt}
                    fill
                    className="object-cover transition-transform duration-300"
                    unoptimized
                  />
                ) : (
                  <video
                    src={getPreviewUrl(asset)}
                    className="w-full h-full object-cover transition-transform duration-300"
                    muted
                    loop
                    playsInline
                    controls={false}
                    preload="metadata"
                  />
                )}
                <div className="absolute top-2 left-2">
                  <Badge variant={asset.type === 'image' ? 'default' : 'secondary'}>
                    {asset.type === 'image' ? (
                      <ImageIcon className="mr-1 h-3 w-3" />
                    ) : (
                      <Video className="mr-1 h-3 w-3" />
                    )}
                    {asset.type === 'image' ? 'Image' : 'Video'}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8 rounded-full bg-background/80 text-foreground shadow-sm hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleDelete(asset)}
                  disabled={deletingId === asset.id}
                  aria-label={t('delete')}
                >
                  {deletingId === asset.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
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

export default function AssetsPageClient() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      }
    >
      <AssetsPageContent />
    </Suspense>
  );
}
