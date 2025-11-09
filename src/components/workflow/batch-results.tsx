'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  Video,
  XCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

interface GeneratedAsset {
  id: string;
  url: string;
  type: 'image' | 'video';
  prompt: string;
  enhancedPrompt?: string;
  model?: string;
  status: 'completed' | 'failed';
  error?: string;
  rowIndex: number; // Original row index in CSV
}

interface BatchResultsProps {
  jobId: string;
  assets?: GeneratedAsset[]; // Optional - will fetch if not provided
}

export function BatchResults({ jobId, assets: initialAssets }: BatchResultsProps) {
  const t = useTranslations('batchResults');
  const [assets, setAssets] = useState<GeneratedAsset[]>(initialAssets || []);
  const [isLoading, setIsLoading] = useState(!initialAssets);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [downloadingAssets, setDownloadingAssets] = useState<Set<string>>(new Set());
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [jobStatus, setJobStatus] = useState<string>('processing');

  const toggleAsset = (assetId: string) => {
    setSelectedAssets((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  };

  const selectAll = () => {
    const allIds = new Set(assets.filter((a) => a.status === 'completed').map((a) => a.id));
    setSelectedAssets(allIds);
  };

  const deselectAll = () => {
    setSelectedAssets(new Set());
  };

  const handleDownloadAsset = async (asset: GeneratedAsset) => {
    setDownloadingAssets((prev) => new Set(prev).add(asset.id));
    try {
      const response = await fetch(asset.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = asset.type === 'image' ? 'png' : 'mp4';
      a.download = `${asset.type}-${asset.id}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('下载失败');
    } finally {
      setDownloadingAssets((prev) => {
        const next = new Set(prev);
        next.delete(asset.id);
        return next;
      });
    }
  };

  const handleBatchDownload = async () => {
    if (selectedAssets.size === 0) {
      alert('Please select at least one asset');
      return;
    }

    const selected = assets.filter((a) => selectedAssets.has(a.id));

    for (const asset of selected) {
      await handleDownloadAsset(asset);
      // Small delay between downloads
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  const handleDownloadUpdatedTemplate = async (format: 'excel' | 'csv') => {
    setIsDownloadingTemplate(true);
    try {
      // Fetch updated template with generated URLs
      const response = await fetch(`/api/v1/workflow/batch/${jobId}/template?format=${format}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch-results-${jobId}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download template error:', error);
      alert('下载更新后的模板失败');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // Fetch assets on mount and when jobId changes
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch(`/api/v1/workflow/batch/${jobId}/results`, {
          credentials: 'include',
        });
        const data = await response.json();

        if (data.success) {
          setJobStatus(data.data.jobStatus);
          if (data.data.assets) {
            const formattedAssets: GeneratedAsset[] = data.data.assets.map((asset: any) => ({
              id: asset.id,
              url: asset.url,
              type: asset.type,
              prompt: asset.prompt,
              enhancedPrompt: asset.enhancedPrompt,
              model: asset.model,
              status: asset.status,
              error: asset.error,
              rowIndex: asset.rowIndex,
            }));
            setAssets(formattedAssets);
            setIsLoading(false);
          }

          // Stop polling if job is completed or failed
          if (data.data.jobStatus === 'completed' || data.data.jobStatus === 'failed') {
            return false; // Signal to stop polling
          }
        }
      } catch (error) {
        console.error('Fetch assets error:', error);
        setIsLoading(false);
      }
      return true; // Continue polling
    };

    if (jobId && !initialAssets) {
      setIsLoading(true);
      fetchAssets();

      // Poll for updates every 3 seconds until completed
      const interval = setInterval(async () => {
        const shouldContinue = await fetchAssets();
        if (!shouldContinue) {
          clearInterval(interval);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [jobId, initialAssets]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3">{t('generating')}</span>
        </div>
      </Card>
    );
  }

  const completedAssets = assets.filter((a) => a.status === 'completed');
  const failedAssets = assets.filter((a) => a.status === 'failed');

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('title')}</h2>
            <p className="text-gray-600">
              {t('success')}: {completedAssets.length} / {t('failed')}: {failedAssets.length} /{' '}
              {t('total')}: {assets.length}
              {jobStatus === 'processing' && (
                <span className="ml-2 text-sm text-blue-500">{t('processing')}</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={selectAll} disabled={completedAssets.length === 0}>
              {t('selectAll')}
            </Button>
            <Button variant="outline" onClick={deselectAll} disabled={selectedAssets.size === 0}>
              {t('deselectAll')}
            </Button>
            <Button onClick={handleBatchDownload} disabled={selectedAssets.size === 0}>
              <Download className="w-4 h-4 mr-2" />
              {t('batchDownload', { count: selectedAssets.size })}
            </Button>
          </div>
        </div>

        {/* Download Updated Template */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <Label className="text-sm font-medium mb-2 block">{t('downloadUpdatedTemplate')}</Label>
          <p className="text-xs text-gray-600 mb-3">{t('downloadUpdatedTemplateDesc')}</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleDownloadUpdatedTemplate('excel')}
              disabled={isDownloadingTemplate}
              className="flex items-center gap-2"
            >
              {isDownloadingTemplate ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              下载 Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownloadUpdatedTemplate('csv')}
              disabled={isDownloadingTemplate}
              className="flex items-center gap-2"
            >
              {isDownloadingTemplate ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              下载 CSV
            </Button>
          </div>
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset, index) => (
            <Card
              key={asset.id}
              className={`p-4 ${selectedAssets.has(asset.id) ? 'ring-2 ring-primary' : ''}`}
            >
              <div className="space-y-3">
                {/* Checkbox */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedAssets.has(asset.id)}
                      onCheckedChange={() => toggleAsset(asset.id)}
                      disabled={asset.status !== 'completed'}
                    />
                    <span className="text-sm font-medium">#{index + 1}</span>
                    {asset.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <Badge variant={asset.type === 'image' ? 'default' : 'secondary'}>
                    {asset.type === 'image' ? (
                      <ImageIcon className="w-3 h-3 mr-1" />
                    ) : (
                      <Video className="w-3 h-3 mr-1" />
                    )}
                    {asset.type === 'image' ? '图片' : '视频'}
                  </Badge>
                </div>

                {/* Preview */}
                {asset.status === 'completed' ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 card-image-container">
                    {asset.type === 'image' ? (
                      <Image
                        src={asset.url}
                        alt="Generated asset"
                        fill
                        className="object-contain transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <video
                        src={asset.url}
                        controls
                        className="w-full h-full object-contain transition-transform duration-300"
                      />
                    )}
                  </div>
                ) : (
                  <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                )}

                {/* Prompt Info */}
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">{t('originalPrompt')}</div>
                  <div className="text-sm line-clamp-2">{asset.prompt}</div>
                  {asset.enhancedPrompt && asset.enhancedPrompt !== asset.prompt && (
                    <>
                      <div className="text-xs text-gray-500 mt-2">{t('enhancedPrompt')}</div>
                      <div className="text-sm line-clamp-2 text-primary">
                        {asset.enhancedPrompt}
                      </div>
                    </>
                  )}
                </div>

                {/* Model Info */}
                {asset.model && (
                  <div className="text-xs text-gray-500">
                    {t('model')}: {asset.model}
                  </div>
                )}

                {/* Error Message */}
                {asset.status === 'failed' && asset.error && (
                  <div className="text-xs text-red-500">
                    {t('error')}: {asset.error}
                  </div>
                )}

                {/* Actions */}
                {asset.status === 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadAsset(asset)}
                    disabled={downloadingAssets.has(asset.id)}
                    className="w-full"
                  >
                    {downloadingAssets.has(asset.id) ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        下载中...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        下载
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  );
}
