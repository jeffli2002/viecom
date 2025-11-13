'use client';

import UpgradePrompt from '@/components/auth/UpgradePrompt';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { creditsConfig } from '@/config/credits.config';
import { useUpgradePrompt } from '@/hooks/use-upgrade-prompt';
import type { BrandToneAnalysis } from '@/lib/brand/brand-tone-analyzer';
import { useAuthStore } from '@/store/auth-store';
import { IMAGE_STYLES, getImageStyle } from '@/config/styles.config';
import {
  AlertCircle,
  Download,
  Image as ImageIcon,
  Loader2,
  Share2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

interface GenerationResult {
  imageUrl: string;
  previewUrl?: string;
  prompt: string;
  model: string;
  error?: string;
}

type GenerationMode = 'text-to-image' | 'image-to-image';

export default function ImageGenerator() {
  const t = useTranslations('imageGeneration');
  const searchParams = useSearchParams();
  const initialMode = (searchParams?.get('mode') as GenerationMode) || 'image-to-image';

  const { user, isAuthenticated } = useAuthStore();
  const { showUpgradePrompt, openUpgradePrompt, closeUpgradePrompt } = useUpgradePrompt();
  const [mode, setMode] = useState<GenerationMode>(initialMode);
  const [prompt, setPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [model, setModel] = useState<string>('nano-banana');
  const [imageStyle, setImageStyle] = useState<string>('studio-shot'); // Image style selection
  const [outputFormat, setOutputFormat] = useState<'PNG' | 'JPEG'>('PNG'); // Output format selection
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'pending' | 'awarded' | 'error'>('idle');
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shareReferenceRef = useRef<string | null>(null);

  // Brand analysis data (loaded from sessionStorage, no UI)
  const [brandAnalysis, setBrandAnalysis] = useState<BrandToneAnalysis | null>(null);

  const maxPromptLength = 2000;
  const imageCreditCost = creditsConfig.consumption.imageGeneration['nano-banana'];
  const textDefaultPrompt =
    'A serene Japanese garden with cherry blossoms in full bloom, koi fish swimming in a crystal-clear pond, traditional wooden bridge, soft morning light filtering through maple trees, ultra-realistic, high detail';
  const imageDefaultPrompt =
    'Transform this image into a watercolor painting style, soft pastel colors, artistic brush strokes';

  // User is already available from useAuthStore, no need to fetch separately

  useEffect(() => {
    if (searchParams?.get('mode')) {
      setMode(searchParams.get('mode') as GenerationMode);
    }

    // Load brand analysis from sessionStorage if coming from brand analysis page
    if (searchParams?.get('fromBrandAnalysis') === 'true') {
      try {
        const storedData = sessionStorage.getItem('brandAnalysis');
        if (storedData) {
          const brandData = JSON.parse(storedData);
          // Convert BrandAnalysisResult to BrandToneAnalysis format
          const brandToneAnalysis: BrandToneAnalysis = {
            brandName: brandData.brandName,
            brandTone: Array.isArray(brandData.brandTone)
              ? brandData.brandTone
              : brandData.brandTone?.split(/[、,]/).map((s: string) => s.trim()) || [],
            productFeatures: brandData.productCategory || [],
            targetAudience: Array.isArray(brandData.targetAudience)
              ? brandData.targetAudience
              : brandData.targetAudience?.split(/[、,]/).map((s: string) => s.trim()) || [],
            colorPalette: [
              brandData.colors?.primary,
              ...(brandData.colors?.secondary || []),
              brandData.colors?.accent,
            ].filter(Boolean),
            styleKeywords: brandData.styleKeywords || [],
            summary: brandData.metadata?.description || brandData.summary || '',
          };
          setBrandAnalysis(brandToneAnalysis);
          // Clear sessionStorage after loading
          sessionStorage.removeItem('brandAnalysis');
        }
      } catch (error) {
        console.error('Failed to load brand analysis from sessionStorage:', error);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    setShareStatus('idle');
    setShareMessage(null);
    shareReferenceRef.current = null;
  }, [result?.imageUrl]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image file must be less than 10MB');
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image file must be less than 10MB');
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt first');
      return;
    }

    setIsEnhancing(true);
    try {
      const requestBody: any = {
        prompt: prompt.trim(),
        context: 'image',
        aspectRatio: aspectRatio, // Pass user-selected aspect ratio
        style: imageStyle, // Pass user-selected image style
      };

      // Include brand context if available (from brand analysis page)
      if (brandAnalysis) {
        requestBody.brandTone = brandAnalysis.brandTone;
        requestBody.styleKeywords = brandAnalysis.styleKeywords;
        requestBody.colorPalette = brandAnalysis.colorPalette;
        requestBody.productFeatures = brandAnalysis.productFeatures;
      }

      const response = await fetch('/api/v1/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to enhance prompt');
      }

      const data = await response.json();
      setEnhancedPrompt(data.enhancedPrompt || '');
    } catch (error) {
      console.error('Enhancement error:', error);
      alert(error instanceof Error ? error.message : 'Failed to enhance prompt');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      openUpgradePrompt();
      return;
    }

    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    if (mode === 'image-to-image' && !imageFile && !imagePreview) {
      alert('Please upload an image for image-to-image generation');
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      let finalPrompt = enhancedPrompt || prompt.trim();

      // Add brand context if available (from brand analysis page)
      if (brandAnalysis) {
        const contextParts: string[] = [];
        if (brandAnalysis.styleKeywords.length > 0) {
          contextParts.push(`Style: ${brandAnalysis.styleKeywords.join(', ')}`);
        }
        if (brandAnalysis.colorPalette.length > 0) {
          contextParts.push(`Colors: ${brandAnalysis.colorPalette.join(', ')}`);
        }
        if (brandAnalysis.brandTone.length > 0) {
          contextParts.push(`Brand tone: ${brandAnalysis.brandTone.join(', ')}`);
        }
        if (contextParts.length > 0) {
          finalPrompt = `${finalPrompt}\n\n${contextParts.join('\n')}`;
        }
      }

      // Add image style enhancement to prompt
      const selectedStyle = getImageStyle(imageStyle);
      if (selectedStyle?.promptEnhancement) {
        finalPrompt = `${finalPrompt}, ${selectedStyle.promptEnhancement}`;
      }

      if (mode === 'image-to-image' && imagePreview) {
        finalPrompt = `${finalPrompt}\n\n[Image attached: ${imageFile?.name || 'uploaded image'}]`;
      }

      const requestBody: any = {
        prompt: finalPrompt,
        model: model,
        aspect_ratio: aspectRatio,
        style: imageStyle, // Pass style to API
        output_format: outputFormat.toLowerCase(), // Pass output format (png or jpeg)
      };

      if (mode === 'image-to-image' && imagePreview) {
        requestBody.image = imagePreview;
      }

      const response = await fetch('/api/v1/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429 || response.status === 402) {
          openUpgradePrompt();
          throw new Error(data.error || 'Image generation limit reached');
        }

        throw new Error(data.error || 'Failed to generate image');
      }

      if (!data.imageUrl) {
        throw new Error('No image URL in response');
      }

      setResult({
        imageUrl: data.imageUrl,
        previewUrl: data.previewUrl ?? data.imageUrl,
        prompt: prompt,
        model: data.model,
      });

      setIsGenerating(false);
    } catch (error) {
      setResult({
        imageUrl: '',
        previewUrl: undefined,
        prompt: prompt,
        model: 'nano-banana',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      setIsGenerating(false);
    }
  };

  const handleDownload = async (imageUrl: string, fallbackUrl?: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      const targetUrl = fallbackUrl ?? imageUrl;
      window.open(targetUrl, '_blank');
    }
  };

  const awardShareReward = async () => {
    if (!result?.imageUrl) return;
    if (!user) {
      setShareStatus('error');
      setShareMessage(t('shareLoginRequired'));
      return;
    }
    if (shareStatus === 'pending') return;
    if (shareStatus === 'awarded') {
      setShareMessage(t('shareAlreadyRewarded'));
      return;
    }

    setShareStatus('pending');

    try {
      const referenceId =
        shareReferenceRef.current ||
        `image_share_${
          typeof globalThis.crypto?.randomUUID === 'function'
            ? globalThis.crypto.randomUUID()
            : Date.now()
        }`;
      shareReferenceRef.current = referenceId;

      const response = await fetch('/api/rewards/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'other',
          shareUrl: result.imageUrl,
          assetId: null,
          referenceId,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        setShareStatus('error');
        setShareMessage(t('shareLoginRequired'));
        return;
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || t('shareRewardFailed'));
      }

      setShareStatus('awarded');
      setShareMessage(t('shareRewarded'));
    } catch (error) {
      console.error('Share reward error:', error);
      setShareStatus('error');
      setShareMessage(
        error instanceof Error ? error.message : t('shareRewardFailed')
      );
    }
  };

  const handleShare = async () => {
    if (!result?.imageUrl) return;

    const sharePayload = {
      title: 'AI Generated Image',
      text: 'Check out this AI-generated image!',
      url: result.imageUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(sharePayload);
        await awardShareReward();
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        console.error('Share failed:', error);
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(result.imageUrl);
        alert(t('shareCopied'));
        await awardShareReward();
      } catch (error) {
        console.error('Clipboard copy failed:', error);
      }
    } else {
      window.prompt(t('shareCopyFallback'), result.imageUrl);
      await awardShareReward();
    }
  };

  const canGenerate = prompt.trim().length > 0;

  return (
    <div className="mx-auto max-w-7xl">
      <Tabs value={mode} onValueChange={(v) => setMode(v as GenerationMode)} className="w-full">
        <TabsList className="mx-auto mb-8 grid w-full max-w-md grid-cols-2 bg-transparent gap-3 p-0">
          <TabsTrigger 
            value="text-to-image" 
            className="font-medium data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=inactive]:border-2 data-[state=inactive]:border-gray-300 data-[state=inactive]:rounded-full data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 rounded-full py-3 transition-all"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {t('modeTextToImage')}
          </TabsTrigger>
          <TabsTrigger 
            value="image-to-image" 
            className="font-medium data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=inactive]:border-2 data-[state=inactive]:border-gray-300 data-[state=inactive]:rounded-full data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 rounded-full py-3 transition-all"
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            {t('modeImageToImage')}
          </TabsTrigger>
        </TabsList>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <TabsContent value="text-to-image" className="mt-0 space-y-6">
              {brandAnalysis && (
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">
                      Brand context will be automatically applied to your generation
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-purple-700">
                    Style: {brandAnalysis.styleKeywords.slice(0, 3).join(', ')}
                    {brandAnalysis.styleKeywords.length > 3 && '...'}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label className="font-light text-gray-700 text-sm">{t('imageDescription')}</Label>
                <div className="relative">
                  <Textarea
                    placeholder={textDefaultPrompt}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value.slice(0, maxPromptLength))}
                    rows={8}
                    className="resize-none border-gray-200 pr-24 pb-12 font-light focus:border-purple-400 focus:ring-purple-400/20"
                  />
                  <Button
                    onClick={handleEnhancePrompt}
                    disabled={isEnhancing || !prompt.trim()}
                    size="sm"
                    variant="outline"
                    className="absolute right-2 bottom-2 inline-flex items-center gap-2 rounded-lg border-2 border-purple-500 bg-purple-50 px-3 py-1.5 font-medium text-purple-700 text-sm shadow-sm transition-all duration-300 hover:bg-purple-100"
                  >
                    {isEnhancing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {isEnhancing ? t('enhancing') : t('enhance')}
                  </Button>
                </div>
                <div className="text-right font-light text-gray-400 text-xs">
                  {prompt.length} / {maxPromptLength}
                </div>
                {enhancedPrompt && (
                  <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="flex items-center gap-2 font-semibold text-purple-700 text-sm">
                        <Sparkles className="h-4 w-4" />
                        {t('enhancedPrompt')}
                      </h4>
                      <Button
                        onClick={() => setEnhancedPrompt('')}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={enhancedPrompt}
                      onChange={(e) => setEnhancedPrompt(e.target.value.slice(0, maxPromptLength))}
                      className="resize-none border border-purple-200 bg-white text-sm"
                      rows={5}
                    />
                    <p className="mt-1 text-right text-purple-600 text-xs">
                      {enhancedPrompt.length} / {maxPromptLength}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="image-to-image" className="mt-0 space-y-6">
              <div className="space-y-2">
                <Label className="font-light text-gray-700 text-sm">{t('sourceImage')}</Label>

                {!imagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="hover-card cursor-pointer rounded-xl border border-dashed border-gray-300 p-8 text-center transition-colors hover:border-purple-400"
                  >
                    <Upload className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                    <p className="mb-1 font-light text-gray-600 text-sm">
                      {t('clickToUpload')}
                    </p>
                    <p className="font-light text-gray-400 text-xs">
                      {t('imageFormatDesc')}
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full rounded-xl border border-gray-200"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 rounded-full bg-red-500 p-2 text-white transition-colors hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-light text-gray-700 text-sm">
                  {t('transformationPrompt')} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Textarea
                    placeholder={imageDefaultPrompt}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value.slice(0, maxPromptLength))}
                    rows={4}
                    className="resize-none border-gray-200 pr-24 pb-12 font-light focus:border-purple-400 focus:ring-purple-400/20"
                  />
                  <Button
                    onClick={handleEnhancePrompt}
                    disabled={isEnhancing || !prompt.trim()}
                    size="sm"
                    variant="outline"
                    className="absolute right-2 bottom-2 inline-flex items-center gap-2 rounded-lg border-2 border-purple-500 bg-purple-50 px-3 py-1.5 font-medium text-purple-700 text-sm shadow-sm transition-all duration-300 hover:bg-purple-100"
                  >
                    {isEnhancing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {isEnhancing ? t('enhancing') : t('enhance')}
                  </Button>
                </div>
                <div className="text-right font-light text-gray-400 text-xs">
                  {prompt.length} / {maxPromptLength}
                </div>
                {enhancedPrompt && (
                  <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="flex items-center gap-2 font-semibold text-purple-700 text-sm">
                        <Sparkles className="h-4 w-4" />
                        {t('enhancedPrompt')}
                      </h4>
                      <Button
                        onClick={() => setEnhancedPrompt('')}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={enhancedPrompt}
                      onChange={(e) => setEnhancedPrompt(e.target.value.slice(0, maxPromptLength))}
                      className="resize-none border border-purple-200 bg-white text-sm"
                      rows={5}
                    />
                    <p className="mt-1 text-right text-purple-600 text-xs">
                      {enhancedPrompt.length} / {maxPromptLength}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <div className="space-y-2">
              <Label className="font-light text-gray-700 text-sm">图片风格</Label>
              <Select value={imageStyle} onValueChange={setImageStyle}>
                <SelectTrigger className="border-gray-200 font-light">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_STYLES.map((style) => (
                    <SelectItem key={style.id} value={style.id} title={style.description}>
                      {t(`imageStyles.${style.id}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-light text-gray-700 text-sm">{t('model')}</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="border-gray-200 font-light">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nano-banana">
                      Nano Banana - {creditsConfig.consumption.imageGeneration['nano-banana']} credits
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-light text-gray-700 text-sm">{t('aspectRatio')}</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger className="border-gray-200 font-light">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1">Square (1:1)</SelectItem>
                    <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                    <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                    <SelectItem value="4:3">Standard (4:3)</SelectItem>
                    <SelectItem value="3:2">Photo (3:2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-light text-gray-700 text-sm">{t('outputFormat')}</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOutputFormat('PNG')}
                  className={`flex items-center justify-center rounded-lg border-2 py-3 px-4 text-sm font-medium transition-all ${
                    outputFormat === 'PNG'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'
                  }`}
                >
                  <span>PNG</span>
                  {outputFormat === 'PNG' && (
                    <svg className="ml-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setOutputFormat('JPEG')}
                  className={`flex items-center justify-center rounded-lg border-2 py-3 px-4 text-sm font-medium transition-all ${
                    outputFormat === 'JPEG'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'
                  }`}
                >
                  <span>JPEG</span>
                  {outputFormat === 'JPEG' && (
                    <svg className="ml-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !canGenerate}
              className="w-full transform border-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 font-bold text-lg text-white shadow-2xl shadow-purple-500/50 transition-all duration-300 hover:scale-105 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('generating')}
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-5 w-5" />
                  {t('generateImage')}
                </>
              )}
            </Button>
          </div>

          <div className="lg:sticky lg:top-24 lg:h-fit">
            <Card className="p-6">
              {!result && !isGenerating && (
                <div className="flex aspect-square items-center justify-center rounded-xl bg-gray-100">
                  <div className="space-y-3 text-center">
                    <ImageIcon className="mx-auto h-16 w-16 text-gray-400" />
                    <p className="font-light text-gray-500 text-sm">
                      {t('imageWillAppearHere')}
                    </p>
                  </div>
                </div>
              )}

              {isGenerating && (
                <div className="flex aspect-square items-center justify-center rounded-xl bg-gray-100">
                  <div className="space-y-4 text-center">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-purple-600" />
                    <p className="font-light text-base text-gray-700">{t('generatingImage')}</p>
                    <p className="font-light text-gray-500 text-xs">{t('generatingTakeMoments')}</p>
                  </div>
                </div>
              )}

              {result && !result.error && (result.previewUrl || result.imageUrl) && (
                <div className="space-y-4">
                  <img
                    src={result.previewUrl ?? result.imageUrl}
                    alt="Generated"
                    className="w-full rounded-xl"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => {
                        const primaryUrl = result.imageUrl || result.previewUrl;
                        if (!primaryUrl) return;
                        handleDownload(primaryUrl, result.previewUrl ?? result.imageUrl);
                      }}
                      variant="outline"
                      className="border-gray-200 font-light"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {t('download')}
                    </Button>
                    <Button
                      onClick={handleShare}
                      variant="outline"
                      className="border-gray-200 font-light"
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      {t('share')}
                    </Button>
                  </div>
                  {shareMessage && (
                    <p
                      className={`text-center text-xs ${
                        shareStatus === 'error' ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {shareMessage}
                    </p>
                  )}
                </div>
              )}

              {result?.error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
                  <div>
                    <p className="font-light text-red-700">Generation Failed</p>
                    <p className="font-light text-red-600 text-sm">{result.error}</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </Tabs>

      {showUpgradePrompt && (
        <UpgradePrompt
          onClose={closeUpgradePrompt}
          creditsUsed={0}
          creditsLimit={0}
          type="credits"
          isAuthenticated={!!user}
          limitType="daily"
        />
      )}
    </div>
  );
}
