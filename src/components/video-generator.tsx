'use client';

import UpgradePrompt from '@/components/auth/UpgradePrompt';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { SHARE_REWARD_CONFIG, type ShareRewardKey } from '@/config/share.config';
import { VIDEO_STYLES, getVideoStyle } from '@/config/styles.config';
import { useCreditBalance } from '@/hooks/use-credit-balance';
import { useGenerationProgress } from '@/hooks/use-generation-progress';
import { useUpgradePrompt } from '@/hooks/use-upgrade-prompt';
import type { BrandToneAnalysis } from '@/lib/brand/brand-tone-analyzer';
import { buildSharePlatforms } from '@/lib/share/share-platforms';
import type { SharePlatform, SharePlatformId } from '@/lib/share/share-platforms';
import { useAuthStore } from '@/store/auth-store';
import {
  AlertCircle,
  Download,
  Eraser,
  Globe,
  Link2,
  Loader2,
  Share2,
  Sparkles,
  Upload,
  Video as VideoIcon,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface GenerationResult {
  videoUrl: string;
  prompt: string;
  model: string;
  error?: string;
}

type GenerationMode = 'text-to-video' | 'image-to-video';
const GENERATION_REQUEST_COOLDOWN_MS = 4000;

export default function VideoGenerator() {
  const t = useTranslations('videoGeneration');
  const searchParams = useSearchParams();
  const initialMode = (searchParams?.get('mode') as GenerationMode) || 'image-to-video';

  const { isAuthenticated } = useAuthStore();
  const { showUpgradePrompt, openUpgradePrompt, closeUpgradePrompt } = useUpgradePrompt();
  const [mode, setMode] = useState<GenerationMode>(initialMode);
  const [prompt, setPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [model, setModel] = useState<'sora-2' | 'sora-2-pro'>('sora-2');
  const [quality, setQuality] = useState<'standard' | 'high'>('standard'); // Quality for Sora 2 Pro (720P/1080P)
  const [videoStyle, setVideoStyle] = useState<string>('spoken-script'); // Video style selection
  const [duration, setDuration] = useState<10 | 15>(10); // Video duration selection
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [pendingCreditCost, setPendingCreditCost] = useState(0);
  const { balance: creditBalance, refresh: refreshCreditBalance } = useCreditBalance();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generationLockRef = useRef(false);
  const lastGenerationTimestampRef = useRef(0);
  const promptTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const {
    progressValue,
    progressMessage,
    startProgress,
    advanceProgress,
    completeProgress,
    failProgress,
  } = useGenerationProgress();
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const defaultShareText = t('shareDefaultText');
  const sharePlatforms = buildSharePlatforms(
    {
      x: t('sharePlatformX'),
      facebook: t('sharePlatformFacebook'),
      youtube: t('sharePlatformYouTube'),
      instagram: t('sharePlatformInstagram'),
      tiktok: t('sharePlatformTikTok'),
    },
    defaultShareText
  );
  const socialShareReward = SHARE_REWARD_CONFIG.socialShare.credits;
  const publishShareReward = SHARE_REWARD_CONFIG.publishViecom.credits;

  // Brand analysis data (loaded from sessionStorage, no UI)
  const [brandAnalysis, setBrandAnalysis] = useState<BrandToneAnalysis | null>(null);

  const maxPromptLength = 2000;

  // Calculate video credit cost dynamically based on model, duration, and quality
  const getVideoCreditCost = () => {
    if (model === 'sora-2') {
      return creditsConfig.consumption.videoGeneration[`sora-2-720p-${duration}s`];
    }

    const resolution = quality === 'standard' ? '720p' : '1080p';
    return creditsConfig.consumption.videoGeneration[`sora-2-pro-${resolution}-${duration}s`];
  };

  const videoCreditCost = getVideoCreditCost();
  const textDefaultPrompt = t('textDefaultPrompt');
  const imageDefaultPrompt = t('imageDefaultPrompt');
  const effectiveCredits =
    creditBalance?.availableBalance !== undefined
      ? creditBalance.availableBalance - pendingCreditCost
      : null;
  const hasSufficientCredits = effectiveCredits === null || effectiveCredits >= videoCreditCost;

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

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
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

  const handleClearPrompt = () => {
    setPrompt('');
    setEnhancedPrompt('');
    promptTextareaRef.current?.focus();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
        context: 'video', // Specify video context for proper system prompt
        aspectRatio: aspectRatio, // Pass user-selected aspect ratio
        style: videoStyle, // Pass user-selected video style
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

    if (mode === 'image-to-video' && !imageFile && !imagePreview) {
      alert('Please upload an image for image-to-video generation');
      return;
    }

    if (generationLockRef.current) {
      toast.error(t('generationInFlight'));
      return;
    }
    const now = Date.now();
    if (now - lastGenerationTimestampRef.current < GENERATION_REQUEST_COOLDOWN_MS) {
      toast.error(t('generationCooldown'));
      return;
    }
    generationLockRef.current = true;
    lastGenerationTimestampRef.current = now;

    const currentCreditCost = videoCreditCost;
    let reservedCredits = 0;
    if (creditBalance) {
      const availableCreditsNow = creditBalance.availableBalance - pendingCreditCost;
      if (availableCreditsNow < currentCreditCost) {
        toast.error(t('insufficientCredits', { credits: currentCreditCost }));
        openUpgradePrompt();
        generationLockRef.current = false;
        lastGenerationTimestampRef.current = 0;
        return;
      }
      reservedCredits = currentCreditCost;
      setPendingCreditCost((prev) => prev + currentCreditCost);
    }

    setIsGenerating(true);
    setResult(null);
    startProgress(
      mode === 'image-to-video' ? t('progressUploadingImage') : t('progressPreparingRequest')
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

      // Add video style enhancement to prompt
      const selectedStyle = getVideoStyle(videoStyle);
      if (selectedStyle?.promptEnhancement) {
        finalPrompt = `${finalPrompt}, ${selectedStyle.promptEnhancement}`;
      }

      if (mode === 'image-to-video' && imagePreview) {
        finalPrompt = `${finalPrompt}\n\n[Image attached: ${imageFile?.name || 'uploaded image'}]`;
      }

      const requestBody: Record<string, unknown> = {
        prompt: finalPrompt,
        model: model,
        aspect_ratio: aspectRatio,
        style: videoStyle, // Pass style to API
        duration: duration, // Pass video duration (10 or 15 seconds)
        quality: model === 'sora-2-pro' ? quality : 'standard', // Pass quality (standard=720P, high=1080P)
        output_format: 'mp4', // Video output format (MP4 only)
      };

      if (mode === 'image-to-video' && imagePreview) {
        requestBody.image = imagePreview;
      }

      advanceProgress(15, t('progressSubmitting'));

      const response = await fetch('/api/v1/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429 || response.status === 402) {
          openUpgradePrompt();
          throw new Error(data.error || 'Video generation limit reached');
        }

        throw new Error(data.error || 'Failed to generate video');
      }

      // NEW ASYNC FLOW: Backend returns taskId immediately
      if (data.taskId && data.status === 'processing') {
        const taskId = data.taskId;
        console.log('[Video Generator] Task started, polling for completion:', {
          taskId,
          estimatedTime: data.estimatedTime,
        });

        advanceProgress(30, `${t('progressRendering')} (${data.estimatedTime || '10-20 minutes'})`);

        // Poll for status until complete
        const pollInterval = 5000; // Poll every 5 seconds
        const maxPolls = 300; // 25 minutes max (300 * 5s = 1500s)

        for (let pollCount = 0; pollCount < maxPolls; pollCount++) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval));

          try {
            const statusResponse = await fetch(`/api/v1/video-status/${taskId}`);
            const statusData = await statusResponse.json();

            if (statusData.status === 'completed') {
              // Video is ready!
              advanceProgress(100, t('progressReady'));
              completeProgress(t('progressReady'));

              setResult({
                videoUrl: statusData.videoUrl,
                prompt: prompt,
                model: model,
              });

              console.log('[Video Generator] Video generation completed:', {
                taskId,
                videoUrl: statusData.videoUrl,
              });

              return; // Exit the function successfully
            }

            if (statusData.status === 'failed') {
              throw new Error(statusData.error || 'Video generation failed');
            }

            // Still processing - update progress
            const progress = Math.min(30 + Math.floor((pollCount / maxPolls) * 60), 90);
            const elapsed = Math.floor((pollCount * pollInterval) / 1000 / 60);
            advanceProgress(
              progress,
              `${t('progressRendering')} (${elapsed}/${data.estimatedTime || '20'} min)`
            );
          } catch (pollError) {
            console.error('[Video Generator] Error polling status:', pollError);
            // Continue polling - transient errors shouldn't stop us
          }
        }

        // If we got here, polling timed out
        throw new Error(
          'Video generation is taking longer than expected. Please check your Assets page in a few minutes.'
        );
      }

      // OLD SYNC FLOW: Backend returns video directly (test mode or legacy)
      if (!data.videoUrl) {
        throw new Error('No video URL in response');
      }

      advanceProgress(80, t('progressFinalizing'));
      completeProgress(t('progressReady'));

      setResult({
        videoUrl: data.videoUrl,
        prompt: prompt,
        model: data.model ?? model,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      failProgress(errorMessage);
      setResult({
        videoUrl: '',
        prompt: prompt,
        model: model,
        error: errorMessage,
      });
    } finally {
      setIsGenerating(false);
      generationLockRef.current = false;
      if (reservedCredits > 0) {
        try {
          await refreshCreditBalance();
        } finally {
          setPendingCreditCost((prev) => Math.max(0, prev - reservedCredits));
        }
      } else {
        void refreshCreditBalance();
      }
    }
  };

  const getDownloadUrl = (videoUrl: string) => {
    if (videoUrl.startsWith('/api/v1/media')) {
      return `${videoUrl}${videoUrl.includes('?') ? '&' : '?'}download=1`;
    }
    return videoUrl;
  };

  const copyVideoLink = async (successMessage?: string) => {
    if (!result?.videoUrl) {
      return false;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(result.videoUrl);
      } else {
        window.prompt(t('shareCopyFallback'), result.videoUrl);
      }
      toast.success(successMessage || t('shareCopySuccess'));
      return true;
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      toast.error(t('shareCopyFailed'));
      window.prompt(t('shareCopyFallback'), result.videoUrl);
      return false;
    }
  };

  const submitPublishEntry = async () => {
    if (!result?.videoUrl) {
      throw new Error('No video available to publish.');
    }

    const response = await fetch('/api/v1/publish/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetUrl: result.videoUrl,
        previewUrl: result.videoUrl,
        assetId: null,
        prompt,
        title: prompt.trim().slice(0, 120),
        assetType: 'video',
        metadata: {
          model: result.model,
        },
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || 'Unable to submit for publishing. Please try again.');
    }
    return data.submission;
  };

  const awardShareReward = async (
    rewardKey: ShareRewardKey,
    metadata?: { platformId?: SharePlatformId; platformValue?: SharePlatform['platformValue'] }
  ) => {
    const reward = SHARE_REWARD_CONFIG[rewardKey];
    if (!result?.videoUrl || !reward || reward.credits <= 0) {
      return;
    }
    if (!isAuthenticated) {
      toast.error(t('shareLoginRequired'));
      return;
    }

    try {
      const referenceId = `${reward.referencePrefix}_${
        typeof globalThis.crypto?.randomUUID === 'function'
          ? globalThis.crypto.randomUUID()
          : Date.now()
      }`;
      const platformValue = metadata?.platformValue || reward.platform;
      const response = await fetch('/api/rewards/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platformValue,
          shareUrl: result.videoUrl,
          assetId: null,
          referenceId,
          rewardType: rewardKey,
          targetPlatform: metadata?.platformId || null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        toast.error(t('shareLoginRequired'));
        return;
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || t('shareRewardFailed'));
      }

      toast.success(t('shareRewardedAmount', { credits: reward.credits }));
    } catch (error) {
      console.error('Share reward error:', error);
      toast.error(error instanceof Error ? error.message : t('shareRewardFailed'));
    }
  };

  const handleShareAction = async (
    action: 'copy' | 'social' | 'publish',
    platformId?: SharePlatformId
  ) => {
    if (!result?.videoUrl) return;

    if (action === 'copy') {
      await copyVideoLink();
      return;
    }

    if (action === 'publish') {
      setIsPublishModalOpen(true);
      return;
    }

    if (action === 'social' && platformId) {
      const platform = sharePlatforms.find((item) => item.id === platformId);
      if (!platform) return;
      const encodedUrl = encodeURIComponent(result.videoUrl);
      if (platform.requiresCopy) {
        const copied = await copyVideoLink(t('shareCopyReminder', { platform: platform.label }));
        if (!copied) return;
      }
      if (platform.buildUrl) {
        window.open(platform.buildUrl(encodedUrl), '_blank', 'noopener,noreferrer');
      } else if (platform.openUrl) {
        window.open(platform.openUrl, '_blank', 'noopener,noreferrer');
      }
      toast.success(t('shareSocialToast', { platform: platform.label }));
      await awardShareReward('socialShare', {
        platformId,
        platformValue: platform.platformValue,
      });
    }
  };

  const handleConfirmPublish = async () => {
    if (!result?.videoUrl) {
      toast.error('Generate a video before confirming publish.');
      return;
    }
    try {
      await submitPublishEntry();
      toast.success(t('sharePublishToast'));
    } catch (error) {
      console.error('Video publish submission failed:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to submit your publish confirmation.';
      toast.error(message);
      return;
    }

    setIsPublishModalOpen(false);
  };

  const handleDownload = async (videoUrl: string) => {
    try {
      const downloadUrl = getDownloadUrl(videoUrl);
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(getDownloadUrl(videoUrl), '_blank');
    }
  };

  const canGenerate =
    prompt.trim().length > 0 && (mode === 'text-to-video' || imagePreview) && hasSufficientCredits;

  return (
    <>
      {showUpgradePrompt && (
        <UpgradePrompt
          isOpen={showUpgradePrompt}
          onClose={closeUpgradePrompt}
          type="videoGeneration"
        />
      )}
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <Card className="p-6">
              <div className="mb-6 space-y-4">
                <Tabs value={mode} onValueChange={(value) => setMode(value as GenerationMode)}>
                  <TabsList className="grid w-full grid-cols-2 bg-transparent gap-3 p-0">
                    <TabsTrigger
                      value="text-to-video"
                      className="font-medium data-[state=active]:bg-teal-500 data-[state=active]:text-white data-[state=inactive]:border-2 data-[state=inactive]:border-slate-300 dark:border-slate-700 data-[state=inactive]:rounded-full data-[state=inactive]:bg-white dark:bg-slate-900 data-[state=inactive]:text-slate-700 dark:text-slate-300 rounded-full py-3 transition-all"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {t('modeTextToVideo')}
                    </TabsTrigger>
                    <TabsTrigger
                      value="image-to-video"
                      className="font-medium data-[state=active]:bg-teal-500 data-[state=active]:text-white data-[state=inactive]:border-2 data-[state=inactive]:border-slate-300 dark:border-slate-700 data-[state=inactive]:rounded-full data-[state=inactive]:bg-white dark:bg-slate-900 data-[state=inactive]:text-slate-700 dark:text-slate-300 rounded-full py-3 transition-all"
                    >
                      <VideoIcon className="mr-2 h-4 w-4" />
                      {t('modeImageToVideo')}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="text-to-video" className="mt-6 space-y-6">
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
                        <Label className="font-light text-slate-700 dark:text-slate-300 text-sm">
                          {t('videoPrompt')} <span className="text-red-500">*</span>
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
                          rows={6}
                          className="resize-none border-slate-200 dark:border-slate-700 pr-24 pb-12 font-light focus:border-teal-500 focus:ring-teal-500/20"
                          ref={promptTextareaRef}
                        />
                        <Button
                          onClick={handleEnhancePrompt}
                          disabled={!prompt.trim() || isEnhancing}
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
                      <div className="text-right font-light text-slate-400 dark:text-slate-500 text-xs">
                        {prompt.length} / {maxPromptLength}
                      </div>
                      {enhancedPrompt && (
                        <div className="mt-4 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 p-4 shadow-sm">
                          <div className="mb-2 flex items-center justify-between">
                            <h4 className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                              <Sparkles className="h-4 w-4" />
                              {t('enhancedPrompt')}
                            </h4>
                            <Button
                              onClick={() => setEnhancedPrompt('')}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-slate-600 dark:text-slate-400"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <Textarea
                            value={enhancedPrompt}
                            onChange={(e) =>
                              setEnhancedPrompt(e.target.value.slice(0, maxPromptLength))
                            }
                            className="resize-none border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 text-sm"
                            rows={5}
                          />
                          <p className="mt-1 text-right text-teal-500 text-xs">
                            {enhancedPrompt.length} / {maxPromptLength}
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="image-to-video" className="mt-6 space-y-6">
                    {/* Warning Notice - No People/Faces */}
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-amber-900 text-sm mb-1">
                            {t('importantNotice')}
                          </h4>
                          <p className="text-amber-800 text-xs leading-relaxed">
                            {t('i2vWarning')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-light text-slate-700 dark:text-slate-300 text-sm">
                        {t('sourceImage')}
                      </Label>

                      {!imagePreview ? (
                        <button
                          type="button"
                          onClick={triggerFileInput}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          className="w-full hover-card cursor-pointer rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center transition-colors hover:border-teal-500"
                          aria-label={t('clickToUpload')}
                        >
                          <Upload className="mx-auto mb-3 h-12 w-12 text-slate-400 dark:text-slate-500" />
                          <p className="mb-1 font-light text-slate-600 dark:text-slate-400 text-sm">
                            {t('clickToUpload')}
                          </p>
                          <p className="font-light text-slate-400 dark:text-slate-500 text-xs">
                            {t('imageFormatDesc')}
                          </p>
                        </button>
                      ) : (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700"
                          />
                          <button
                            type="button"
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
                      <div className="flex items-center justify-between">
                        <Label className="font-light text-slate-700 dark:text-slate-300 text-sm">
                          {t('videoPrompt')} <span className="text-red-500">*</span>
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
                          className="resize-none border-slate-200 dark:border-slate-700 pr-24 pb-12 font-light focus:border-teal-500 focus:ring-teal-500/20"
                          ref={promptTextareaRef}
                        />
                        <Button
                          onClick={handleEnhancePrompt}
                          disabled={!prompt.trim() || isEnhancing}
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
                      <div className="text-right font-light text-slate-400 dark:text-slate-500 text-xs">
                        {prompt.length} / {maxPromptLength}
                      </div>
                      {enhancedPrompt && (
                        <div className="mt-4 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 p-4 shadow-sm">
                          <div className="mb-2 flex items-center justify-between">
                            <h4 className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                              <Sparkles className="h-4 w-4" />
                              {t('enhancedPrompt')}
                            </h4>
                            <Button
                              onClick={() => setEnhancedPrompt('')}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-slate-600 dark:text-slate-400"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <Textarea
                            value={enhancedPrompt}
                            onChange={(e) =>
                              setEnhancedPrompt(e.target.value.slice(0, maxPromptLength))
                            }
                            className="resize-none border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 text-sm"
                            rows={5}
                          />
                          <p className="mt-1 text-right text-teal-500 text-xs">
                            {enhancedPrompt.length} / {maxPromptLength}
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Video Style Selection */}
                <div className="space-y-2">
                  <Label className="font-light text-slate-700 dark:text-slate-300 text-sm">
                    {t('videoStyle')}
                  </Label>
                  <Select value={videoStyle} onValueChange={setVideoStyle}>
                    <SelectTrigger className="border-slate-200 dark:border-slate-700 font-light">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VIDEO_STYLES.map((style) => (
                        <SelectItem key={style.id} value={style.id} title={style.description}>
                          {t(`videoStyles.${style.id}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-light text-slate-700 dark:text-slate-300 text-sm">
                      {t('model')}
                    </Label>
                    <Select
                      value={model}
                      onValueChange={(value) => {
                        setModel(value as 'sora-2' | 'sora-2-pro');
                        // Reset quality to standard when switching models
                        if (value === 'sora-2') {
                          setQuality('standard');
                        }
                      }}
                    >
                      <SelectTrigger className="border-slate-200 dark:border-slate-700 font-light">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sora-2">
                          {t('modelSora2', { credits: '15-20' })}
                        </SelectItem>
                        <SelectItem value="sora-2-pro">
                          {t('modelSora2Pro', { credits: '45-130' })}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-light text-slate-700 dark:text-slate-300 text-sm">
                      {t('aspectRatio')}
                    </Label>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger className="border-slate-200 dark:border-slate-700 font-light">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:9">{t('aspectRatioLandscape')}</SelectItem>
                        <SelectItem value="9:16">{t('aspectRatioPortrait')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Quality Selector - Only show for Sora 2 Pro */}
                {model === 'sora-2-pro' && (
                  <div className="space-y-2">
                    <Label className="font-light text-slate-700 dark:text-slate-300 text-sm">
                      {t('quality')}
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setQuality('standard')}
                        className={`flex items-center justify-center rounded-lg border-2 py-3 px-4 text-sm font-medium transition-all ${
                          quality === 'standard'
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-slate-700 dark:text-slate-300'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-teal-400 dark:border-teal-600'
                        }`}
                      >
                        <span>{t('qualityStandard')}</span>
                        {quality === 'standard' && (
                          <svg
                            className="ml-2 h-4 w-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            role="img"
                            aria-label="Selected quality"
                          >
                            <title>Selected quality</title>
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
                        onClick={() => setQuality('high')}
                        className={`flex items-center justify-center rounded-lg border-2 py-3 px-4 text-sm font-medium transition-all ${
                          quality === 'high'
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-slate-700 dark:text-slate-300'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-teal-400 dark:border-teal-600'
                        }`}
                      >
                        <span>{t('qualityHigh')}</span>
                        {quality === 'high' && (
                          <svg
                            className="ml-2 h-4 w-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            role="img"
                            aria-label="Selected quality"
                          >
                            <title>Selected quality</title>
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
                )}

                <div className="space-y-2">
                  <Label className="font-light text-slate-700 dark:text-slate-300 text-sm">
                    {t('videoDuration')}
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDuration(10)}
                      className={`flex items-center justify-center rounded-lg border-2 py-3 px-4 text-sm font-medium transition-all ${
                        duration === 10
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-slate-700 dark:text-slate-300'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-teal-400 dark:border-teal-600'
                      }`}
                    >
                      <span>{t('duration10')}</span>
                      {duration === 10 && (
                        <svg
                          className="ml-2 h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          role="img"
                          aria-label="Selected duration"
                        >
                          <title>Selected duration</title>
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
                      onClick={() => setDuration(15)}
                      className={`flex items-center justify-center rounded-lg border-2 py-3 px-4 text-sm font-medium transition-all ${
                        duration === 15
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-slate-700 dark:text-slate-300'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-teal-400 dark:border-teal-600'
                      }`}
                    >
                      <span>{t('duration15')}</span>
                      {duration === 15 && (
                        <svg
                          className="ml-2 h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          role="img"
                          aria-label="Selected duration"
                        >
                          <title>Selected duration</title>
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
                  className="w-full transform border-0 bg-gradient-to-r from-teal-500 via-blue-500 to-teal-500 font-bold text-lg text-white shadow-2xl shadow-teal-500/50 transition-all duration-300 hover:scale-105 hover:from-teal-600 hover:via-blue-600 hover:to-teal-600"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('generating')}
                    </>
                  ) : (
                    <>
                      <VideoIcon className="mr-2 h-5 w-5" />
                      {t('generateVideo')} ({videoCreditCost} credits)
                    </>
                  )}
                </Button>
                {creditBalance && !hasSufficientCredits && (
                  <p className="mt-2 text-sm text-red-500">
                    {t('insufficientCredits', { credits: videoCreditCost })}
                  </p>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:sticky lg:top-24 lg:h-fit">
            <Card className="p-6">
              {!result && !isGenerating && (
                <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                  <div className="space-y-3 text-center">
                    <VideoIcon className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500" />
                    <p className="font-light text-slate-500 dark:text-slate-400 text-sm">
                      {t('videoWillAppearHere')}
                    </p>
                  </div>
                </div>
              )}

              {isGenerating && (
                <div className="flex aspect-video flex-col items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 p-6 text-center">
                  <Loader2 className="mb-4 h-12 w-12 animate-spin text-teal-500" />
                  <p className="font-medium text-slate-700 dark:text-slate-300">
                    {progressMessage || t('generatingVideo')}
                  </p>
                  <div className="mt-4 w-full max-w-md space-y-2">
                    <GenerationProgressBar value={progressValue} />
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {Math.round(progressValue)}%
                    </p>
                  </div>
                  <p className="mt-3 font-light text-slate-500 dark:text-slate-400 text-sm">
                    {t('generatingTakeMinutes')}
                  </p>
                </div>
              )}

              {result?.error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                  <div className="mb-2 flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    <h3 className="font-semibold">{t('generationFailed')}</h3>
                  </div>
                  <p className="text-red-600 text-sm">{result.error}</p>
                </div>
              )}

              {result && !result.error && result.videoUrl && (
                <div className="space-y-4">
                  <video
                    src={result.videoUrl}
                    controls
                    className="w-full rounded-xl"
                    poster={imagePreview || undefined}
                  >
                    <track kind="captions" src="data:text/vtt,WEBVTT" label="captions" />
                    {t('browserNotSupport')}
                  </video>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => handleDownload(result.videoUrl)}
                      variant="outline"
                      className="border-slate-200 dark:border-slate-700 font-light"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {t('download')}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="border-slate-200 dark:border-slate-700 font-light"
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          {t('share')}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel>{t('shareOptions')}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => void handleShareAction('copy')}>
                          <Link2 className="mr-2 h-4 w-4" />
                          {t('shareCopyLink')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>
                          <div className="flex flex-col">
                            <span>{t('shareSocialLabel')}</span>
                            <span className="text-xs font-normal text-teal-600">
                              {t('shareSocialRewardHint', { credits: socialShareReward })}
                            </span>
                          </div>
                        </DropdownMenuLabel>
                        {sharePlatforms.map((platform) => (
                          <DropdownMenuItem
                            key={platform.id}
                            onClick={() => void handleShareAction('social', platform.id)}
                            className="flex items-center gap-2"
                          >
                            <platform.icon className="mr-2 h-4 w-4" />
                            <span className="flex-1">{platform.label}</span>
                            <span className="text-xs font-medium text-teal-600">
                              {t('shareRewardSuffix', { credits: socialShareReward })}
                            </span>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>
                          <div className="flex flex-col">
                            <span>{t('sharePublishOnViecomLabel')}</span>
                            <span className="text-xs font-normal text-teal-600">
                              {t('shareViecomRewardHint', { credits: publishShareReward })}
                            </span>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => void handleShareAction('publish')}>
                          <Globe className="mr-2 h-4 w-4" />
                          <span className="flex-1">{t('sharePublishOnViecom')}</span>
                          <span className="text-xs font-medium text-teal-600">
                            {t('shareRewardSuffix', { credits: publishShareReward })}
                          </span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
      {isPublishModalOpen && (
        <dialog
          open
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClose={() => setIsPublishModalOpen(false)}
        >
          <div className="max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4 text-slate-700">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-teal-100 p-2 text-teal-600">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {t('sharePublishInfoTitle')}
                </h2>
                <p className="text-sm text-slate-500">{t('sharePublishInfoSubtext')}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">{t('sharePublishInfoDescription')}</p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleConfirmPublish}
                className="flex-1 bg-teal-500 text-white hover:bg-teal-600"
              >
                {t('shareConfirmPublish')}
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-slate-200"
                onClick={() => setIsPublishModalOpen(false)}
              >
                {t('sharePublishCancel')}
              </Button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
