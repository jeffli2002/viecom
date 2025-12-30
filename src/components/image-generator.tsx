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
import { creditsConfig, getModelCost } from '@/config/credits.config';
import {
  ALLOWED_SOURCE_IMAGE_MIME_TYPES,
  MAX_SOURCE_IMAGES,
  MAX_SOURCE_IMAGE_FILE_SIZE_BYTES,
} from '@/config/image-upload.config';
import { SHARE_REWARD_CONFIG, type ShareRewardKey } from '@/config/share.config';
import { IMAGE_STYLES, getImageStyle } from '@/config/styles.config';
import { useCreditBalance } from '@/hooks/use-credit-balance';
import { useGenerationProgress } from '@/hooks/use-generation-progress';
import { useHasCreditPack } from '@/hooks/use-has-credit-pack';
import { useSubscription } from '@/hooks/use-subscription';
import { useUpgradePrompt } from '@/hooks/use-upgrade-prompt';
import type { BrandToneAnalysis } from '@/lib/brand/brand-tone-analyzer';
import { buildSharePlatforms } from '@/lib/share/share-platforms';
import type { SharePlatform, SharePlatformId } from '@/lib/share/share-platforms';
import { useAuthStore } from '@/store/auth-store';
import {
  AlertCircle,
  Copy,
  Download,
  Eraser,
  Globe,
  Image as ImageIcon,
  Link2,
  Loader2,
  Share2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
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
type SourceImage = {
  id: string;
  name: string;
  dataUrl: string;
  remoteUrl?: string;
  isUploading?: boolean;
  error?: string;
};

const createClientRequestId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const createSourceImageId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `src-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const formatBytesToMb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);
const MAX_SOURCE_IMAGE_SIZE_LABEL = `${formatBytesToMb(MAX_SOURCE_IMAGE_FILE_SIZE_BYTES)} MB`;
const SOURCE_IMAGE_ACCEPT = ALLOWED_SOURCE_IMAGE_MIME_TYPES.join(',');
const ALLOWED_SOURCE_IMAGE_TYPE_SET = new Set<string>(ALLOWED_SOURCE_IMAGE_MIME_TYPES);
const IMAGE_GENERATION_TIMEOUT_MS = 10 * 60 * 1000; // Allow more time for 4K Nano Banana Pro jobs
const GENERATION_REQUEST_COOLDOWN_MS = 4000;

const parseJsonResponse = async <T,>(
  response: Response
): Promise<{
  data: T | null;
  rawText: string;
}> => {
  const rawText = await response.text();
  if (!rawText) {
    return { data: null, rawText: '' };
  }
  try {
    return { data: JSON.parse(rawText) as T, rawText };
  } catch {
    return { data: null, rawText };
  }
};

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
  const { planId } = useSubscription();
  const { hasCreditPack } = useHasCreditPack();
  const isPaidUser = planId !== 'free' || hasCreditPack;
  const [mode, setMode] = useState<GenerationMode>(initialMode);
  const [prompt, setPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [sourceImages, setSourceImages] = useState<SourceImage[]>([]);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [model, setModel] = useState<string>('nano-banana');
  const [resolution, setResolution] = useState<'1k' | '2k' | '4k'>('1k'); // Resolution for nano-banana-pro
  const [imageStyle, setImageStyle] = useState<string>('studio-shot'); // Image style selection
  const [outputFormat, setOutputFormat] = useState<'PNG' | 'JPEG'>('PNG'); // Output format selection
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [pendingCreditCost, setPendingCreditCost] = useState(0);
  const { balance: creditBalance, refresh: refreshCreditBalance } = useCreditBalance();
  const [shareStatus, setShareStatus] = useState<'idle' | 'pending' | 'awarded' | 'error'>('idle');
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  // ...
  const activeRequestIdRef = useRef<string | null>(null);
  const generationLockRef = useRef(false);
  const lastGenerationTimestampRef = useRef(0);
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
  const getInFlightMessage = (waitTimeSeconds?: number) => {
    if (typeof waitTimeSeconds === 'number' && waitTimeSeconds > 0) {
      const waitMinutes = Math.max(1, Math.ceil(waitTimeSeconds / 60));
      return t('generationInFlightWithWait', { minutes: waitMinutes });
    }
    return t('generationInFlight');
  };

  // Brand analysis data (loaded from sessionStorage, no UI)
  const [brandAnalysis, setBrandAnalysis] = useState<BrandToneAnalysis | null>(null);

  const maxPromptLength = 2000;
  const textDefaultPrompt =
    'A serene Japanese garden with cherry blossoms in full bloom, koi fish swimming in a crystal-clear pond, traditional wooden bridge, soft morning light filtering through maple trees, ultra-realistic, high detail';
  const imageDefaultPrompt =
    'Transform this image into a watercolor painting style, soft pastel colors, artistic brush strokes';

  const imageCreditCost = useMemo(() => {
    return getModelCost(
      'imageGeneration',
      model,
      model === 'nano-banana-pro' ? resolution : undefined
    );
  }, [model, resolution]);
  const effectiveCredits =
    creditBalance?.availableBalance !== undefined
      ? creditBalance.availableBalance - pendingCreditCost
      : null;
  const hasSufficientCredits = effectiveCredits === null || effectiveCredits >= imageCreditCost;

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
    setIsPublishModalOpen(false);
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
      const parsed = await parseJsonResponse<{
        imageUrl?: string;
        previewUrl?: string;
        model?: string;
        prompt?: string;
        taskId?: string;
        assetId?: string;
        clientRequestId?: string;
        creditsUsed?: number;
      }>(response);
      const data = parsed.data;

      if (!data?.imageUrl) {
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

  const updateSourceImage = (imageId: string, updater: (image: SourceImage) => SourceImage) => {
    setSourceImages((prev) => prev.map((image) => (image.id === imageId ? updater(image) : image)));
  };

  const readSourceImagePreview = (file: File, imageId: string) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        updateSourceImage(imageId, (image) => ({
          ...image,
          dataUrl: reader.result as string,
        }));
      }
    };
    reader.onerror = () => {
      console.error('Failed to read source image:', reader.error);
    };
    reader.readAsDataURL(file);
  };

  const prepareDirectUpload = async (
    file: File
  ): Promise<{ uploadUrl: string; publicUrl: string; key: string }> => {
    const response = await fetch('/api/v1/uploads/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name || 'source-image',
        contentType: file.type || 'application/octet-stream',
        fileSize: file.size,
        purpose: 'image-source',
      }),
    });

    const parsed = await parseJsonResponse<{
      uploadUrl?: string;
      publicUrl?: string;
      key?: string;
      error?: string;
      maxFileSize?: number;
    }>(response);
    const data = parsed.data;

    if (!response.ok || !data?.uploadUrl || !data?.publicUrl || !data?.key) {
      const fallback =
        response.status === 413
          ? 'The upload request body was too large. Please retry with a smaller image.'
          : `Failed to prepare upload (status ${response.status}). Please try again later.`;
      const message =
        data?.error ||
        (parsed.rawText && parsed.rawText.length < 400 ? parsed.rawText : fallback) ||
        fallback;
      throw new Error(message);
    }

    return {
      uploadUrl: data.uploadUrl,
      publicUrl: data.publicUrl,
      key: data.key,
    };
  };

  const uploadViaDirectUrl = async (file: File): Promise<string> => {
    const prepared = await prepareDirectUpload(file);
    const uploadResponse = await fetch(prepared.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(
        `Upload failed with status ${uploadResponse.status}. Please try again later.`
      );
    }

    return prepared.publicUrl;
  };

  const uploadViaProxy = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file, file.name || 'source-image');
    formData.append('fileName', file.name || 'source-image');
    formData.append('contentType', file.type || 'application/octet-stream');
    formData.append('purpose', 'image-source');

    const response = await fetch('/api/v1/uploads/direct', {
      method: 'POST',
      body: formData,
    });

    const parsed = await parseJsonResponse<{
      publicUrl?: string;
      error?: string;
    }>(response);
    const data = parsed.data;

    if (!response.ok || !data?.publicUrl) {
      const fallback =
        response.status === 413
          ? 'Image upload exceeded the server limit. Please try a smaller file.'
          : `Upload failed (status ${response.status}). Please try again later.`;
      const message =
        data?.error ||
        (parsed.rawText && parsed.rawText.length < 400 ? parsed.rawText : fallback) ||
        fallback;
      throw new Error(message);
    }

    return data.publicUrl;
  };

  const uploadSourceImage = async (file: File, imageId: string) => {
    try {
      const remoteUrl = await uploadViaDirectUrl(file);
      updateSourceImage(imageId, (image) => ({
        ...image,
        remoteUrl,
        isUploading: false,
        error: undefined,
      }));
      return;
    } catch (directError) {
      console.warn('Direct R2 upload failed, falling back to proxy route:', directError);
    }

    try {
      const remoteUrl = await uploadViaProxy(file);
      updateSourceImage(imageId, (image) => ({
        ...image,
        remoteUrl,
        isUploading: false,
        error: undefined,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to upload image. Please try again.';
      console.error('Source image upload failed:', error);
      updateSourceImage(imageId, (image) => ({
        ...image,
        isUploading: false,
        error: message,
      }));
      toast.error(message);
    }
  };

  const addSourceImages = (files: File[]) => {
    if (files.length === 0) return;

    const remainingSlots = MAX_SOURCE_IMAGES - sourceImages.length;
    if (remainingSlots <= 0) {
      toast.error(`You can upload up to ${MAX_SOURCE_IMAGES} images for image-to-image mode.`);
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    const validFiles: File[] = [];

    for (const file of filesToProcess) {
      if (!file.type || !ALLOWED_SOURCE_IMAGE_TYPE_SET.has(file.type)) {
        toast.error('Only JPEG, PNG, or WebP images can be used as references.');
        continue;
      }
      if (file.size > MAX_SOURCE_IMAGE_FILE_SIZE_BYTES) {
        toast.error(`Each image must be under ${MAX_SOURCE_IMAGE_SIZE_LABEL}.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      return;
    }

    const newEntries = validFiles.map((file, index) => ({
      id: createSourceImageId(),
      name: file.name || `image-${sourceImages.length + index + 1}`,
      dataUrl: '',
      remoteUrl: undefined,
      isUploading: true,
      error: undefined,
    }));

    setSourceImages((prev) => [...prev, ...newEntries]);

    newEntries.forEach((entry, idx) => {
      const file = validFiles[idx];
      readSourceImagePreview(file, entry.id);
      void uploadSourceImage(file, entry.id);
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

  const handleRemoveImage = (imageId: string) => {
    setSourceImages((prev) => prev.filter((image) => image.id !== imageId));
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

    if (mode === 'image-to-image') {
      if (sourceImages.length === 0) {
        toast.error('Please upload at least one reference image.');
        return;
      }

      const uploadingImage = sourceImages.find((image) => image.isUploading);
      if (uploadingImage) {
        toast.error('Please wait for your images to finish uploading before generating.');
        return;
      }

      const invalidImage = sourceImages.find((image) => image.error || !image.remoteUrl);
      if (invalidImage) {
        toast.error('One of your images failed to upload. Please fix it or remove the image.');
        return;
      }
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

    const currentCreditCost = imageCreditCost;
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

      // Add resolution for nano-banana-pro
      if (model === 'nano-banana-pro') {
        requestBody.resolution = resolution.toUpperCase(); // Convert '1k' to '1K' for API
      }

      if (mode === 'image-to-image' && sourceImages.length > 0) {
        const remoteSources = sourceImages
          .slice(0, MAX_SOURCE_IMAGES)
          .map((image) => image.remoteUrl)
          .filter((url): url is string => Boolean(url));
        if (remoteSources.length > 0) {
          requestBody.images = remoteSources;
        }
      }

      let response: Response;
      // Abort the request if it runs longer than expected (4K renders can take ~8 min)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), IMAGE_GENERATION_TIMEOUT_MS);

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

      const parsedResponse = await parseJsonResponse<{
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
        waitTimeSeconds?: number;
        currentTaskId?: string;
      }>(response);
      const data = parsedResponse.data;

      advanceProgress(75, t('progressFinalizing'));

      if (!response.ok) {
        if (response.status === 429) {
          if (data?.currentTaskId || typeof data?.waitTimeSeconds === 'number') {
            const message = getInFlightMessage(data?.waitTimeSeconds);
            toast.error(message);
            throw new Error(message);
          }
          openUpgradePrompt();
          throw new Error(data?.error || 'Image generation limit reached');
        }
        if (response.status === 402) {
          openUpgradePrompt();
          throw new Error(data?.error || 'Image generation limit reached');
        }

        const fallbackMessage =
          response.status === 413
            ? 'The request payload is too large. Please reduce input size or try again later.'
            : `Request failed with status ${response.status}`;
        const errorMessage =
          data?.error ||
          data?.details ||
          (parsedResponse.rawText && parsedResponse.rawText.length < 400
            ? parsedResponse.rawText
            : fallbackMessage);
        console.error('Image generation API error:', {
          status: response.status,
          error: data?.error,
          details: data?.details,
          raw: parsedResponse.rawText?.slice(0, 200),
        });
        throw new Error(errorMessage);
      }

      if (!data?.imageUrl) {
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

  const getDownloadUrl = (imageUrl: string, previewUrl?: string) => {
    if (imageUrl.startsWith('/api/v1/media')) {
      return `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}download=1`;
    }
    if (previewUrl?.startsWith('/api/v1/media')) {
      return `${previewUrl}${previewUrl.includes('?') ? '&' : '?'}download=1`;
    }
    return imageUrl;
  };

  const copyShareLink = async (successMessage?: string) => {
    if (!result?.imageUrl) {
      return false;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(result.imageUrl);
      } else {
        window.prompt(t('shareCopyFallback'), result.imageUrl);
      }
      toast.success(successMessage || t('shareCopySuccess'));
      setShareStatus('idle');
      setShareMessage(successMessage || t('shareCopySuccess'));
      return true;
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      toast.error(t('shareCopyFailed'));
      setShareStatus('error');
      setShareMessage(t('shareCopyFailed'));
      window.prompt(t('shareCopyFallback'), result.imageUrl);
      return false;
    }
  };

  const submitPublishEntry = async () => {
    if (!result?.imageUrl) {
      throw new Error('No image available to publish.');
    }
    const response = await fetch('/api/v1/publish/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetUrl: result.imageUrl,
        previewUrl: result.previewUrl ?? result.imageUrl,
        assetId: result.assetId ?? null,
        prompt: prompt,
        title: prompt.trim().slice(0, 120),
        assetType: 'image',
        metadata: {
          model: result.model,
          requestId: result.requestId,
        },
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || 'Unable to submit for publishing. Please try again.');
    }
    return data.submission;
  };

  const handleShareAction = async (
    action: 'copy' | 'social' | 'publish',
    platformId?: SharePlatformId
  ) => {
    if (!result?.imageUrl) return;

    if (action === 'copy') {
      await copyShareLink();
      return;
    }

    if (action === 'publish') {
      setIsPublishModalOpen(true);
      setShareMessage(null);
      setShareStatus('idle');
      return;
    }

    if (action === 'social' && platformId) {
      const platform = sharePlatforms.find((item) => item.id === platformId);
      if (!platform) return;
      const encodedUrl = encodeURIComponent(result.imageUrl);
      if (platform.requiresCopy) {
        const copied = await copyShareLink(t('shareCopyReminder', { platform: platform.label }));
        if (!copied) return;
      }
      if (platform.buildUrl) {
        const destination = platform.buildUrl(encodedUrl);
        window.open(destination, '_blank', 'noopener,noreferrer');
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
    if (!result?.imageUrl) {
      toast.error('Generate an asset before confirming publish.');
      return;
    }
    try {
      await submitPublishEntry();
      toast.success(t('sharePublishToast'));
      setShareStatus('idle');
      setShareMessage(t('sharePublishToast'));
    } catch (error) {
      console.error('Publish confirmation failed:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to submit your publish confirmation.';
      toast.error(message);
      setShareStatus('error');
      setShareMessage(message);
      return;
    }

    setIsPublishModalOpen(false);
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
      // Use safe removal to avoid DOMExceptions if node already detached
      if (a.remove) {
        a.remove();
      } else if (a.parentNode) {
        a.parentNode.removeChild(a);
      }
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      const targetUrl = getDownloadUrl(fallbackUrl ?? imageUrl);
      window.open(targetUrl, '_blank');
    }
  };

  const awardShareReward = async (
    rewardKey: ShareRewardKey,
    metadata?: { platformId?: SharePlatformId; platformValue?: SharePlatform['platformValue'] }
  ) => {
    const reward = SHARE_REWARD_CONFIG[rewardKey];
    if (!result?.imageUrl || !reward || reward.credits <= 0) {
      return;
    }
    if (!isAuthenticated) {
      setShareStatus('error');
      setShareMessage(t('shareLoginRequired'));
      return;
    }
    if (shareStatus === 'pending') return;

    setShareStatus('pending');

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
          shareUrl: result.imageUrl,
          assetId: result.assetId ?? null,
          referenceId,
          rewardType: rewardKey,
          targetPlatform: metadata?.platformId || null,
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
      setShareMessage(t('shareRewardedAmount', { credits: reward.credits }));
      toast.success(t('shareRewardedAmount', { credits: reward.credits }));
    } catch (error) {
      console.error('Share reward error:', error);
      setShareStatus('error');
      setShareMessage(error instanceof Error ? error.message : t('shareRewardFailed'));
      toast.error(error instanceof Error ? error.message : t('shareRewardFailed'));
    }
  };

  const canGenerate =
    prompt.trim().length > 0 &&
    (mode === 'text-to-image' || sourceImages.length > 0) &&
    hasSufficientCredits;

  return (
    <div className="px-4 py-8 lg:px-8">
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
                        onChange={(e) =>
                          setEnhancedPrompt(e.target.value.slice(0, maxPromptLength))
                        }
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
                        <p className="mb-1 font-light text-gray-600 text-sm">
                          {t('clickToUpload')}
                        </p>
                        <p className="font-light text-gray-400 text-xs">{t('imageFormatDesc')}</p>
                        <p className="mt-2 text-xs text-gray-400">{t('dragDropUpload')}</p>
                      </button>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {sourceImages.map((image, idx) => {
                          const previewSrc = image.dataUrl || image.remoteUrl || '';
                          return (
                            <div key={image.id} className="relative w-full">
                              <button
                                type="button"
                                className="group w-full overflow-hidden rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                onClick={() => {
                                  if (!previewSrc) return;
                                  setLightboxImage({
                                    url: previewSrc,
                                    alt: image.name || `Source image ${idx + 1}`,
                                  });
                                }}
                                disabled={!previewSrc}
                              >
                                {previewSrc ? (
                                  <img
                                    src={previewSrc}
                                    alt={`Source ${idx + 1}`}
                                    className="w-full max-h-96 object-contain"
                                  />
                                ) : (
                                  <div className="flex h-48 w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
                                    Preparing preview...
                                  </div>
                                )}
                              </button>
                              {image.isUploading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/50 text-white">
                                  <Loader2 className="mb-2 h-6 w-6 animate-spin" />
                                  <span className="text-xs">Uploading...</span>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(image.id)}
                                className="absolute top-2 right-2 rounded-full bg-red-500 p-2 text-white transition-colors hover:bg-red-600"
                                aria-label={t('removeSourceImage')}
                              >
                                <X className="h-4 w-4" />
                              </button>
                              {image.error && (
                                <p className="mt-2 text-xs text-red-500">{image.error}</p>
                              )}
                            </div>
                          );
                        })}
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
                    accept={SOURCE_IMAGE_ACCEPT}
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
                        onChange={(e) =>
                          setEnhancedPrompt(e.target.value.slice(0, maxPromptLength))
                        }
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
                  <Select
                    value={model}
                    onValueChange={(value) => {
                      setModel(value);
                      // Reset resolution to 1k when switching away from nano-banana-pro
                      if (value !== 'nano-banana-pro') {
                        setResolution('1k');
                      }
                    }}
                  >
                    <SelectTrigger className="border-gray-200 font-light">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nano-banana">
                        Nano Banana - {creditsConfig.consumption.imageGeneration['nano-banana']}{' '}
                        credits
                      </SelectItem>
                      <SelectItem value="nano-banana-pro">
                        Nano Banana Pro - (22/30) credits
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

              {/* Resolution selection for nano-banana-pro */}
              {model === 'nano-banana-pro' && (
                <div className="space-y-2">
                  <Label className="font-light text-gray-700 text-sm">Resolution</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['1k', '2k', '4k'] as const).map((res) => {
                      const isDisabled = !isPaidUser && res !== '1k';
                      const cost =
                        creditsConfig.consumption.imageGeneration[
                          `nano-banana-pro-${res}` as keyof typeof creditsConfig.consumption.imageGeneration
                        ] || creditsConfig.consumption.imageGeneration['nano-banana-pro'];
                      return (
                        <button
                          key={res}
                          type="button"
                          onClick={() => {
                            if (isDisabled) {
                              openUpgradePrompt();
                            } else {
                              setResolution(res);
                            }
                          }}
                          className={`flex flex-col items-center justify-center rounded-lg border-2 py-3 px-4 text-sm font-medium transition-all ${
                            resolution === res
                              ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-slate-700 dark:text-slate-300'
                              : isDisabled
                                ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:border-teal-500'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 hover:border-teal-500'
                          }`}
                        >
                          <span className="font-semibold">{res.toUpperCase()}</span>
                          <span className="text-xs mt-1">{cost} credits</span>
                          {isDisabled && (
                            <span className="text-xs mt-1 text-red-500">Upgrade required</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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
              {creditBalance && !hasSufficientCredits && (
                <p className="mt-2 text-sm text-red-500">
                  {t('insufficientCredits', { credits: imageCreditCost })}
                </p>
              )}
            </div>

            <div className="lg:sticky lg:top-24 lg:h-fit">
              <Card className="p-6">
                {!result && !isGenerating && (
                  <div className="flex aspect-square items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                    <div className="space-y-3 text-center">
                      <ImageIcon className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500" />
                      <p className="font-light text-slate-500 dark:text-slate-400 text-sm">
                        {t('imageWillAppearHere')}
                      </p>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="border-gray-200 font-light">
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
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
            onClick={() => setLightboxImage(null)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setLightboxImage(null);
              }
            }}
            aria-modal="true"
            tabIndex={-1}
          >
            <div
              className="relative max-h-full max-w-5xl"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.stopPropagation();
                  setLightboxImage(null);
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
          </div>
        )}
        {isPublishModalOpen && (
          <dialog open className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
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
      </div>
    </div>
  );
}
