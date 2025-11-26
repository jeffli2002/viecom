'use client';

import UpgradePrompt from '@/components/auth/UpgradePrompt';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getBatchConfig } from '@/config/batch.config';
import { creditsConfig } from '@/config/credits.config';
import { IMAGE_STYLES, VIDEO_STYLES } from '@/config/styles.config';
import { useUpgradePrompt } from '@/hooks/use-upgrade-prompt';
import { useSubscription } from '@/hooks/use-subscription';
import { useAuthStore } from '@/store/auth-store';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Maximize2,
  Sparkles,
  Upload,
  XCircle,
  Zap,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

interface RowData {
  rowIndex: number;
  productName?: string;
  productDescription?: string;
  prompt: string;
  baseImageUrl?: string;
  productSellingPoints?: string;
  enhancedPrompt?: string;
  isSelected: boolean;
  status?: 'pending' | 'enhancing' | 'enhanced' | 'generating' | 'completed' | 'failed';
  assetUrl?: string;
  assetPreviewUrl?: string;
  assetR2Key?: string;
  error?: string;
  progress?: number; // 0-100, for generation progress
  publishPlatforms?: string;
  publishMode?: 'media-only' | 'product';
  productTitle?: string;
  productCategory?: string;
  productBrand?: string;
  productModel?: string;
  productSku?: string;
  productUpc?: string;
  productCountryOfOrigin?: string;
  standardPrice?: number;
  salePrice?: number;
  currency?: string;
  inventoryQuantity?: number;
  minPurchaseQuantity?: number;
  maxPurchaseQuantity?: number;
  productTags?: string;
  generationMode?: 't2i' | 'i2i' | 't2v' | 'i2v';
  model?: string;
  aspectRatio?: string;
}

type ValidatedRowResponse = Partial<RowData>;
type EnhancedPromptResponse = {
  rowIndex: number;
  enhancedPrompt: string;
};
type AssetResponse = {
  rowIndex?: number;
  prompt?: string;
  enhancedPrompt?: string;
  status?: 'completed' | 'failed' | 'processing';
  publicUrl?: string;
  url?: string;
  previewUrl?: string;
  r2Key?: string;
  error?: string;
};

type GenerationType = 'image' | 'video';

interface BatchGenerationFlowProps {
  generationType: GenerationType;
}

export function BatchGenerationFlow({ generationType }: BatchGenerationFlowProps) {
  const t = useTranslations('batchGeneration');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<RowData[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isEnhancingAll, setIsEnhancingAll] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Array<{ row: number; field: string; message: string }>
  >([]);
  const [generationMode, setGenerationMode] = useState<'t2i' | 'i2i' | 't2v' | 'i2v'>(
    generationType === 'image' ? 'i2i' : 'i2v'
  );
  const [aspectRatio, setAspectRatio] = useState<string>(
    generationType === 'image' ? '1:1' : '16:9'
  );
  const [style, setStyle] = useState<string>(
    generationType === 'image' ? 'studio-shot' : 'spoken-script'
  );
  // Image-specific settings
  const [outputFormat, setOutputFormat] = useState<'PNG' | 'JPEG'>('PNG');
  // Video-specific settings
  const [videoModel, setVideoModel] = useState<'sora-2' | 'sora-2-pro'>('sora-2');
  const [videoDuration, setVideoDuration] = useState<10 | 15>(10);
  const [videoQuality, setVideoQuality] = useState<'standard' | 'high'>('standard');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewAsset, setPreviewAsset] = useState<{
    url: string;
    type: 'image' | 'video';
    rowIndex: number;
  } | null>(null);
  const { showUpgradePrompt, openUpgradePrompt, closeUpgradePrompt } = useUpgradePrompt();
  const { isAuthenticated } = useAuthStore();
  const { planId: subscriptionPlanId, loading: subscriptionLoading } = useSubscription();
  const progressIntervalsRef = useRef<Map<number, NodeJS.Timeout[]>>(new Map());
  const [userCredits, setUserCredits] = useState<number>(0);
  const normalizedPlan: 'free' | 'pro' | 'proplus' = subscriptionPlanId || 'free';
  const { userFacing: planConfig } = getBatchConfig(normalizedPlan);
  const translate = (
    key: Parameters<typeof t>[0],
    fallback: string,
    values?: Record<string, unknown>
  ) => {
    try {
      return t(key as any, values);
    } catch (error) {
      console.warn(`[batch-generation][i18n] missing key ${String(key)}:`, error);
      return fallback;
    }
  };
  const planLabelMap: Record<'free' | 'pro' | 'proplus', string> = {
    free: translate('planLabelFree', 'Free Plan'),
    pro: translate('planLabelPro', 'Pro Plan'),
    proplus: translate('planLabelProplus', 'Pro+ Plan'),
  };
  const planDisplayName = planLabelMap[normalizedPlan];
  const nextPlan =
    normalizedPlan === 'free' ? 'pro' : normalizedPlan === 'pro' ? 'proplus' : null;
  const planLimitsDescription = subscriptionLoading
    ? translate('planLimitLoading', 'Loading plan limits...')
    : translate(
        'planLimitDescription',
        `${planDisplayName} supports up to ${planConfig.batchSize} rows per batch with ${planConfig.concurrency} concurrent outputs.`,
        {
          plan: planDisplayName,
          batchSize: planConfig.batchSize,
          concurrency: planConfig.concurrency,
        }
      );
  const upgradeFallback = nextPlan
    ? `Need more scale? Upgrade to ${planLabelMap[nextPlan]} for larger batches.`
    : 'You already have the highest concurrency tier.';
  const upgradeMessage = nextPlan
    ? translate('planLimitUpgradeHint', upgradeFallback, { plan: planLabelMap[nextPlan] })
    : translate('planLimitMaxed', upgradeFallback);
  const planLimitHeadingLabel = translate('planLimitHeading', 'Plan throughput limits');
  const planLimitBatchLabel = translate('planLimitBatchSize', 'Rows per batch');
  const planLimitConcurrencyLabel = translate('planLimitConcurrency', 'Concurrent outputs');

  // Calculate dynamic video credit cost based on model, duration, and quality
  const getVideoCreditCost = () => {
    if (videoModel === 'sora-2') {
      return creditsConfig.consumption.videoGeneration[`sora-2-720p-${videoDuration}s`];
    }
    const resolution = videoQuality === 'standard' ? '720p' : '1080p';
    return creditsConfig.consumption.videoGeneration[`sora-2-pro-${resolution}-${videoDuration}s`];
  };
  const [brandInfo, setBrandInfo] = useState<{
    brandName?: string;
    selectedStyle?: string;
    brandTone?: string;
    colors?: { primary: string; secondary: string[] };
  } | null>(null);

  const styles = generationType === 'image' ? IMAGE_STYLES : VIDEO_STYLES;

  // Cache key for localStorage
  const cacheKey = `batch-generation-${generationType}-cache`;

  const getRowPreviewUrl = (row: RowData) => {
    if (row.assetPreviewUrl) {
      return row.assetPreviewUrl;
    }
    if (row.assetUrl?.startsWith('/api/v1/media') && row.assetR2Key) {
      return `/api/v1/media?key=${encodeURIComponent(row.assetR2Key)}`;
    }
    return row.assetUrl;
  };

  const getRowDownloadUrl = (row: RowData) => {
    if (row.assetR2Key) {
      return `/api/v1/media?key=${encodeURIComponent(row.assetR2Key)}&download=1`;
    }
    const preview = getRowPreviewUrl(row);
    if (preview?.startsWith('/api/v1/media')) {
      return `${preview}${preview.includes('?') ? '&' : '?'}download=1`;
    }
    return row.assetUrl || preview || '';
  };

  const hasCompletedAsset = (row: RowData) =>
    row.status === 'completed' && Boolean(getRowPreviewUrl(row));
  const rowsLength = rows.length;

  // Fetch user credits on mount and when user changes
  useEffect(() => {
    const fetchCredits = async () => {
      if (!isAuthenticated) {
        setUserCredits(0);
        return;
      }

      try {
        const response = await fetch('/api/credits/balance', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUserCredits(data.data?.balance || 0);
          console.log('User credits fetched:', data.data?.balance);
        } else {
          console.warn('Failed to fetch credits');
          setUserCredits(0);
        }
      } catch (error) {
        console.error('Error fetching credits:', error);
        setUserCredits(0);
      }
    };

    fetchCredits();
  }, [isAuthenticated]);

  // Load brand analysis from sessionStorage if coming from brand analysis page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedData = sessionStorage.getItem('brandAnalysis');
        if (storedData) {
          const brandData = JSON.parse(storedData);
          setBrandInfo({
            brandName: brandData.brandName,
            selectedStyle: brandData.selectedStyle,
            brandTone: brandData.brandTone,
            colors: brandData.colors,
          });
          console.log('Loaded brand analysis:', brandData.brandName, brandData.selectedStyle);

          // Apply selected style if available
          if (brandData.selectedStyle) {
            const matchedStyle = styles.find(
              (s) => s.name === brandData.selectedStyle || s.name.includes(brandData.selectedStyle)
            );
            if (matchedStyle) {
              setStyle(matchedStyle.id);
              console.log('Applied style from brand analysis:', matchedStyle.id);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load brand analysis from sessionStorage:', error);
      }
    }
  }, [styles]);

  // Load cached data on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        if (data.rows && Array.isArray(data.rows) && data.rows.length > 0) {
          // Check if cache is still valid (within 24 hours)
          const cacheAge = Date.now() - (data.timestamp || 0);
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours

          if (cacheAge < maxAge) {
            setRows(data.rows);
            console.log('Restored cached data:', data.rows.length, 'rows');
          } else {
            // Cache expired, remove it
            localStorage.removeItem(cacheKey);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load cache:', error);
      localStorage.removeItem(cacheKey);
    }
  }, [cacheKey]);

  // Save to cache whenever rows change
  useEffect(() => {
    if (rows.length > 0) {
      try {
        const cacheData = {
          rows,
          fileName: file?.name || '',
          timestamp: Date.now(),
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (error) {
        console.error('Failed to save cache:', error);
      }
    }
  }, [rows, file, cacheKey]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validExtensions = ['.csv', '.xlsx', '.xls'];
      const fileExtension = selectedFile.name
        .substring(selectedFile.name.lastIndexOf('.'))
        .toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        alert(t('uploadCSVOrExcel'));
        return;
      }

      setFile(selectedFile);
      setRows([]);
      setValidationErrors([]);
      setGenerationProgress({ current: 0, total: 0 });
      // Clear cache when new file is selected
      localStorage.removeItem(cacheKey);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const validExtensions = ['.csv', '.xlsx', '.xls'];
      const fileExtension = droppedFile.name
        .substring(droppedFile.name.lastIndexOf('.'))
        .toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        alert(t('uploadCSVOrExcel'));
        return;
      }

      setFile(droppedFile);
      setRows([]);
      setValidationErrors([]);
      setGenerationProgress({ current: 0, total: 0 });
      // Clear cache when new file is dropped
      localStorage.removeItem(cacheKey);
    }
  };

  const triggerFileDialog = () => {
    if (isValidating || isGenerating) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleDropZoneKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      triggerFileDialog();
    }
  };

  const handleValidate = useCallback(async () => {
    if (!file) {
      return;
    }

    setIsValidating(true);
    setValidationErrors([]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('generationType', generationType);

      const response = await fetch('/api/v1/workflow/validate', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '校验失败');
      }

      if (!data.data.valid) {
        setValidationErrors(data.data.errors || []);
        alert(`文件校验失败，发现 ${data.data.errors.length} 个错误`);
        return;
      }

      const rowsPayload: ValidatedRowResponse[] = Array.isArray(data?.data?.rows)
        ? data.data.rows
        : [];

      const validatedRows: RowData[] = rowsPayload.map((row, index) => ({
        rowIndex: index + 1,
        productName: row.productName ?? row.productTitle ?? '',
        productDescription: row.productDescription ?? '',
        prompt: row.prompt ?? '',
        baseImageUrl: row.baseImageUrl,
        productSellingPoints: row.productSellingPoints,
        publishPlatforms: row.publishPlatforms,
        publishMode: row.publishMode,
        productTitle: row.productTitle,
        productCategory: row.productCategory,
        productBrand: row.productBrand,
        productModel: row.productModel,
        productSku: row.productSku,
        productUpc: row.productUpc,
        productCountryOfOrigin: row.productCountryOfOrigin,
        standardPrice: row.standardPrice,
        salePrice: row.salePrice,
        currency: row.currency,
        inventoryQuantity: row.inventoryQuantity,
        minPurchaseQuantity: row.minPurchaseQuantity,
        maxPurchaseQuantity: row.maxPurchaseQuantity,
        productTags: row.productTags,
        generationMode: row.generationMode,
        model: row.model,
        aspectRatio: row.aspectRatio,
        isSelected: true,
        status: 'pending',
      }));

      setRows(validatedRows);
    } catch (error) {
      console.error('Validation error:', error);
      alert(error instanceof Error ? error.message : '校验失败');
    } finally {
      setIsValidating(false);
    }
  }, [file, generationType]);

  // Auto-validate when file is selected
  useEffect(() => {
    if (file && !isValidating && rowsLength === 0) {
      void handleValidate();
    }
  }, [file, handleValidate, isValidating, rowsLength]);

  const handleEnhanceSinglePrompt = async (rowIndex: number) => {
    const row = rows.find((r) => r.rowIndex === rowIndex);
    if (!row || !row.prompt.trim()) {
      alert('请先输入 Prompt');
      return;
    }

    // Update row status to enhancing
    setRows((prev) =>
      prev.map((r) => (r.rowIndex === rowIndex ? { ...r, status: 'enhancing' as const } : r))
    );

    try {
      const response = await fetch('/api/v1/workflow/enhance-single-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: row.prompt,
          productSellingPoints: row.productSellingPoints,
          rowIndex,
          style,
          generationType,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('enhancePromptFailed'));
      }

      // Update row with enhanced prompt
      setRows((prev) =>
        prev.map((r) =>
          r.rowIndex === rowIndex
            ? { ...r, enhancedPrompt: data.data.enhancedPrompt, status: 'enhanced' as const }
            : r
        )
      );
    } catch (error) {
      console.error('Enhancement error:', error);
      alert(error instanceof Error ? error.message : 'Prompt增强失败');
      setRows((prev) =>
        prev.map((r) => (r.rowIndex === rowIndex ? { ...r, status: 'pending' as const } : r))
      );
    }
  };

  const handleEnhanceAllPrompts = async () => {
    if (rows.length === 0) {
      alert('请先校验文件');
      return;
    }

    const rowsToEnhance = rows.filter((row) => row.prompt.trim());
    if (rowsToEnhance.length === 0) {
      alert(t('noPromptToEnhance'));
      return;
    }

    setIsEnhancingAll(true);

    // Update all rows to enhancing status
    setRows((prev) =>
      prev.map((row) => (row.prompt.trim() ? { ...row, status: 'enhancing' as const } : row))
    );

    try {
      const response = await fetch('/api/v1/workflow/enhance-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: rowsToEnhance.map((row) => ({
            rowIndex: row.rowIndex,
            prompt: row.prompt,
            productSellingPoints: row.productSellingPoints,
          })),
          style,
          generationType,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('enhancePromptFailed'));
      }

      // Update rows with enhanced prompts
      const enhancedResponses: EnhancedPromptResponse[] = Array.isArray(data?.data?.enhancedPrompts)
        ? data.data.enhancedPrompts
        : [];
      const enhancedMap = new Map(enhancedResponses.map((ep) => [ep.rowIndex, ep.enhancedPrompt]));

      setRows((prev) =>
        prev.map((row) => ({
          ...row,
          enhancedPrompt: enhancedMap.get(row.rowIndex) || row.enhancedPrompt || row.prompt,
          status: enhancedMap.has(row.rowIndex)
            ? ('enhanced' as const)
            : row.status === 'enhancing'
              ? ('pending' as const)
              : row.status,
        }))
      );
    } catch (error) {
      console.error('Enhancement error:', error);
      alert(error instanceof Error ? error.message : 'Prompt增强失败');
      setRows((prev) =>
        prev.map((row) =>
          row.status === 'enhancing' ? { ...row, status: 'pending' as const } : row
        )
      );
    } finally {
      setIsEnhancingAll(false);
    }
  };

  const handleGenerate = async () => {
    // Get all selected rows, regardless of whether they have enhanced prompts
    const selectedRows = rows.filter((row) => row.isSelected);
    if (selectedRows.length === 0) {
      alert('请选择至少一行进行生成');
      return;
    }

    // Calculate total credit cost
    // Note: For batch generation, we use nano-banana for images and sora-2 for videos
    const creditCostPerItem =
      generationType === 'image'
        ? creditsConfig.consumption.imageGeneration['nano-banana'] || 5
        : creditsConfig.consumption.videoGeneration['sora-2'] || 20;

    const totalCreditCost = selectedRows.length * creditCostPerItem;

    // Check user credits
    console.log('Checking credits:', {
      userCredits,
      totalCreditCost,
      selectedRows: selectedRows.length,
    });

    if (userCredits < totalCreditCost) {
      // Show upgrade prompt
      console.log('Insufficient credits, showing upgrade prompt');
      openUpgradePrompt();
      // Store the generation request for later (if user clicks continue)
      return;
    }

    // Proceed with generation
    await proceedWithGeneration(selectedRows);
  };

  const proceedWithGeneration = async (selectedRows: RowData[]) => {
    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: selectedRows.length });

    // Update rows to generating status with initial progress
    setRows((prev) =>
      prev.map((row) =>
        row.isSelected ? { ...row, status: 'generating' as const, progress: 0 } : row
      )
    );

    // Start progress simulation for each generating row
    selectedRows.forEach((row) => {
      simulateRowProgress(row.rowIndex);
    });

    try {
      const response = await fetch('/api/v1/workflow/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: selectedRows.map((row) => ({
            rowIndex: row.rowIndex,
            productName: row.productName,
            productDescription: row.productDescription,
            prompt: row.prompt,
            // Use enhanced prompt if available, otherwise use original prompt
            enhancedPrompt: row.enhancedPrompt || row.prompt,
            baseImageUrl: row.baseImageUrl,
            productSellingPoints: row.productSellingPoints,
          })),
          generationType,
          mode: generationMode,
          aspectRatio,
          style,
          // Image-specific parameters
          ...(generationType === 'image' && {
            outputFormat: outputFormat.toLowerCase(), // 'png' or 'jpeg'
            model: 'nano-banana', // Fixed model for images
          }),
          // Video-specific parameters
          ...(generationType === 'video' && {
            model: videoModel, // 'sora-2' or 'sora-2-pro'
            duration: videoDuration, // 10 or 15
            quality: videoModel === 'sora-2-pro' ? videoQuality : 'standard', // 'standard' or 'high'
          }),
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('batchGenerationFailed'));
      }

      startPolling(data.data.jobId, selectedRows.length);
    } catch (error) {
      console.error('Generation error:', error);
      alert(error instanceof Error ? error.message : t('batchGenerationFailed'));
      setRows((prev) =>
        prev.map((row) => (row.isSelected ? { ...row, status: 'pending' as const } : row))
      );
      setIsGenerating(false);
    }
  };

  const handleContinueWithLimitedCredits = async () => {
    closeUpgradePrompt();

    // Get all selected rows
    const selectedRows = rows.filter((row) => row.isSelected);
    if (selectedRows.length === 0) return;

    // Calculate credit cost per item
    // Note: For batch generation, we use nano-banana for images and sora-2 for videos
    const creditCostPerItem =
      generationType === 'image'
        ? creditsConfig.consumption.imageGeneration['nano-banana'] || 5
        : creditsConfig.consumption.videoGeneration['sora-2'] || 20;

    // Calculate how many items can be generated with available credits
    const maxAffordableItems = Math.floor(userCredits / creditCostPerItem);

    if (maxAffordableItems === 0) {
      alert('积分不足，无法生成任何内容');
      return;
    }

    // Limit rows to what can be afforded
    const affordableRows = selectedRows.slice(0, maxAffordableItems);

    if (affordableRows.length < selectedRows.length) {
      const confirmMessage = `您的积分只能生成 ${affordableRows.length} 个内容（共选择了 ${selectedRows.length} 个）。是否继续？`;
      if (!confirm(confirmMessage)) {
        return;
      }
    }

    await proceedWithGeneration(affordableRows);
  };

  // Simulate progress for a single row
  const simulateRowProgress = (rowIndex: number) => {
    // Clear any existing intervals for this row
    const existingIntervals = progressIntervalsRef.current.get(rowIndex);
    if (existingIntervals) {
      existingIntervals.forEach((interval) => clearInterval(interval));
    }

    const intervals: NodeJS.Timeout[] = [];

    const progressInterval = setInterval(() => {
      setRows((prev) =>
        prev.map((row) => {
          if (row.rowIndex === rowIndex && row.status === 'generating') {
            // Increment progress gradually, but don't exceed 90% until actually completed
            const currentProgress = row.progress || 0;
            const newProgress = Math.min(currentProgress + Math.random() * 8 + 2, 90);
            return { ...row, progress: Math.round(newProgress) };
          }
          return row;
        })
      );
    }, 1500); // Update every 1.5 seconds
    intervals.push(progressInterval);

    // Clear interval when row is completed or failed
    const checkInterval = setInterval(() => {
      setRows((prev) => {
        const row = prev.find((r) => r.rowIndex === rowIndex);
        if (row && row.status !== 'generating') {
          intervals.forEach((interval) => clearInterval(interval));
          progressIntervalsRef.current.delete(rowIndex);
        }
        return prev;
      });
    }, 500);
    intervals.push(checkInterval);

    progressIntervalsRef.current.set(rowIndex, intervals);
  };

  const startPolling = (jobId: string, totalRows: number) => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const interval = setInterval(async () => {
      try {
        const [statusResponse, assetsResponse] = await Promise.all([
          fetch(`/api/v1/workflow/batch/${jobId}/results`, { credentials: 'include' }),
          fetch(`/api/v1/workflow/batch/${jobId}/assets`, { credentials: 'include' }),
        ]);

        const statusData = await statusResponse.json();
        const assetsData = await assetsResponse.json();

        // Update rows with asset URLs and status
        if (assetsData.success && assetsData.data?.assets) {
          const assetList: AssetResponse[] = Array.isArray(assetsData.data.assets)
            ? assetsData.data.assets
            : [];
          let completedCount = 0;
          let processingCount = 0;

          setRows((prev) =>
            prev.map((row) => {
              const asset =
                assetList.find((a) => a.rowIndex === row.rowIndex) ||
                assetList.find(
                  (a) => a.prompt === row.prompt || a.enhancedPrompt === row.enhancedPrompt
                );
              if (asset) {
                if (asset.status === 'completed') {
                  completedCount++;
                  // Set progress to 100% when completed
                  return {
                    ...row,
                    status: 'completed' as const,
                    assetUrl: asset.publicUrl || asset.url,
                    assetPreviewUrl: asset.previewUrl || asset.publicUrl || asset.url,
                    assetR2Key: asset.r2Key || undefined,
                    error: asset.error,
                    progress: 100,
                  };
                }
                if (asset.status === 'failed') {
                  return {
                    ...row,
                    status: 'failed' as const,
                    assetUrl: asset.publicUrl || asset.url,
                    assetPreviewUrl: asset.previewUrl || asset.publicUrl || asset.url,
                    assetR2Key: asset.r2Key || undefined,
                    error: asset.error,
                    progress: 0,
                  };
                }
                if (asset.status === 'processing') {
                  processingCount++;
                  // Keep progress simulation running for processing assets
                  // Don't update status or progress here, let simulateRowProgress handle it
                  return row;
                }
              }
              return row;
            })
          );

          console.log(
            `Batch progress: ${completedCount} completed, ${processingCount} processing, total: ${totalRows}`
          );
          setGenerationProgress({ current: completedCount, total: totalRows });
        }

        if (statusData.success && statusData.data.jobStatus === 'completed') {
          setIsGenerating(false);
          clearInterval(interval);
          setPollingInterval(null);

          // Refresh user credits after generation completes
          try {
            const creditsResponse = await fetch('/api/credits/balance', {
              credentials: 'include',
            });
            if (creditsResponse.ok) {
              const creditsData = await creditsResponse.json();
              setUserCredits(creditsData.data?.balance || 0);
              console.log('Credits refreshed after generation:', creditsData.data?.balance);
            }
          } catch (error) {
            console.error('Error refreshing credits:', error);
          }
        } else if (statusData.success && statusData.data.jobStatus === 'failed') {
          setIsGenerating(false);
          clearInterval(interval);
          setPollingInterval(null);
          setRows((prev) =>
            prev.map((row) =>
              row.status === 'generating'
                ? { ...row, status: 'failed' as const, error: 'Job failed' }
                : row
            )
          );
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);

    setPollingInterval(interval);
  };

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      // Clean up all progress intervals
      progressIntervalsRef.current.forEach((intervals) => {
        intervals.forEach((interval) => clearInterval(interval));
      });
      progressIntervalsRef.current.clear();
    };
  }, [pollingInterval]);

  const handleDownloadTemplate = async (format: 'excel' | 'csv') => {
    try {
      const response = await fetch(
        `/api/v1/workflow/template/download?format=${format}&generationType=${generationType}`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch-${generationType}-generation-template.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download template error:', error);
      alert(t('downloadTemplateFailed'));
    }
  };

  const handleDownloadResults = () => {
    if (rows.length === 0) return;

    // Download template with all original fields plus enhanced prompt and generated URLs
    const headers = [
      'productName',
      'productDescription',
      'prompt',
      'baseImageUrl',
      'productSellingPoints',
      'enhancedPrompt',
      generationType === 'image' ? 'generatedImageUrl' : 'generatedVideoUrl',
      'generatedAssetUrl', // Unified field for both image and video
    ];

    const data = rows.map((row) => [
      row.productName || '',
      row.productDescription || '',
      row.prompt,
      row.baseImageUrl || '',
      row.productSellingPoints || '',
      row.enhancedPrompt || '',
      row.assetUrl || '',
      row.assetUrl || '', // Unified asset URL
    ]);

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // Set column widths
    const colWidths = [
      { wch: 30 }, // productName
      { wch: 50 }, // productDescription
      { wch: 50 }, // prompt
      { wch: 50 }, // baseImageUrl
      { wch: 40 }, // productSellingPoints
      { wch: 50 }, // enhancedPrompt
      { wch: 50 }, // generatedImageUrl/generatedVideoUrl
      { wch: 50 }, // generatedAssetUrl
    ];
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Batch Results');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-results-${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Get completed assets for display
  // Calculate statistics
  const totalRows = rows.length;
  const completedCount = rows.filter((r) => r.status === 'completed').length;
  const failedCount = rows.filter((r) => r.status === 'failed').length;
  const generatingCount = rows.filter((r) => r.status === 'generating').length;
  const pendingCount = rows.filter((r) => r.status === 'pending' || !r.status).length;

  return (
    <div className="space-y-6">
      {/* Brand Info Banner (if from brand analysis) */}
      {brandInfo && (
        <Card className="border border-teal-200 bg-slate-50 dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-teal-100">
                    <Sparkles className="size-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {t('brandContext') || '品牌上下文已应用'}
                    </h3>
                    <p className="text-sm text-slate-700 font-medium">{brandInfo.brandName}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {brandInfo.selectedStyle && (
                    <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-200 border border-teal-200">
                      <Zap className="size-3 mr-1" />
                      {t('selectedStyle') || '风格'}: {brandInfo.selectedStyle}
                    </Badge>
                  )}
                  {brandInfo.brandTone && (
                    <Badge className="bg-teal-100 dark:bg-teal-900/30 text-slate-700 dark:text-slate-300 hover:bg-teal-200 border border-teal-200 dark:border-teal-800">
                      {t('brandTone') || '品牌调性'}:{' '}
                      {typeof brandInfo.brandTone === 'string'
                        ? brandInfo.brandTone
                        : brandInfo.brandTone?.slice(0, 3).join('、')}
                    </Badge>
                  )}
                  {brandInfo.colors?.primary && (
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200">
                      <div
                        className="w-3 h-3 rounded-full mr-1 border border-slate-300"
                        style={{ backgroundColor: brandInfo.colors.primary }}
                      />
                      {t('primaryColor') || '主色调'}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBrandInfo(null);
                  sessionStorage.removeItem('brandAnalysis');
                }}
                className="text-slate-600 hover:text-slate-900"
              >
                <XCircle className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {generationType === 'image' ? t('titleImage') : t('titleVideo')}
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  {generationType === 'image' ? t('subtitleImage') : t('subtitleVideo')}
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-white/80 dark:bg-slate-900/60 shadow-inner space-y-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {planLimitHeadingLabel}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {planDisplayName}
                      </Badge>
                      {subscriptionLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {planConfig.batchSize}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {planLimitBatchLabel}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {planConfig.concurrency}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {planLimitConcurrencyLabel}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{planLimitsDescription}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{upgradeMessage}</p>
              </div>

              {/* Generation Settings */}
              <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">{t('generationMode')}</Label>
                    <Select
                      value={generationMode}
                      onValueChange={(value) => setGenerationMode(value as typeof generationMode)}
                      disabled={isGenerating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {generationType === 'image' ? (
                          <>
                            <SelectItem value="t2i">{t('t2i')}</SelectItem>
                            <SelectItem value="i2i">{t('i2i')}</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="t2v">{t('t2v')}</SelectItem>
                            <SelectItem value="i2v">{t('i2v')}</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">{t('aspectRatio')}</Label>
                    <Select
                      value={aspectRatio}
                      onValueChange={setAspectRatio}
                      disabled={isGenerating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {generationType === 'image' ? (
                          <>
                            <SelectItem value="1:1">{t('aspectRatio1:1')}</SelectItem>
                            <SelectItem value="16:9">{t('aspectRatio16:9')}</SelectItem>
                            <SelectItem value="9:16">{t('aspectRatio9:16')}</SelectItem>
                            <SelectItem value="4:3">{t('aspectRatio4:3')}</SelectItem>
                            <SelectItem value="3:4">{t('aspectRatio3:4')}</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="16:9">{t('aspectRatio16:9')}</SelectItem>
                            <SelectItem value="9:16">{t('aspectRatio9:16')}</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    {generationType === 'image' ? t('imageStyle') : t('videoStyle')}
                  </Label>
                  <Select value={style} onValueChange={setStyle} disabled={isGenerating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {styles.map((s) => (
                        <SelectItem key={s.id} value={s.id} title={s.description}>
                          {generationType === 'image'
                            ? t(`imageStyles.${s.id}`)
                            : t(`videoStyles.${s.id}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Image-specific settings */}
                {generationType === 'image' && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Output Format</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setOutputFormat('PNG')}
                        disabled={isGenerating}
                        className={`flex items-center justify-center rounded-lg border-2 py-2.5 px-4 text-sm font-medium transition-all ${
                          outputFormat === 'PNG'
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-slate-700 dark:text-slate-300'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-teal-400 dark:border-teal-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <span>PNG</span>
                        {outputFormat === 'PNG' && (
                          <svg
                            className="ml-2 h-4 w-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            role="img"
                            aria-label={t('selected') || 'Selected'}
                          >
                            <title>{t('selected') || 'Selected'}</title>
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
                        disabled={isGenerating}
                        className={`flex items-center justify-center rounded-lg border-2 py-2.5 px-4 text-sm font-medium transition-all ${
                          outputFormat === 'JPEG'
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-slate-700 dark:text-slate-300'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-teal-400 dark:border-teal-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <span>JPEG</span>
                        {outputFormat === 'JPEG' && (
                          <svg
                            className="ml-2 h-4 w-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            role="img"
                            aria-label={t('selected') || 'Selected'}
                          >
                            <title>{t('selected') || 'Selected'}</title>
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

                {/* Video-specific settings */}
                {generationType === 'video' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">{t('model')}</Label>
                        <Select
                          value={videoModel}
                          onValueChange={(value) => {
                            setVideoModel(value as 'sora-2' | 'sora-2-pro');
                            if (value === 'sora-2') {
                              setVideoQuality('standard');
                            }
                          }}
                          disabled={isGenerating}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sora-2">
                              Sora 2 -{' '}
                              {videoModel === 'sora-2'
                                ? getVideoCreditCost()
                                : creditsConfig.consumption.videoGeneration[
                                    `sora-2-720p-${videoDuration}s`
                                  ]}{' '}
                              credits
                            </SelectItem>
                            <SelectItem value="sora-2-pro">
                              Sora 2 Pro -{' '}
                              {videoModel === 'sora-2-pro'
                                ? getVideoCreditCost()
                                : creditsConfig.consumption.videoGeneration[
                                    `sora-2-pro-${videoQuality === 'standard' ? '720p' : '1080p'}-${videoDuration}s`
                                  ]}{' '}
                              credits
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">{t('duration')}</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setVideoDuration(10)}
                            disabled={isGenerating}
                            className={`flex items-center justify-center rounded-lg border-2 py-2 px-3 text-sm font-medium transition-all ${
                              videoDuration === 10
                                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-slate-700 dark:text-slate-300'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-teal-400 dark:border-teal-600'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            10s
                          </button>
                          <button
                            type="button"
                            onClick={() => setVideoDuration(15)}
                            disabled={isGenerating}
                            className={`flex items-center justify-center rounded-lg border-2 py-2 px-3 text-sm font-medium transition-all ${
                              videoDuration === 15
                                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-slate-700 dark:text-slate-300'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-teal-400 dark:border-teal-600'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            15s
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quality selector - only for Sora 2 Pro */}
                    {videoModel === 'sora-2-pro' && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block">{t('quality')}</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setVideoQuality('standard')}
                            disabled={isGenerating}
                            className={`flex items-center justify-center rounded-lg border-2 py-2.5 px-4 text-sm font-medium transition-all ${
                              videoQuality === 'standard'
                                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-slate-700 dark:text-slate-300'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-teal-400 dark:border-teal-600'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <span>Standard (720P)</span>
                            {videoQuality === 'standard' && (
                              <svg
                                className="ml-2 h-4 w-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                role="img"
                                aria-label={t('selected') || 'Selected'}
                              >
                                <title>{t('selected') || 'Selected'}</title>
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
                            onClick={() => setVideoQuality('high')}
                            disabled={isGenerating}
                            className={`flex items-center justify-center rounded-lg border-2 py-2.5 px-4 text-sm font-medium transition-all ${
                              videoQuality === 'high'
                                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-slate-700 dark:text-slate-300'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-teal-400 dark:border-teal-600'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <span>High (1080P)</span>
                            {videoQuality === 'high' && (
                              <svg
                                className="ml-2 h-4 w-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                role="img"
                                aria-label={t('selected') || 'Selected'}
                              >
                                <title>{t('selected') || 'Selected'}</title>
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
                  </>
                )}
              </div>

              {/* Template Download */}
              <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900">
                <Label className="text-sm font-medium mb-3 block">{t('downloadTemplate')}</Label>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadTemplate('excel')}
                    className="flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    {t('downloadExcel')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadTemplate('csv')}
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    {t('downloadCSV')}
                  </Button>
                </div>
              </div>

              {/* I2V Restriction Warning */}
              {generationMode === 'i2v' && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-900 text-sm mb-1">
                        {t('importantNotice')}
                      </h4>
                      <p className="text-amber-800 text-xs leading-relaxed">{t('i2vWarning')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* File Upload */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-input" className="text-sm font-medium mb-2 block">
                    {t('uploadFile')}
                  </Label>
                  <button
                    type="button"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={(event) => {
                      event.preventDefault();
                      triggerFileDialog();
                    }}
                    onKeyDown={handleDropZoneKeyDown}
                    aria-label={
                      file
                        ? `${t('fileSelected') || 'Selected file'}: ${file.name}`
                        : t('clickToUpload') || 'Upload file'
                    }
                    className={`
                      relative w-full rounded-xl border-2 border-dashed transition-all duration-300
                      ${
                        isDragging
                          ? 'border-teal-500 dark:border-teal-600 bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 scale-[1.02]'
                          : 'border-teal-300 dark:border-teal-700 bg-gradient-to-br from-teal-50/50 to-blue-50/50 dark:from-teal-900/10 dark:to-blue-900/10 hover:border-teal-400 dark:hover:border-teal-600 hover:from-teal-50 dark:hover:from-teal-900/20 hover:to-blue-50 dark:hover:to-blue-900/20'
                      }
                      ${file ? 'border-teal-500 dark:border-teal-600 bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20' : ''}
                    `}
                  >
                    <div className="p-8 text-center">
                      <Upload
                        className={`mx-auto mb-3 h-12 w-12 ${isDragging || file ? 'text-teal-500 dark:text-teal-400' : 'text-teal-400 dark:text-teal-500'}`}
                      />
                      {file ? (
                        <>
                          <p className="text-sm font-medium text-teal-700 dark:text-teal-400 mb-1">
                            {t('fileSelected')}: {file.name}
                          </p>
                          <p className="text-xs text-teal-600 dark:text-teal-400">
                            {(file.size / 1024).toFixed(2)} KB
                            {isValidating && ` - ${t('validating')}`}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFile(null);
                              setRows([]);
                              setValidationErrors([]);
                              setGenerationProgress({ current: 0, total: 0 });
                              localStorage.removeItem(cacheKey);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                          >
                            {t('reselectFile')}
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-teal-700 dark:text-teal-400 mb-1">
                            {t('clickToUpload')}
                          </p>
                          <p className="text-xs text-teal-600 dark:text-teal-400">{t('fileTypes')}</p>
                        </>
                      )}
                    </div>
                  </button>
                  <input
                    ref={fileInputRef}
                    id="file-input"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    disabled={isValidating || isGenerating}
                    className="hidden"
                  />
                </div>

                {validationErrors.length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <h4 className="font-medium text-red-800 mb-2">{t('validationErrors')}</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {validationErrors.slice(0, 10).map((error, index) => (
                        <li key={`${error.row}-${error.field}-${index}`}>
                          {t('row')} {error.row} {t('rows')}, {error.field}: {error.message}
                        </li>
                      ))}
                      {validationErrors.length > 10 && (
                        <li>
                          ...{validationErrors.length - 10} {t('moreErrors')}
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Summary Statistics - 1/3 width */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-6">
            <h3 className="text-lg font-semibold mb-4">{t('summary')}</h3>

            {/* Overall Statistics */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-200">
                  <div className="text-2xl font-bold text-slate-700">{totalRows}</div>
                  <div className="text-xs text-slate-600 mt-1">{t('total')}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-200">
                  <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                  <div className="text-xs text-slate-600 mt-1">{t('completed')}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-200">
                  <div className="text-2xl font-bold text-amber-600">{generatingCount}</div>
                  <div className="text-xs text-slate-600 mt-1">{t('generatingStatus')}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-200">
                  <div className="text-2xl font-bold text-red-600">{failedCount}</div>
                  <div className="text-xs text-slate-600 mt-1">{t('failed')}</div>
                </div>
              </div>

              {/* Overall Progress */}
              {isGenerating && generationProgress.total > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      {t('overallProgress')}
                    </span>
                    <span className="font-medium">
                      {generationProgress.current} / {generationProgress.total}
                    </span>
                  </div>
                  <Progress
                    value={(generationProgress.current / generationProgress.total) * 100}
                    className="h-2"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    {Math.round((generationProgress.current / generationProgress.total) * 100)}%{' '}
                    {t('completedPercentage')}
                  </p>
                </div>
              )}

              {/* Completion Rate */}
              {totalRows > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-600 dark:text-slate-400">
                      {t('completionRate')}
                    </span>
                    <span className="font-medium">
                      {Math.round((completedCount / totalRows) * 100)}%
                    </span>
                  </div>
                  <Progress value={(completedCount / totalRows) * 100} className="h-2" />
                </div>
              )}

              {/* Status Breakdown */}
              <div className="pt-2 border-t space-y-2">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('statusDistribution')}
                </h4>
                <div className="space-y-1.5">
                  {completedCount > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-slate-600 dark:text-slate-400">{t('completed')}</span>
                      </div>
                      <span className="font-medium">{completedCount}</span>
                    </div>
                  )}
                  {generatingCount > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                        <span className="text-slate-600 dark:text-slate-400">
                          {t('generatingStatus')}
                        </span>
                      </div>
                      <span className="font-medium">{generatingCount}</span>
                    </div>
                  )}
                  {failedCount > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-3 h-3 text-red-500" />
                        <span className="text-slate-600 dark:text-slate-400">{t('failed')}</span>
                      </div>
                      <span className="font-medium">{failedCount}</span>
                    </div>
                  )}
                  {pendingCount > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Upload className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span className="text-slate-600 dark:text-slate-400">{t('waiting')}</span>
                      </div>
                      <span className="font-medium">{pendingCount}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              {completedCount > 0 && (
                <div className="pt-2 border-t">
                  <Button onClick={handleDownloadResults} className="w-full" variant="default">
                    <Download className="w-4 h-4 mr-2" />
                    {t('downloadAllResults')}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Data Preview and Generated Assets Display - Full Width */}
      {rows.length > 0 && (
        <div className="w-full">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-lg">
                    {t('dataPreview')} ({rows.length} {t('rows')})
                  </h3>
                  {!file && (
                    <p className="text-xs text-teal-600 mt-1">📦 {t('recoveredFromCache')}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (
                        confirm(
                          generationType === 'image'
                            ? '确定要清除所有数据并重新开始吗？'
                            : '确定要清除所有数据并重新开始吗？'
                        )
                      ) {
                        setFile(null);
                        setRows([]);
                        setValidationErrors([]);
                        setGenerationProgress({ current: 0, total: 0 });
                        localStorage.removeItem(cacheKey);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                        // Clear all progress intervals
                        progressIntervalsRef.current.forEach((intervals) => {
                          intervals.forEach((interval) => clearInterval(interval));
                        });
                        progressIntervalsRef.current.clear();
                        if (pollingInterval) {
                          clearInterval(pollingInterval);
                          setPollingInterval(null);
                        }
                        setIsGenerating(false);
                        setIsEnhancingAll(false);
                      }
                    }}
                    disabled={isGenerating}
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {t('clearAndReset') || t('resetAndReupload')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleEnhanceAllPrompts}
                    disabled={
                      isEnhancingAll ||
                      rows.some((r) => r.status === 'enhancing') ||
                      rows.length === 0
                    }
                  >
                    {isEnhancingAll ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('generating')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        {t('enhanceAllPrompts')}
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      setRows((prev) => prev.map((row) => ({ ...row, isSelected: true })))
                    }
                  >
                    {t('selectAll')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setRows((prev) => prev.map((row) => ({ ...row, isSelected: false })))
                    }
                  >
                    {t('deselectAll')}
                  </Button>
                </div>
              </div>

              {/* Generation Progress */}
              {isGenerating && generationProgress.total > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>生成进度</span>
                    <span>
                      {generationProgress.current} / {generationProgress.total}
                    </span>
                  </div>
                  <Progress value={(generationProgress.current / generationProgress.total) * 100} />
                </div>
              )}

              <div className="space-y-4">
                {rows.map((row) => (
                  <div
                    key={row.rowIndex}
                    className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                      {/* Left: Product Information */}
                      <div className="p-6 bg-white dark:bg-slate-900 flex flex-col min-h-[500px]">
                        <div className="flex items-start gap-3 mb-4">
                          <Checkbox
                            checked={row.isSelected}
                            onCheckedChange={(checked) =>
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.rowIndex === row.rowIndex
                                    ? { ...r, isSelected: checked === true }
                                    : r
                                )
                              )
                            }
                            disabled={row.status === 'generating' || row.status === 'completed'}
                          />
                          <div className="flex-1 space-y-3">
                            {row.productName && (
                              <div>
                                <Label className="text-xs text-slate-500 dark:text-slate-400">
                                  {t('productName')}
                                </Label>
                                <p className="text-sm font-medium">{row.productName}</p>
                              </div>
                            )}
                            {row.productDescription && (
                              <div>
                                <Label className="text-xs text-slate-500 dark:text-slate-400">
                                  {t('productDescription')}
                                </Label>
                                <p className="text-sm">{row.productDescription}</p>
                              </div>
                            )}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <Label className="text-xs text-slate-500 dark:text-slate-400">
                                  {t('originalPrompt')} ({t('rowNumber')} {row.rowIndex})
                                </Label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const textarea = document.getElementById(
                                      `prompt-${row.rowIndex}`
                                    ) as HTMLTextAreaElement;
                                    if (textarea) {
                                      textarea.select();
                                      textarea.focus();
                                    }
                                  }}
                                >
                                  {t('selectAll')}
                                </Button>
                              </div>
                              <div className="relative">
                                <Textarea
                                  id={`prompt-${row.rowIndex}`}
                                  value={row.prompt}
                                  onChange={(e) =>
                                    setRows((prev) =>
                                      prev.map((r) =>
                                        r.rowIndex === row.rowIndex
                                          ? { ...r, prompt: e.target.value }
                                          : r
                                      )
                                    )
                                  }
                                  onSelect={(e) => {
                                    // Allow text selection
                                    e.stopPropagation();
                                  }}
                                  className="text-sm min-h-[80px] pr-28 select-text"
                                  disabled={row.status === 'generating'}
                                />
                                <Button
                                  onClick={() => handleEnhanceSinglePrompt(row.rowIndex)}
                                  disabled={
                                    row.status === 'enhancing' ||
                                    row.status === 'generating' ||
                                    !row.prompt.trim()
                                  }
                                  size="sm"
                                  className="absolute right-2 bottom-2 bg-gradient-to-br from-teal-50 to-blue-50 border-teal-300 text-teal-700 hover:from-teal-100 hover:to-blue-100 hover:border-teal-400"
                                >
                                  {row.status === 'enhancing' ? (
                                    <>
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                      {t('generating')}
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-3 h-3 mr-1" />
                                      {t('enhance')}
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div className="flex-1 flex flex-col mt-auto">
                              <div className="flex items-center justify-between mb-1">
                                <Label className="text-xs text-slate-500 dark:text-slate-400">
                                  {t('enhancePrompt')}
                                </Label>
                                {row.enhancedPrompt && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const textarea = document.getElementById(
                                        `enhanced-prompt-${row.rowIndex}`
                                      ) as HTMLTextAreaElement;
                                      if (textarea) {
                                        textarea.select();
                                        textarea.focus();
                                      }
                                    }}
                                  >
                                    {t('selectAll')}
                                  </Button>
                                )}
                              </div>
                              <Textarea
                                id={`enhanced-prompt-${row.rowIndex}`}
                                value={row.enhancedPrompt || ''}
                                onChange={(e) =>
                                  setRows((prev) =>
                                    prev.map((r) =>
                                      r.rowIndex === row.rowIndex
                                        ? { ...r, enhancedPrompt: e.target.value }
                                        : r
                                    )
                                  )
                                }
                                onSelect={(e) => {
                                  // Allow text selection
                                  e.stopPropagation();
                                }}
                                className="text-sm flex-1 select-text resize-none"
                                disabled={row.status === 'generating'}
                                placeholder={t('enhancePromptPlaceholder')}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Generated Asset Display */}
                      <div className="p-6 bg-slate-50 dark:bg-slate-900 border-l lg:border-l lg:border-t-0 border-t flex items-center justify-center min-h-[500px]">
                        {row.status === 'completed' && row.assetUrl ? (
                          <div className="group relative w-full max-w-md">
                            <div className="relative aspect-square bg-white dark:bg-slate-900 rounded-lg overflow-hidden border shadow-sm">
                              {generationType === 'image' ? (
                                <img
                                  src={getRowPreviewUrl(row) || row.assetUrl || ''}
                                  alt={`Generated ${row.rowIndex}`}
                                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <video
                                  src={getRowPreviewUrl(row) || row.assetUrl || ''}
                                  controls
                                  className="w-full h-full object-contain"
                                >
                                  <track
                                    kind="captions"
                                    src="data:text/vtt,WEBVTT"
                                    label="captions"
                                  />
                                  您的浏览器不支持视频播放
                                </video>
                              )}

                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setPreviewAsset({
                                      url: getRowPreviewUrl(row) || row.assetUrl || '',
                                      type: generationType,
                                      rowIndex: row.rowIndex,
                                    });
                                  }}
                                  className="bg-white dark:bg-slate-900/90 hover:bg-white dark:bg-slate-900"
                                >
                                  <Maximize2 className="w-4 h-4 mr-1" />
                                  {t('preview')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    const downloadUrl = getRowDownloadUrl(row);
                                    if (!downloadUrl) return;
                                    const a = document.createElement('a');
                                    a.href = downloadUrl;
                                    a.download = `${row.productName || `generated-${row.rowIndex}`}-${Date.now()}.${generationType === 'image' ? 'jpg' : 'mp4'}`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                  }}
                                  className="bg-white dark:bg-slate-900/90 hover:bg-white dark:bg-slate-900"
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  {t('download')}
                                </Button>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                {t('generationComplete')}
                              </span>
                            </div>
                          </div>
                        ) : row.status === 'generating' ? (
                          <div className="flex flex-col items-center justify-center w-full max-w-md space-y-4">
                            <div className="relative aspect-square w-full bg-white dark:bg-slate-900 rounded-lg border shadow-sm flex items-center justify-center">
                              <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                            </div>
                            <div className="space-y-2 w-full">
                              <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                                <span>生成中...</span>
                                {row.progress !== undefined && (
                                  <span className="font-medium">{row.progress}%</span>
                                )}
                              </div>
                              {row.progress !== undefined && (
                                <Progress value={row.progress} className="h-2" />
                              )}
                            </div>
                          </div>
                        ) : row.status === 'failed' ? (
                          <div className="flex flex-col items-center justify-center w-full max-w-md space-y-3">
                            <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800 rounded-lg border flex items-center justify-center">
                              <XCircle className="w-12 h-12 text-red-500" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-red-600 font-medium">
                                {t('generationFailed')}
                              </p>
                              {row.error && (
                                <p className="text-xs text-red-500 mt-1 max-w-xs">{row.error}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center w-full max-w-md text-slate-400 dark:text-slate-500">
                            <div className="relative aspect-square w-full bg-slate-50 dark:bg-slate-900 rounded-lg border-2 border-dashed flex items-center justify-center">
                              <Upload className="w-12 h-12 opacity-50" />
                            </div>
                            <p className="text-sm mt-3 text-center">{t('waiting')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {rows.some((r) => r.status === 'enhanced' || r.status === 'completed') && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || rows.filter((r) => r.isSelected).length === 0}
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('generating')}
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {t('startBatchGeneration')} ({rows.filter((r) => r.isSelected).length}{' '}
                        {t('rowsSelected')})
                        {rows.filter((r) => r.isSelected && r.enhancedPrompt).length > 0 && (
                          <span className="text-xs text-teal-600 ml-1">
                            ({rows.filter((r) => r.isSelected && r.enhancedPrompt).length}{' '}
                            {t('enhanced')})
                          </span>
                        )}
                      </>
                    )}
                  </Button>
                  {rows.some(hasCompletedAsset) && (
                    <Button onClick={handleDownloadResults}>
                      <Download className="w-4 h-4 mr-2" />
                      {t('downloadResults')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewAsset} onOpenChange={(open) => !open && setPreviewAsset(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {t('previewTitle')} -{' '}
              {previewAsset?.type === 'image' ? t('imageStyle') : t('videoStyle')} ({t('rowNumber')}{' '}
              {previewAsset?.rowIndex})
            </DialogTitle>
          </DialogHeader>
          {previewAsset && (
            <div className="mt-4">
              {previewAsset.type === 'image' ? (
                <img src={previewAsset.url} alt="Preview" className="w-full rounded-lg" />
              ) : (
                <video src={previewAsset.url} controls className="w-full rounded-lg">
                  <track kind="captions" src="data:text/vtt,WEBVTT" label="captions" />
                  {t('browserNotSupportVideo')}
                </video>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upgrade Prompt */}
      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={closeUpgradePrompt}
        onContinue={handleContinueWithLimitedCredits}
        feature={generationType === 'image' ? 'imageGeneration' : 'videoGeneration'}
        creditsUsed={userCredits}
        creditsLimit={0}
        showContinueButton={true}
      />
    </div>
  );
}
