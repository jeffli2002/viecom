'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { type EcommercePlatform, PLATFORM_CONFIGS } from '@/lib/publishing/platform-service';
import { CheckCircle2, ExternalLink, Loader2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';

interface PreviewPublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetUrl: string;
  assetType: 'image' | 'video';
  assetId: string;
  onPublishSuccess?: () => void;
}

export function PreviewPublishDialog({
  open,
  onOpenChange,
  assetUrl,
  assetType,
  assetId,
  onPublishSuccess,
}: PreviewPublishDialogProps) {
  const t = useTranslations('publishing');
  const [publishMode, setPublishMode] = useState<'media-only' | 'product'>('media-only');
  const [selectedPlatforms, setSelectedPlatforms] = useState<EcommercePlatform[]>([]);
  const [productTitle, setProductTitle] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productTags, setProductTags] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productBrand, setProductBrand] = useState('');
  const [productSku, setProductSku] = useState('');
  const [productUpc, setProductUpc] = useState('');
  const [productCountryOfOrigin, setProductCountryOfOrigin] = useState('');
  const [standardPrice, setStandardPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [inventoryQuantity, setInventoryQuantity] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<
    Array<{
      platform: EcommercePlatform;
      success: boolean;
      publishUrl?: string;
      error?: string;
    }>
  >([]);

  const availablePlatforms = Object.entries(PLATFORM_CONFIGS).filter(([_, config]) => {
    if (assetType === 'image') return config.supportsImage;
    if (assetType === 'video') return config.supportsVideo;
    return false;
  }) as Array<[EcommercePlatform, (typeof PLATFORM_CONFIGS)[EcommercePlatform]]>;

  const togglePlatform = (platform: EcommercePlatform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }

    // 如果是产品模式，验证必填字段
    if (publishMode === 'product') {
      if (!productTitle || !standardPrice) {
        alert('In product mode, title and standard price are required');
        return;
      }
    }

    setIsPublishing(true);
    setPublishResults([]);

    try {
      const response = await fetch('/api/v1/publishing/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId,
          platforms: selectedPlatforms,
          publishMode, // 添加发布模式
          productInfo:
            publishMode === 'product'
              ? {
                  title: productTitle || undefined,
                  description: productDescription || undefined,
                  category: productCategory || undefined,
                  brand: productBrand || undefined,
                  sku: productSku || undefined,
                  upc: productUpc || undefined,
                  countryOfOrigin: productCountryOfOrigin || undefined,
                  standardPrice: standardPrice ? Number.parseFloat(standardPrice) : undefined,
                  salePrice: salePrice ? Number.parseFloat(salePrice) : undefined,
                  inventoryQuantity: inventoryQuantity
                    ? Number.parseInt(inventoryQuantity)
                    : undefined,
                  tags: productTags
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                }
              : undefined, // 仅媒体模式时不发送产品信息
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '发布失败');
      }

      setPublishResults(data.data.results);
      onPublishSuccess?.();
    } catch (error) {
      console.error('Publish error:', error);
      alert(error instanceof Error ? error.message : '发布失败');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleClose = () => {
    if (!isPublishing) {
      setSelectedPlatforms([]);
      setProductTitle('');
      setProductDescription('');
      setProductTags('');
      setProductCategory('');
      setProductBrand('');
      setProductSku('');
      setProductUpc('');
      setProductCountryOfOrigin('');
      setStandardPrice('');
      setSalePrice('');
      setInventoryQuantity('');
      setPublishResults([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('previewAndPublish')}</DialogTitle>
          <DialogDescription>{t('previewDesc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview Section */}
          <div className="border rounded-lg p-4">
            <Label className="text-sm font-medium mb-2 block">{t('preview')}</Label>
            <div className="relative aspect-square max-w-md mx-auto rounded-lg overflow-hidden bg-gray-100">
              {assetType === 'image' ? (
                <Image
                  src={assetUrl}
                  alt="Generated asset"
                  fill
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <video src={assetUrl} controls className="w-full h-full object-contain">
                  <track kind="captions" src="data:text/vtt,WEBVTT" label="captions" />
                </video>
              )}
            </div>
          </div>

          {/* Publish Mode Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">{t('publishMode')}</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`border rounded-lg p-3 cursor-pointer transition-colors text-left ${
                  publishMode === 'media-only' ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'
                }`}
                onClick={() => setPublishMode('media-only')}
                aria-pressed={publishMode === 'media-only'}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      publishMode === 'media-only' ? 'border-primary bg-primary' : 'border-gray-300'
                    }`}
                  >
                    {publishMode === 'media-only' && (
                      <div className="w-full h-full rounded-full bg-white scale-50" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{t('mediaOnly')}</div>
                    <div className="text-xs text-gray-500">{t('mediaOnlyDesc')}</div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                className={`border rounded-lg p-3 cursor-pointer transition-colors text-left ${
                  publishMode === 'product' ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'
                }`}
                onClick={() => setPublishMode('product')}
                aria-pressed={publishMode === 'product'}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      publishMode === 'product' ? 'border-primary bg-primary' : 'border-gray-300'
                    }`}
                  >
                    {publishMode === 'product' && (
                      <div className="w-full h-full rounded-full bg-white scale-50" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{t('fullProduct')}</div>
                    <div className="text-xs text-gray-500">{t('fullProductDesc')}</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Platform Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">{t('selectPlatforms')}</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availablePlatforms.map(([platform, config]) => (
                <button
                  key={platform}
                  type="button"
                  className={`border rounded-lg p-3 cursor-pointer transition-colors text-left ${
                    selectedPlatforms.includes(platform)
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => togglePlatform(platform)}
                  aria-pressed={selectedPlatforms.includes(platform)}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedPlatforms.includes(platform)}
                      onCheckedChange={() => togglePlatform(platform)}
                    />
                    <span className="text-2xl">{config.icon}</span>
                    <span className="text-sm font-medium">{config.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Product Information - Only show when product mode is selected */}
          {publishMode === 'product' && (
            <div className="space-y-4">
              <Label className="text-sm font-medium">{t('productInfo')}</Label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product-title" className="text-xs text-gray-500">
                    {t('productTitle')}
                  </Label>
                  <Input
                    id="product-title"
                    value={productTitle}
                    onChange={(e) => setProductTitle(e.target.value)}
                    placeholder="产品标题"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="product-category" className="text-xs text-gray-500">
                    分类
                  </Label>
                  <Input
                    id="product-category"
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    placeholder="产品分类"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="product-description" className="text-xs text-gray-500">
                  描述
                </Label>
                <Textarea
                  id="product-description"
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="产品描述"
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product-brand" className="text-xs text-gray-500">
                    品牌
                  </Label>
                  <Input
                    id="product-brand"
                    value={productBrand}
                    onChange={(e) => setProductBrand(e.target.value)}
                    placeholder="品牌名称"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="product-sku" className="text-xs text-gray-500">
                    SKU
                  </Label>
                  <Input
                    id="product-sku"
                    value={productSku}
                    onChange={(e) => setProductSku(e.target.value)}
                    placeholder="SKU"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Amazon-specific fields */}
              {(selectedPlatforms.includes('amazon') || selectedPlatforms.length === 0) && (
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <Label htmlFor="product-upc" className="text-xs text-gray-500">
                      UPC/EAN (Amazon必需)
                    </Label>
                    <Input
                      id="product-upc"
                      value={productUpc}
                      onChange={(e) => setProductUpc(e.target.value)}
                      placeholder="UPC/EAN码"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="product-coo" className="text-xs text-gray-500">
                      原产国 (Amazon必需)
                    </Label>
                    <Input
                      id="product-coo"
                      value={productCountryOfOrigin}
                      onChange={(e) => setProductCountryOfOrigin(e.target.value)}
                      placeholder="例如: CN, US"
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Pricing Information */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium mb-3 block">价格信息</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="standard-price" className="text-xs text-gray-500">
                      标准售价 *
                    </Label>
                    <Input
                      id="standard-price"
                      type="number"
                      step="0.01"
                      value={standardPrice}
                      onChange={(e) => setStandardPrice(e.target.value)}
                      placeholder="0.00"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sale-price" className="text-xs text-gray-500">
                      促销价 (TikTok需要)
                    </Label>
                    <Input
                      id="sale-price"
                      type="number"
                      step="0.01"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Inventory Information */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium mb-3 block">库存信息</Label>
                <div>
                  <Label htmlFor="inventory-quantity" className="text-xs text-gray-500">
                    库存数量
                  </Label>
                  <Input
                    id="inventory-quantity"
                    type="number"
                    value={inventoryQuantity}
                    onChange={(e) => setInventoryQuantity(e.target.value)}
                    placeholder="库存数量"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="product-tags" className="text-xs text-gray-500">
                  标签（用逗号分隔）
                </Label>
                <Input
                  id="product-tags"
                  value={productTags}
                  onChange={(e) => setProductTags(e.target.value)}
                  placeholder="标签1, 标签2, 标签3"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Publish Results */}
          {publishResults.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">发布结果</Label>
              <div className="space-y-2">
                {publishResults.map((result) => (
                  <div
                    key={result.platform}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="font-medium">{PLATFORM_CONFIGS[result.platform].name}</span>
                    </div>
                    {result.success && result.publishUrl && (
                      <a
                        href={result.publishUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        查看
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {result.error && <span className="text-sm text-red-500">{result.error}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPublishing}>
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={
              isPublishing ||
              selectedPlatforms.length === 0 ||
              (publishMode === 'product' && (!productTitle || !standardPrice))
            }
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('publishing')}
              </>
            ) : (
              t('publishToPlatforms', { count: selectedPlatforms.length })
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
