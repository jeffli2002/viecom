'use client';

import UpgradePrompt from '@/components/auth/UpgradePrompt';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GenerationProgressBar } from '@/components/ui/generation-progress';
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
import { IMAGE_STYLES, getImageStyle } from '@/config/styles.config';
import { useGenerationProgress } from '@/hooks/use-generation-progress';
import { useUpgradePrompt } from '@/hooks/use-upgrade-prompt';
import type { BrandToneAnalysis } from '@/lib/brand/brand-tone-analyzer';
import { useAuthStore } from '@/store/auth-store';
import {
  AlertCircle,
  Copy,
  Download,
  Eraser,
  Image as ImageIcon,
  Loader2,
  Share2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface GenerationResult {
  imageUrl: string;
  previewUrl?: string;
  prompt: string;
  model: string;
  taskId?: string | null;
  requestId?: string | null;
  assetId?: string | null;
  creditsUsed?: number;
  error?: string;
}

type GenerationMode = 'text-to-image' | 'image-to-image';
type SourceImage = { name: string; dataUrl: string };

const createClientRequestId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const MAX_SOURCE_IMAGES = 3;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024;

const isRecoverableNetworkError = (message: string | undefined) => {
  if (!message) {
    return false;
  }
  const normalized = message.toLowerCase();
  return normalized.includes('network error') || normalized.includes('failed to fetch');
};

export default function ImageGenerator() {
  const t = useTranslations('imageGeneration');
  const searchParams = useSearchParams();
  const initialMode = (searchParams?.get('mode') as GenerationMode) || 'image-to-image';

  const { isAuthenticated, user } = useAuthStore();
  const { showUpgradePrompt, openUpgradePrompt, closeUpgradePrompt } = useUpgradePrompt();
  const [mode, setMode] = useState<GenerationMode>(initialMode);
  const [prompt, setPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [sourceImages, setSourceImages] = useState<SourceImage[]>([]);
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
  const activeRequestIdRef = useRef<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);
  const promptTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const {
    progressValue,
    progressMessage,
    startProgress,
    advanceProgress,
    completeProgress,
    failProgress,
  } = useGenerationProgress();

  // Brand analysis data (loaded from sessionStorage, no UI)
  const [brandAnalysis, setBrandAnalysis] = useState<BrandToneAnalysis | null>(null);

  const maxPromptLength = 2000;
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

  const imageReference = result?.imageUrl ?? null;

  useEffect(() => {
    void imageReference;
    setShareStatus('idle');
    setShareMessage(null);
    shareReferenceRef.current = null;
  }, [imageReference]);

  useEffect(() => {
    if (!lightboxImage) {
      return;
    }
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLightboxImage(null);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [lightboxImage]);

  const tryRecoverResult = async (requestId: string): Promise<GenerationResult | null> => {
    try {
      const response = await fetch(
        `/api/v1/generate-image/result?requestId=${encodeURIComponent(requestId)}`
      );
      if (!response.ok) {
        return null;
      }
      const data: {
        imageUrl?: string;
        previewUrl?: string;
        model?: string;
        prompt?: string;
        taskId?: string;
        assetId?: string;
        clientRequestId?: string;
        creditsUsed?: number;
      } = await response.json();

      if (!data.imageUrl) {
        return null;
      }

      return {
        imageUrl: data.imageUrl,
        previewUrl: data.previewUrl ?? data.imageUrl,
        model: data.model ?? model,
        prompt: data.prompt ?? prompt,
        taskId: data.taskId,
        requestId: data.clientRequestId ?? requestId,
        assetId: data.assetId ?? null,
        creditsUsed: data.creditsUsed,
      };
    } catch (recoveryError) {
      console.error('Recovery request failed:', recoveryError);
      return null;
    }
  };

  const handleClearPrompt = () => {
    setPrompt('');
    setEnhancedPrompt('');
    promptTextareaRef.current?.focus();
  };

  const handleCopyEnhancedPrompt = async () => {
    if (!enhancedPrompt) return;
    try {
      await navigator.clipboard.writeText(enhancedPrompt);
      toast.success(t('copiedToClipboard') || 'Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error(t('copyFailed') || 'Failed to copy');
    }
  };

  const addSourceImages = (files: File[]) => {
    if (files.length === 0) return;

    const remainingSlots = MAX_SOURCE_IMAGES - sourceImages.length;
    if (remainingSlots <= 0) {
      alert(`You can upload up to ${MAX_SOURCE_IMAGES} images for image-to-image mode.`);
      return;
    }

    const validFiles: File[] = [];
    let rejectedType = false;
    let rejectedSize = false;

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        rejectedType = true;
        continue;
      }
      if (file.size > MAX_IMAGE_FILE_SIZE) {
        rejectedSize = true;
        continue;
      }
      validFiles.push(file);
      if (validFiles.length >= remainingSlots) {
        break;
      }
    }

    if (rejectedType) {
      alert('Some files were skipped because only JPEG, PNG, or WebP formats are supported.');
    }
    if (rejectedSize) {
      alert('Some files were skipped because they exceed the 10MB size limit.');
    }

    if (validFiles.length === 0) {
      return;
    }

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSourceImages((prev) => {
            if (prev.length >= MAX_SOURCE_IMAGES) {
              return prev;
            }
            return [
              ...prev,
              { name: file.name || `image-${prev.length + 1}`, dataUrl: reader.result as string },
            ];
          });
        }
      };
      reader.onerror = () => {
        console.error('Failed to read source image:', reader.error);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      addSourceImages(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setSourceImages((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length === 0) return;

    addSourceImages(files);
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt first');
      return;
    }

    setIsEnhancing(true);
    try {
      const requestBody: Record<string, unknown> = {
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
    if (!isAuthenticated) {
      openUpgradePrompt();
      return;
    }

    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    if (mode === 'image-to-image' && sourceImages.length === 0) {
      alert('Please upload an image for image-to-image generation');
      return;
    }

    const requestId = createClientRequestId();
    activeRequestIdRef.current = requestId;
    setIsGenerating(true);
    setResult(null);
    startProgress(
      mode === 'image-to-image' ? t('progressUploadingImages') : t('progressPreparingRequest')
    );

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

      if (mode === 'image-to-image' && sourceImages.length > 0) {
        const attachedNames = sourceImages.map((image) => image.name).filter(Boolean);
        const attachmentLabel =
          attachedNames.length > 0
            ? attachedNames.join(', ')
            : `${sourceImages.length} uploaded image${sourceImages.length > 1 ? 's' : ''}`;
        finalPrompt = `${finalPrompt}\n\n[Source images: ${attachmentLabel}]`;
      }

      const requestBody: Record<string, unknown> = {
        prompt: finalPrompt,
        model: model,
        aspect_ratio: aspectRatio,
        style: imageStyle, // Pass style to API
        output_format: outputFormat.toLowerCase(), // Pass output format (png or jpeg)
        clientRequestId: requestId,
      };

      if (mode === 'image-to-image' && sourceImages.length > 0) {
        requestBody.images = sourceImages.slice(0, MAX_SOURCE_IMAGES).map((image) => image.dataUrl);
      }

      let response: Response;
      let data: {
        imageUrl?: string;
        previewUrl?: string;
        model?: string;
        error?: string;
        details?: string;
        taskId?: string;
        status?: string;
        clientRequestId?: string;
        assetId?: string | null;
        creditsUsed?: number;
      };

      // Create AbortController with 6 minute timeout (5 min generation + 1 min buffer)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6 * 60 * 1000);

      advanceProgress(15, t('progressSubmitting'));
      try {
        response = await fetch('/api/v1/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        advanceProgress(55, t('progressWaiting'));
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error('Fetch error:', fetchError);

        // Check if it's an abort error (timeout)
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error(
            'Request timeout. Image generation is taking longer than expected. Please try again or check the task status.'
          );
        }

        throw new Error(
          fetchError instanceof Error
            ? `Network error: ${fetchError.message}`
            : 'Failed to connect to server. Please check your internet connection and try again.'
        );
      }

      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Response parse error:', parseError);
        throw new Error(`Server returned invalid response (${response.status}). Please try again.`);
      }

      advanceProgress(75, t('progressFinalizing'));

      if (!response.ok) {
        if (response.status === 429 || response.status === 402) {
          openUpgradePrompt();
          throw new Error(data.error || 'Image generation limit reached');
        }

        const errorMessage = data.error || data.details || 'Failed to generate image';
        console.error('Image generation API error:', {
          status: response.status,
          error: data.error,
          details: data.details,
        });
        throw new Error(errorMessage);
      }

      if (!data.imageUrl) {
        throw new Error('No image URL in response');
      }

      const resolvedRequestId = data.clientRequestId ?? requestId;
      activeRequestIdRef.current = resolvedRequestId;
      completeProgress(t('progressReady'));

      setResult({
        imageUrl: data.imageUrl,
        previewUrl: data.previewUrl ?? data.imageUrl,
        prompt: prompt,
        model: data.model ?? model,
        taskId: data.taskId ?? null,
        requestId: resolvedRequestId,
        assetId: data.assetId ?? null,
        creditsUsed: data.creditsUsed,
      });
    } catch (error) {
      const currentRequestId = activeRequestIdRef.current;
      if (error instanceof Error && isRecoverableNetworkError(error.message) && currentRequestId) {
        const recovered = await tryRecoverResult(currentRequestId);
        if (recovered) {
          completeProgress(t('progressRecovered'));
          setResult(recovered);
          return;
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      failProgress(errorMessage);
      setResult({
        imageUrl: '',
        previewUrl: undefined,
        prompt: prompt,
        model: model,
        error: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getDownloadUrl = (imageUrl: string, previewUrl?: string) => {
    if (imageUrl.startsWith('/api/v1/media')) {
      return `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}download=1`;
    }
    if (previewUrl?.startsWith('/api/v1/media')) {
      return `${previewUrl}${previewUrl.includes('?') ? '&' : '?'}download=1`;
    }
    return imageUrl;
  };

  const handleDownload = async (imageUrl: string, fallbackUrl?: string) => {
    try {
      const downloadUrl = getDownloadUrl(imageUrl, fallbackUrl);
      const response = await fetch(downloadUrl);
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
      const targetUrl = getDownloadUrl(fallbackUrl ?? imageUrl);
      window.open(targetUrl, '_blank');
    }
  };

  const awardShareReward = async () => {
    if (!result?.imageUrl) return;
    if (!isAuthenticated) {
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
      setShareMessage(error instanceof Error ? error.message : t('shareRewardFailed'));
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

  const canGenerate =
    prompt.trim().length > 0 && (mode === 'text-to-image' || sourceImages.length > 0);

  return (
    <div className="mx-auto max-w-7xl">
      <Tabs value={mode} onValueChange={(v) => setMode(v as GenerationMode)} className="w-full">
        <TabsList className="mx-auto mb-8 grid w-full max-w-md grid-cols-2 bg-transparent gap-3 p-0">
          <TabsTrigger
            value="text-to-image"
            className="font-medium data-[state=active]:bg-teal-500 data-[state=active]:text-white data-[state=inactive]:border-2 data-[state=inactive]:border-slate-300 dark:data-[state=inactive]:border-slate-700 data-[state=inactive]:rounded-full data-[state=inactive]:bg-white dark:data-[state=inactive]:bg-slate-900 data-[state=inactive]:text-slate-700 dark:data-[state=inactive]:text-slate-300 rounded-full py-3 transition-all"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {t('modeTextToImage')}
          </TabsTrigger>
          <TabsTrigger
            value="image-to-image"
            className="font-medium data-[state=active]:bg-teal-500 data-[state=active]:text-white data-[state=inactive]:border-2 data-[state=inactive]:border-slate-300 dark:data-[state=inactive]:border-slate-700 data-[state=inactive]:rounded-full data-[state=inactive]:bg-white dark:data-[state=inactive]:bg-slate-900 data-[state=inactive]:text-slate-700 dark:data-[state=inactive]:text-slate-300 rounded-full py-3 transition-all"
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            {t('modeImageToImage')}
          </TabsTrigger>
        </TabsList>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <TabsContent value="text-to-image" className="mt-0 space-y-6">
              {brandAnalysis && (
                <div className="rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-teal-500" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      Brand context will be automatically applied to your generation
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                    Style: {brandAnalysis.styleKeywords.slice(0, 3).join(', ')}
                    {brandAnalysis.styleKeywords.length > 3 && '...'}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-light text-gray-700 text-sm">
                    {t('imageDescription')}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-teal-500 hover:text-slate-700 dark:text-slate-300"
                    onClick={handleClearPrompt}
                  >
                    <Eraser className="mr-1 h-3.5 w-3.5" />
                    {t('clearPrompt')}
                  </Button>
                </div>
                <div className="relative">
                  <Textarea
                    placeholder={textDefaultPrompt}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value.slice(0, maxPromptLength))}
                    rows={8}
                    ref={promptTextareaRef}
                    className="resize-none border-gray-200 pr-24 pb-12 font-light focus:border-teal-500 focus:ring-teal-500/20"
                  />
                  <Button
                    onClick={handleEnhancePrompt}
                    disabled={isEnhancing || !prompt.trim()}
                    size="sm"
                    variant="outline"
                    className="absolute right-2 bottom-2 inline-flex items-center gap-2 rounded-lg border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/20 px-3 py-1.5 font-medium text-slate-700 dark:text-slate-300 text-sm shadow-sm transition-all duration-300 hover:bg-teal-100 dark:bg-teal-900/30"
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
                  <div className="mt-4 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        <Sparkles className="h-4 w-4" />
                        {t('enhancedPrompt')}
                      </h4>
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={handleCopyEnhancedPrompt}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-gray-600 hover:text-slate-700 dark:text-slate-300"
                          title={t('copyAll') || 'Copy all'}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => setEnhancedPrompt('')}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={enhancedPrompt}
                      onChange={(e) => setEnhancedPrompt(e.target.value.slice(0, maxPromptLength))}
                      className="resize-none border border-teal-200 dark:border-teal-800 bg-white text-sm"
                      rows={5}
                    />
                    <p className="mt-1 text-right text-teal-500 text-xs">
                      {enhancedPrompt.length} / {maxPromptLength}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="image-to-image" className="mt-0 space-y-6">
              <div className="space-y-2">
                <Label className="font-light text-gray-700 text-sm">
                  {t('sourceImage')}{' '}
                  <span className="text-gray-400">(up to {MAX_SOURCE_IMAGES})</span>
                </Label>

                <div
                  className="rounded-xl border border-dashed border-gray-300 p-4 transition-colors hover:border-teal-500"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {sourceImages.length === 0 ? (
                    <button
                      type="button"
                      className="hover-card cursor-pointer rounded-xl border border-dashed border-gray-300 p-8 text-center transition-colors hover:border-teal-500 w-full"
                      onClick={triggerFileInput}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          triggerFileInput();
                        }
                      }}
                    >
                      <Upload className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                      <p className="mb-1 font-light text-gray-600 text-sm">{t('clickToUpload')}</p>
                      <p className="font-light text-gray-400 text-xs">{t('imageFormatDesc')}</p>
                      <p className="mt-2 text-xs text-gray-400">{t('dragDropUpload')}</p>
                    </button>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {sourceImages.map((image, idx) => (
                        <div
                          key={image.dataUrl || image.name || `source-image-${idx}`}
                          className="relative w-full"
                        >
                          <button
                            type="button"
                            className="w-full overflow-hidden rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            onClick={() =>
                              setLightboxImage({
                                url: image.dataUrl,
                                alt: image.name || `Source image ${idx + 1}`,
                              })
                            }
                          >
                            <img
                              src={image.dataUrl}
                              alt={`Source ${idx + 1}`}
                              className="w-full max-h-96 object-contain"
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-2 right-2 rounded-full bg-red-500 p-2 text-white transition-colors hover:bg-red-600"
                            aria-label={t('removeSourceImage')}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      {sourceImages.length < MAX_SOURCE_IMAGES && (
                        <button
                          type="button"
                          onClick={triggerFileInput}
                          className="flex min-h-48 w-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-500 transition-colors hover:border-teal-500 hover:text-teal-500"
                        >
                          <Upload className="mb-2 h-8 w-8" />
                          <span className="text-sm font-medium">{t('addAnotherImage')}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {t('imagesSelected', { count: sourceImages.length, max: MAX_SOURCE_IMAGES })}
                  </span>
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="text-teal-500 font-medium hover:underline"
                  >
                    {t('uploadImages')}
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-light text-gray-700 text-sm">
                    {t('transformationPrompt')} <span className="text-red-500">*</span>
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-teal-500 hover:text-slate-700 dark:text-slate-300"
                    onClick={handleClearPrompt}
                  >
                    <Eraser className="mr-1 h-3.5 w-3.5" />
                    {t('clearPrompt')}
                  </Button>
                </div>
                <div className="relative">
                  <Textarea
                    placeholder={imageDefaultPrompt}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value.slice(0, maxPromptLength))}
                    rows={4}
                    className="resize-none border-gray-200 pr-24 pb-12 font-light focus:border-teal-500 focus:ring-teal-500/20"
                    ref={promptTextareaRef}
                  />
                  <Button
                    onClick={handleEnhancePrompt}
                    disabled={isEnhancing || !prompt.trim()}
                    size="sm"
                    variant="outline"
                    className="absolute right-2 bottom-2 inline-flex items-center gap-2 rounded-lg border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/20 px-3 py-1.5 font-medium text-slate-700 dark:text-slate-300 text-sm shadow-sm transition-all duration-300 hover:bg-teal-100 dark:bg-teal-900/30"
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
                  <div className="mt-4 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        <Sparkles className="h-4 w-4" />
                        {t('enhancedPrompt')}
                      </h4>
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={handleCopyEnhancedPrompt}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-gray-600 hover:text-slate-700 dark:text-slate-300"
                          title={t('copyAll') || 'Copy all'}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => setEnhancedPrompt('')}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={enhancedPrompt}
                      onChange={(e) => setEnhancedPrompt(e.target.value.slice(0, maxPromptLength))}
                      className="resize-none border border-teal-200 dark:border-teal-800 bg-white text-sm"
                      rows={5}
                    />
                    <p className="mt-1 text-right text-teal-500 text-xs">
                      {enhancedPrompt.length} / {maxPromptLength}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <div className="space-y-2">
              <Label className="font-light text-gray-700 text-sm">{t('imageStyle')}</Label>
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
                      Nano Banana - {creditsConfig.consumption.imageGeneration['nano-banana']}{' '}
                      credits
                    </SelectItem>
                    <SelectItem value="nano-banana-pro">
                      Nano Banana Pro - {creditsConfig.consumption.imageGeneration['nano-banana-pro']}{' '}
                      credits
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
                    <SelectItem value="1:1">{t('aspectRatioSquare')}</SelectItem>
                    <SelectItem value="16:9">{t('aspectRatioLandscape')}</SelectItem>
                    <SelectItem value="9:16">{t('aspectRatioPortrait')}</SelectItem>
                    <SelectItem value="4:3">{t('aspectRatioStandard')}</SelectItem>
                    <SelectItem value="3:2">{t('aspectRatioPhoto')}</SelectItem>
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
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-slate-700 dark:text-slate-300'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 hover:border-teal-500'
                  }`}
                >
                  <span>PNG</span>
                  {outputFormat === 'PNG' && (
                    <svg
                      className="ml-2 h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      role="img"
                      aria-label="Selected format"
                    >
                      <title>Selected format</title>
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setOutputFormat('JPEG')}
                  className={`flex items-center justify-center rounded-lg border-2 py-3 px-4 text-sm font-medium transition-all ${
                    outputFormat === 'JPEG'
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-slate-700 dark:text-slate-300'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 hover:border-teal-500'
                  }`}
                >
                  <span>JPEG</span>
                  {outputFormat === 'JPEG' && (
                    <svg
                      className="ml-2 h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      role="img"
                      aria-label="Selected format"
                    >
                      <title>Selected format</title>
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !canGenerate}
              className="w-full btn-primary"
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
                <div className="flex aspect-square items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                  <div className="space-y-3 text-center">
                    <ImageIcon className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500" />
                    <p className="font-light text-slate-500 dark:text-slate-400 text-sm">{t('imageWillAppearHere')}</p>
                  </div>
                </div>
              )}

              {isGenerating && (
                <div className="flex aspect-square flex-col items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 p-6 text-center">
                  <Loader2 className="mb-4 h-12 w-12 animate-spin text-teal-500" />
                  <p className="font-medium text-slate-700 dark:text-slate-300">
                    {progressMessage || t('generatingImage')}
                  </p>
                  <div className="mt-4 w-full max-w-xs space-y-2">
                    <GenerationProgressBar value={progressValue} />
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {Math.round(progressValue)}%
                    </p>
                  </div>
                  <p className="mt-3 font-light text-slate-500 dark:text-slate-400 text-xs">
                    {t('generatingTakeMoments')}
                  </p>
                </div>
              )}

              {result && !result.error && (result.previewUrl || result.imageUrl) && (
                <div className="space-y-4">
                  <button
                    type="button"
                    className="w-full overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    onClick={() =>
                      setLightboxImage({
                        url: result.previewUrl ?? result.imageUrl,
                        alt: 'Generated image preview',
                      })
                    }
                  >
                    <img
                      src={result.previewUrl ?? result.imageUrl}
                      alt="Generated"
                      className="w-full rounded-xl"
                    />
                  </button>
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

      {lightboxImage && (
        <dialog
          open
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setLightboxImage(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setLightboxImage(null);
            }
          }}
        >
          <div
            className="relative max-h-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
              }
            }}
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full bg-black/70 p-2 text-white hover:bg-black"
              aria-label="Close preview"
              onClick={() => setLightboxImage(null)}
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.alt}
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          </div>
        </dialog>
      )}
    </div>
  );
}
