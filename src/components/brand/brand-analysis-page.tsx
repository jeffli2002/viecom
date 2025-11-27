'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/store/auth-store';
import {
  Award,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Globe,
  Heart,
  Image as ImageIcon,
  Lightbulb,
  Loader2,
  MessageSquare,
  Palette,
  Sparkles,
  Star,
  Tag,
  Target,
  TrendingUp,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface BrandAnalysisResult {
  brandName?: string;
  website: string;
  productCategory: string[];
  brandTone: string;
  brandVoice: string;
  colors: {
    primary: string;
    secondary: string[];
    accent?: string;
  };
  styleKeywords: string[];
  targetAudience: string;
  audienceAge?: string;
  audienceIncome?: string;
  brandPersonality: string[];
  contentThemes: string[];
  visualStyle?: {
    photography: string;
    layout: string;
    typography: string;
  };
  competitiveAdvantage?: string[];
  recommendedImageStyles?: string[];
  recommendedVideoStyles?: string[];
  audienceSegments?: string[];
  metadata: {
    title: string;
    description: string;
    language: string;
  };
  socialMediaTone?: string;
  marketingFocus?: string[];
}

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

const getValidHexColor = (color?: string | null): string | null => {
  if (!color) return null;

  const normalized = color.trim();
  if (
    normalized === '' ||
    normalized.toLowerCase() === 'null' ||
    normalized.toLowerCase() === 'undefined'
  ) {
    return null;
  }

  return HEX_COLOR_REGEX.test(normalized) ? normalized.toUpperCase() : null;
};

const extractLogoDominantColor = async (website?: string): Promise<string | null> => {
  if (!website) return null;

  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    const faviconUrl = `https://www.google.com/s2/favicons?sz=256&domain_url=${encodeURIComponent(url.origin)}`;

    return await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.referrerPolicy = 'no-referrer';
      img.src = faviconUrl;

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const width = Math.max(img.width, 16);
          const height = Math.max(img.height, 16);
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d');

          if (!context) {
            resolve(null);
            return;
          }

          context.drawImage(img, 0, 0);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          let r = 0;
          let g = 0;
          let b = 0;
          let count = 0;

          for (let offset = 0; offset < data.length; offset += 4) {
            if (offset + 3 >= data.length) break;
            const alpha = data[offset + 3] ?? 255;
            if (alpha < 128) continue; // Skip nearly transparent pixels

            r += data[offset] ?? 0;
            g += data[offset + 1] ?? 0;
            b += data[offset + 2] ?? 0;
            count += 1;
          }

          if (count === 0) {
            resolve(null);
            return;
          }

          const average = (value: number) => Math.round(value / count);
          const toHex = (value: number) => value.toString(16).padStart(2, '0').toUpperCase();
          const hex = `#${toHex(average(r))}${toHex(average(g))}${toHex(average(b))}`;

          resolve(HEX_COLOR_REGEX.test(hex) ? hex : null);
        } catch {
          resolve(null);
        }
      };

      img.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

const analysisSteps = [
  { label: 'connecting', progress: 20 },
  { label: 'scraping', progress: 40 },
  { label: 'extracting', progress: 60 },
  { label: 'analyzing', progress: 80 },
  { label: 'generating', progress: 100 },
];

export function BrandAnalysisPage() {
  const t = useTranslations('brandAnalysis');
  const router = useRouter();
  const locale = useLocale();
  const { isAuthenticated } = useAuthStore();
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [result, setResult] = useState<BrandAnalysisResult | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showGenerationDialog, setShowGenerationDialog] = useState(false);
  const [generationType, setGenerationType] = useState<'image' | 'video' | null>(null);
  const [generationMode, setGenerationMode] = useState<'single' | 'batch' | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [logoColor, setLogoColor] = useState<string | null>(null);
  const [isLogoColorLoading, setIsLogoColorLoading] = useState(false);

  const quickExamples = [
    {
      name: 'Apple',
      url: 'https://apple.com',
      logo: 'https://cdn.simpleicons.org/apple/000000',
    },
    {
      name: 'Nike',
      url: 'https://nike.com',
      logo: 'https://cdn.simpleicons.org/nike/000000',
    },
    {
      name: 'Starbucks',
      url: 'https://starbucks.com',
      logo: 'https://cdn.simpleicons.org/starbucks/006241',
    },
  ];

  const navigate = useCallback(
    (href: string) => {
      (router as unknown as { push: (path: string) => void }).push(href);
    },
    [router]
  );

  const hasImageRecommendations = Boolean(
    result?.recommendedImageStyles && result.recommendedImageStyles.length > 0
  );
  const hasVideoRecommendations = Boolean(
    result?.recommendedVideoStyles && result.recommendedVideoStyles.length > 0
  );

  const { safeAnalysisStepIndex, currentAnalysisStep } = useMemo(() => {
    if (analysisSteps.length === 0) {
      return {
        safeAnalysisStepIndex: 0,
        currentAnalysisStep: { label: 'analyzing', progress: 0 },
      };
    }

    const index = Math.min(Math.max(analysisStep, 0), analysisSteps.length - 1);
    const fallbackStep = { label: 'analyzing', progress: 0 };
    return {
      safeAnalysisStepIndex: index,
      currentAnalysisStep: analysisSteps[index] ?? fallbackStep,
    };
  }, [analysisStep]);

  useEffect(() => {
    if (!result) {
      setLogoColor(null);
      return;
    }

    // Always try to extract logo color as it's more accurate than AI-extracted colors
    // Logo color will be used as fallback or override if AI colors are invalid/placeholder
    let isMounted = true;
    setIsLogoColorLoading(true);

    extractLogoDominantColor(result.website)
      .then((color) => {
        if (isMounted) {
          const validColor = getValidHexColor(color);
          // Only set logo color if it's valid and not a placeholder purple
          const purpleColors = ['#9333EA', '#8B5CF6', '#A855F7', '#7C3AED', '#EC4899'];
          if (validColor && !purpleColors.includes(validColor)) {
            setLogoColor(validColor);
          } else {
            setLogoColor(null);
          }
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLogoColorLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [result]);

  const { primaryColor, secondaryColors, accentColor } = useMemo(() => {
    if (!result) {
      return {
        primaryColor: '#9333EA',
        secondaryColors: [] as string[],
        accentColor: '#F59E0B',
      };
    }

    const validPrimary = getValidHexColor(result.colors?.primary);
    const validSecondary = Array.isArray(result.colors?.secondary)
      ? (result.colors.secondary
          .map((color) => getValidHexColor(color))
          .filter(Boolean) as string[])
      : [];
    const uniqueSecondary = [
      ...new Set(validSecondary.filter((color) => color && color !== validPrimary)),
    ];

    // Prioritize logo color over AI-extracted color, use neutral gray as last resort
    const basePrimary = logoColor ?? validPrimary ?? '#6B7280';
    const accent =
      getValidHexColor(result.colors?.accent) ??
      (uniqueSecondary.length > 0 ? uniqueSecondary[0] : null) ??
      logoColor ??
      basePrimary;

    return {
      primaryColor: basePrimary,
      secondaryColors: uniqueSecondary,
      accentColor: accent,
    };
  }, [logoColor, result]);

  const handleAnalyze = async (inputUrl?: string) => {
    // Check authentication first
    if (!isAuthenticated) {
      toast.error(t('errors.loginRequired') || 'Please login to use this feature');
      navigate('/login');
      return;
    }

    const targetUrl = inputUrl || url;

    if (!targetUrl) {
      toast.error(t('errors.urlRequired'));
      return;
    }

    // Validate URL
    try {
      new URL(targetUrl);
    } catch {
      toast.error(t('errors.invalidUrl'));
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setAnalysisStep(0);

    try {
      // Simulate analysis steps
      for (let i = 0; i < analysisSteps.length; i++) {
        setAnalysisStep(i);
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // Call API
      const response = await fetch('/api/v1/analyze-brand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ websiteUrl: targetUrl, locale }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || t('errors.analysisFailed'));
      }

      setResult(data.data);
      setSelectedTab('overview');
      toast.success(t('success.analysisComplete'));
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error instanceof Error ? error.message : t('errors.analysisFailed'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('actions.copied'));
  };

  const downloadReport = () => {
    if (!result) return;

    const report = JSON.stringify(result, null, 2);
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brand-analysis-${result.brandName || 'report'}.json`;
    a.click();
    toast.success(t('actions.downloaded'));
  };

  const handleStartCreation = () => {
    if (result) {
      setShowGenerationDialog(true);
      setGenerationType(null);
      setGenerationMode(null);
    }
  };

  const handleGenerationTypeSelect = (type: 'image' | 'video') => {
    setGenerationType(type);
  };

  const handleGenerationModeSelect = (mode: 'single' | 'batch') => {
    setGenerationMode(mode);
  };

  const handleConfirmGeneration = () => {
    if (!result || !generationType || !generationMode) return;

    // Store brand analysis data in sessionStorage with selected style
    const brandData = {
      ...result,
      selectedStyle: selectedStyle || undefined, // 带入选中的风格
    };
    sessionStorage.setItem('brandAnalysis', JSON.stringify(brandData));

    // Navigate to the appropriate page
    if (generationMode === 'single') {
      if (generationType === 'image') {
        navigate('/image-generation?fromBrandAnalysis=true');
      } else {
        navigate('/video-generation?fromBrandAnalysis=true');
      }
    } else {
      if (generationType === 'image') {
        navigate('/batch-image-generation?fromBrandAnalysis=true');
      } else {
        navigate('/batch-video-generation?fromBrandAnalysis=true');
      }
    }

    setShowGenerationDialog(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Hero Section */}
        {!result && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 mb-12"
          >
            <h1 className="h1-hero text-center">
              {t('hero.title')}{' '}
              <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                {t('hero.titleHighlight')}
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {t('hero.description')}
            </p>
          </motion.div>
        )}

        {/* Input Section */}
        <Card className="max-w-4xl mx-auto border-2 shadow-xl mb-12 dark:border-slate-700">
          <CardHeader className="border-b bg-gradient-to-r from-teal-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 dark:border-slate-700">
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-6 text-teal-600 dark:text-teal-400" />
              {t('input.title')}
            </CardTitle>
            <CardDescription className="text-base dark:text-slate-400">
              {t('input.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="url" className="text-base">
                {t('input.urlLabel')}
              </Label>
              <div className="flex gap-3">
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 h-12 text-lg"
                  disabled={isAnalyzing}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isAnalyzing && url) {
                      handleAnalyze();
                    }
                  }}
                />
                <Button
                  onClick={() => handleAnalyze()}
                  disabled={isAnalyzing || !url}
                  className="btn-primary gap-2 h-12 px-8"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      {t('input.analyzing')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-5" />
                      {t('input.startAnalysis')}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Examples */}
            {!isAnalyzing && !result && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t('input.quickExamples')}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {quickExamples.map((example) => (
                    <motion.button
                      key={example.url}
                      onClick={() => {
                        setUrl(example.url);
                        handleAnalyze(example.url);
                      }}
                      className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all text-left group bg-white dark:bg-slate-800"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-2 overflow-hidden">
                          <img
                            src={example.logo}
                            alt={`${example.name} logo`}
                            className="w-full h-full object-contain"
                            loading="lazy"
                            style={{ minWidth: '24px', minHeight: '24px' }}
                            onError={(e) => {
                              // Fallback to brand name initial if image fails to load
                              const target = e.target as HTMLImageElement;
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.logo-fallback')) {
                                target.style.display = 'none';
                                const fallback = document.createElement('div');
                                fallback.className =
                                  'logo-fallback text-lg font-semibold text-slate-600';
                                fallback.textContent = example.name.charAt(0);
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="text-slate-900 dark:text-white group-hover:text-teal-900 dark:group-hover:text-teal-400 font-medium">
                            {example.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {example.url}
                          </div>
                        </div>
                        <ChevronRight className="size-5 text-slate-400 group-hover:text-teal-600" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Progress */}
            <AnimatePresence>
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 pt-6 border-t"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-900 dark:text-white">
                        {t(`steps.${currentAnalysisStep.label}`)}
                      </span>
                      <span className="text-teal-600 dark:text-teal-400">
                        {currentAnalysisStep.progress}%
                      </span>
                    </div>
                    <Progress value={currentAnalysisStep.progress} className="h-3" />
                  </div>

                  <div className="grid grid-cols-5 gap-3">
                    {analysisSteps.map((step, index) => (
                      <div
                        key={step.label}
                        className={`
                          p-3 rounded-xl text-center transition-all
                          ${
                            index < safeAnalysisStepIndex
                              ? 'bg-teal-100 dark:bg-teal-900/30 border-2 border-teal-300 dark:border-teal-600'
                              : index === safeAnalysisStepIndex
                                ? 'bg-teal-100 dark:bg-teal-900/30 border-2 border-teal-300 dark:border-teal-600'
                                : 'bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700'
                          }
                        `}
                      >
                        {index < safeAnalysisStepIndex ? (
                          <CheckCircle2 className="size-6 mx-auto text-teal-600 dark:text-teal-400" />
                        ) : index === safeAnalysisStepIndex ? (
                          <Loader2 className="size-6 mx-auto text-teal-600 dark:text-teal-400 animate-spin" />
                        ) : (
                          <div className="size-6 mx-auto rounded-full border-2 border-slate-400 dark:border-slate-600" />
                        )}
                        <p className="text-xs mt-2 text-slate-600 dark:text-slate-400">
                          {t(`steps.${step.label}`)}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="space-y-6"
            >
              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                >
                  <Copy className="size-4" />
                  {t('actions.copy')}
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={downloadReport}>
                  <Download className="size-4" />
                  {t('actions.download')}
                </Button>
              </div>

              {/* Brand Header */}
              <Card className="border-2 border-teal-200 bg-gradient-to-br from-white to-teal-50/30 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h2 className="h2-section">{result.brandName}</h2>
                        <Badge className="gap-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border-teal-300 dark:border-teal-700">
                          <CheckCircle2 className="size-3" />
                          {t('result.analyzed')}
                        </Badge>
                      </div>
                      <p className="text-lg text-slate-600 dark:text-slate-400">
                        {result.metadata.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <Globe className="size-4" />
                        {result.website}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        {t('result.completeness')}
                      </div>
                      <div className="text-3xl bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                        98%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-teal-200 dark:border-teal-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="size-4 text-teal-600 dark:text-teal-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {t('result.productCategory')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {result.productCategory.slice(0, 2).map((cat) => (
                          <Badge key={cat} variant="secondary" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-teal-200 dark:border-teal-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="size-4 text-teal-600 dark:text-teal-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {t('result.targetAge')}
                        </span>
                      </div>
                      <div className="text-slate-900 dark:text-white">
                        {result.audienceAge || 'N/A'}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-teal-200 dark:border-teal-800">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="size-4 text-teal-600 dark:text-teal-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {t('result.incomeLevel')}
                        </span>
                      </div>
                      <div className="text-slate-900 dark:text-white">
                        {result.audienceIncome || 'N/A'}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-teal-200 dark:border-teal-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="size-4 text-teal-600 dark:text-teal-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {t('result.language')}
                        </span>
                      </div>
                      <div className="text-slate-900 dark:text-white">
                        {result.metadata.language}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs for detailed analysis */}
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-5 h-auto p-2 bg-white border-2 border-slate-200 rounded-xl shadow-lg">
                  <TabsTrigger
                    value="overview"
                    className="gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-gradient-to-br data-[state=active]:from-teal-600 data-[state=active]:to-teal-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-teal-500/50 transition-all hover:scale-105 data-[state=inactive]:hover:bg-slate-100"
                  >
                    <BarChart3 className="size-4" />
                    <span className="hidden md:inline font-semibold">{t('tabs.overview')}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="visual"
                    className="gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-gradient-to-br data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-teal-500/50 transition-all hover:scale-105 data-[state=inactive]:hover:bg-slate-100 dark:data-[state=inactive]:hover:bg-slate-800"
                  >
                    <Palette className="size-4" />
                    <span className="hidden md:inline font-semibold">{t('tabs.visual')}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="audience"
                    className="gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/50 transition-all hover:scale-105 data-[state=inactive]:hover:bg-slate-100"
                  >
                    <Target className="size-4" />
                    <span className="hidden md:inline font-semibold">{t('tabs.audience')}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="content"
                    className="gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-600 data-[state=active]:to-amber-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/50 transition-all hover:scale-105 data-[state=inactive]:hover:bg-slate-100"
                  >
                    <MessageSquare className="size-4" />
                    <span className="hidden md:inline font-semibold">{t('tabs.content')}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="recommendations"
                    className="gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-gradient-to-br data-[state=active]:from-teal-600 data-[state=active]:to-teal-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-teal-500/50 transition-all hover:scale-105 data-[state=inactive]:hover:bg-slate-100"
                  >
                    <Lightbulb className="size-4" />
                    <span className="hidden md:inline font-semibold">
                      {t('tabs.recommendations')}
                    </span>
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Brand Tone */}
                    <Card className="border-2 hover:border-teal-300 transition-colors">
                      <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="size-5 text-teal-600" />
                          {t('overview.brandTone')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-2xl text-slate-900 mb-3">{result.brandTone}</p>
                          <p className="text-slate-600">{result.brandVoice}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm text-slate-600">{t('overview.personality')}</div>
                          <div className="flex flex-wrap gap-2">
                            {result.brandPersonality.map((trait) => (
                              <Badge
                                key={trait}
                                className="bg-teal-100 text-teal-800 border-teal-200"
                              >
                                {trait}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Competitive Advantage */}
                    {result.competitiveAdvantage && result.competitiveAdvantage.length > 0 && (
                      <Card className="border-2 hover:border-teal-300 transition-colors">
                        <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
                          <CardTitle className="flex items-center gap-2">
                            <Award className="size-5 text-teal-600" />
                            {t('overview.competitiveAdvantage')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {result.competitiveAdvantage.map((advantage) => (
                              <div
                                key={advantage}
                                className="flex items-start gap-3 p-3 rounded-lg bg-teal-50 border border-teal-200"
                              >
                                <Star className="size-5 text-teal-600 flex-shrink-0 mt-0.5" />
                                <span className="text-slate-900">{advantage}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Style Keywords */}
                  <Card className="border-2">
                    <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="size-5 text-teal-600" />
                        {t('overview.styleKeywords')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-3">
                        {result.styleKeywords.map((keyword) => (
                          <Badge
                            key={keyword}
                            variant="outline"
                            className="text-lg py-2 px-4 border-2 hover:bg-teal-50 hover:border-teal-300 cursor-pointer transition-colors"
                            onClick={() => copyToClipboard(keyword)}
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Visual Tab */}
                <TabsContent value="visual" className="space-y-6 mt-6">
                  {/* Colors */}
                  <Card className="border-2">
                    <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent dark:from-teal-900/20">
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="size-5 text-teal-500" />
                        {t('visual.colorScheme')}
                      </CardTitle>
                      <CardDescription>{t('visual.colorDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">{t('visual.primaryColor')}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(primaryColor)}
                          >
                            <Copy className="size-3 mr-1" />
                            {t('actions.copy')}
                          </Button>
                        </div>
                        <div className="flex items-center gap-4">
                          <>
                            <button
                              type="button"
                              className="size-20 rounded-2xl border-4 border-white shadow-xl cursor-pointer hover:scale-110 transition-transform"
                              style={{ backgroundColor: primaryColor }}
                              onClick={() => copyToClipboard(primaryColor)}
                              title={t('visual.clickToCopy')}
                              aria-label={t('visual.clickToCopy')}
                            />
                            <div>
                              <div className="text-2xl font-semibold text-slate-900 mb-1">
                                {primaryColor}
                              </div>
                              <p className="text-sm text-slate-600">
                                {isLogoColorLoading && !getValidHexColor(result.colors?.primary)
                                  ? t('visual.primaryColorFetching')
                                  : t('visual.primaryColorDesc')}
                              </p>
                            </div>
                          </>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">
                            {t('visual.secondaryColors')}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(secondaryColors.join(', '))}
                            disabled={secondaryColors.length === 0}
                          >
                            <Copy className="size-3 mr-1" />
                            {t('actions.copy')}
                          </Button>
                        </div>
                        {secondaryColors.length === 0 ? (
                          <p className="text-sm text-slate-500 italic">
                            {t('visual.noSecondaryColors')}
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-3">
                            {secondaryColors.map((color) => (
                              <button
                                type="button"
                                key={color}
                                className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-teal-500 transition-colors cursor-pointer text-left"
                                onClick={() => copyToClipboard(color)}
                                aria-label={t('visual.clickToCopy')}
                              >
                                <div
                                  className="aspect-square rounded-xl border-4 border-slate-300 shadow-lg hover:scale-105 transition-transform"
                                  style={{ backgroundColor: color }}
                                  title={t('visual.clickToCopy')}
                                />
                                <div className="text-center">
                                  <div className="text-sm font-semibold text-slate-900">
                                    {color}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {t('visual.clickToCopy')}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        className="p-4 rounded-xl bg-amber-50 border-2 border-amber-200 cursor-pointer hover:border-amber-300 transition-colors text-left"
                        onClick={() => accentColor && copyToClipboard(accentColor)}
                        disabled={!accentColor}
                        aria-label={t('visual.clickToCopy')}
                      >
                        {accentColor ? (
                          <div className="flex items-center gap-3">
                            <div
                              className="size-16 rounded-xl border-4 border-slate-300 shadow-lg hover:scale-110 transition-transform"
                              style={{ backgroundColor: accentColor }}
                              title={t('visual.clickToCopy')}
                            />
                            <div>
                              <div className="text-sm text-slate-600">
                                {t('visual.accentColor')}
                              </div>
                              <div className="text-lg font-semibold text-slate-900">
                                {accentColor}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {t('visual.clickToCopy')}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 italic">
                            {t('visual.noAccentColor')}
                          </p>
                        )}
                      </button>
                    </CardContent>
                  </Card>

                  {/* Visual Style */}
                  {result.visualStyle && (
                    <div className="grid md:grid-cols-3 gap-6">
                      <Card className="border-2">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <ImageIcon className="size-5 text-blue-600" />
                            {t('visual.photography')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-slate-700">{result.visualStyle.photography}</p>
                        </CardContent>
                      </Card>

                      <Card className="border-2">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="size-5 text-green-600" />
                            {t('visual.layout')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-slate-700">{result.visualStyle.layout}</p>
                        </CardContent>
                      </Card>

                      <Card className="border-2">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="size-5 text-teal-500" />
                            {t('visual.typography')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-slate-700">{result.visualStyle.typography}</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>

                {/* Audience Tab */}
                <TabsContent value="audience" className="space-y-6 mt-6">
                  <Card className="border-2">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent">
                      <CardTitle className="flex items-center gap-2">
                        <Target className="size-5 text-blue-600" />
                        {t('audience.profile')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-6 rounded-xl bg-blue-50 border-2 border-blue-200">
                        <p className="text-xl text-slate-900">{result.targetAudience}</p>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-white border-2 border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="size-5 text-teal-600" />
                            <span className="text-sm text-slate-600">{t('audience.ageRange')}</span>
                          </div>
                          <div className="text-2xl text-slate-900">
                            {result.audienceAge || 'N/A'}
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white border-2 border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="size-5 text-teal-600" />
                            <span className="text-sm text-slate-600">{t('audience.income')}</span>
                          </div>
                          <div className="text-2xl text-slate-900">
                            {result.audienceIncome || 'N/A'}
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white border-2 border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Heart className="size-5 text-teal-600" />
                            <span className="text-sm text-slate-600">
                              {t('audience.preference')}
                            </span>
                          </div>
                          <div className="text-2xl text-slate-900">
                            {t('audience.qualityFirst')}
                          </div>
                        </div>
                      </div>

                      {result.audienceSegments && result.audienceSegments.length > 0 && (
                        <div className="p-4 rounded-xl bg-white border-2 border-slate-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Target className="size-5 text-blue-600" />
                            <span className="text-sm text-slate-600">{t('audience.segments')}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {result.audienceSegments.map((segment) => (
                              <Badge
                                key={segment}
                                variant="outline"
                                className="border-blue-200 text-blue-700"
                              >
                                {segment}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Content Tab */}
                <TabsContent value="content" className="space-y-6 mt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-2">
                      <CardHeader className="bg-gradient-to-r from-amber-50 to-transparent">
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="size-5 text-amber-600" />
                          {t('content.themes')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {result.contentThemes.map((theme) => (
                            <div
                              key={theme}
                              className="p-3 rounded-lg bg-amber-50 border border-amber-200"
                            >
                              <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-amber-600" />
                                <span className="text-slate-900">{theme}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-2">
                      <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent dark:from-teal-900/20">
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="size-5 text-teal-500" />
                          {t('content.socialTone')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-lg text-slate-900 mb-4">
                          {result.socialMediaTone || t('content.defaultSocialTone')}
                        </p>
                        {result.marketingFocus && result.marketingFocus.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm text-slate-600">
                              {t('content.marketingFocus')}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {result.marketingFocus.map((focus) => (
                                <Badge key={focus} variant="secondary">
                                  {focus}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Recommendations Tab */}
                <TabsContent value="recommendations" className="space-y-6 mt-6">
                  {(hasImageRecommendations || hasVideoRecommendations) && result && (
                    <Card className="border-2 border-teal-200">
                      <CardHeader className="bg-gradient-to-r from-teal-50 to-blue-50">
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="size-5 text-teal-600" />
                          {t('recommendations.title')}
                        </CardTitle>
                        <CardDescription>{t('recommendations.description')}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {hasImageRecommendations && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                              {t('recommendations.imageStylesTitle')}
                            </h4>
                            <div className="grid md:grid-cols-2 gap-4">
                              {result.recommendedImageStyles?.map((style) => {
                                const isSelected = selectedStyle === style;
                                return (
                                  <button
                                    type="button"
                                    key={`image-style-${style}`}
                                    onClick={() => setSelectedStyle(isSelected ? null : style)}
                                    className={`
                                      p-4 rounded-xl cursor-pointer transition-all
                                      ${
                                        isSelected
                                          ? 'bg-teal-50 border-2 border-teal-500 shadow-md'
                                          : 'bg-white/80 border border-teal-200 hover:border-teal-400 hover:shadow-sm'
                                      }
                                    `}
                                    aria-pressed={isSelected}
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      {isSelected ? (
                                        <CheckCircle2 className="size-4 text-teal-600" />
                                      ) : (
                                        <ImageIcon className="size-4 text-teal-600" />
                                      )}
                                      <span
                                        className={`text-sm font-medium ${isSelected ? 'text-teal-700' : 'text-slate-900'}`}
                                      >
                                        {style}
                                      </span>
                                    </div>
                                    <div
                                      className={`text-xs ${isSelected ? 'text-teal-600' : 'text-slate-600'}`}
                                    >
                                      {isSelected
                                        ? t('recommendations.selected') || '已选择'
                                        : t('recommendations.clickToUse')}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {hasVideoRecommendations && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                              {t('recommendations.videoStylesTitle')}
                            </h4>
                            <div className="grid md:grid-cols-2 gap-4">
                              {result.recommendedVideoStyles?.map((style) => {
                                const isSelected = selectedStyle === style;
                                return (
                                  <button
                                    type="button"
                                    key={`video-style-${style}`}
                                    onClick={() => setSelectedStyle(isSelected ? null : style)}
                                    className={`
                                      p-4 rounded-xl cursor-pointer transition-all
                                      ${
                                        isSelected
                                          ? 'bg-teal-50 border-2 border-teal-500 shadow-md'
                                          : 'bg-white/80 border border-teal-200 hover:border-teal-400 hover:shadow-sm'
                                      }
                                    `}
                                    aria-pressed={isSelected}
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      {isSelected ? (
                                        <CheckCircle2 className="size-4 text-teal-600" />
                                      ) : (
                                        <Video className="size-4 text-teal-600" />
                                      )}
                                      <span
                                        className={`text-sm font-medium ${isSelected ? 'text-teal-700' : 'text-slate-900'}`}
                                      >
                                        {style}
                                      </span>
                                    </div>
                                    <div
                                      className={`text-xs ${isSelected ? 'text-teal-600' : 'text-slate-600'}`}
                                    >
                                      {isSelected
                                        ? t('recommendations.selected') || '已选择'
                                        : t('recommendations.clickToUse')}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* CTA */}
                  <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-600 to-blue-600 text-white">
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <h3 className="text-2xl">{t('recommendations.ctaTitle')}</h3>
                          <p className="text-violet-100">{t('recommendations.ctaDescription')}</p>
                        </div>
                        <Button
                          size="lg"
                          className="btn-primary bg-white text-teal-600 hover:bg-slate-50 shadow-xl gap-2"
                          onClick={handleStartCreation}
                        >
                          <Sparkles className="size-5" />
                          {t('recommendations.startCreation')}
                          <ChevronRight className="size-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generation Options Dialog */}
        <Dialog open={showGenerationDialog} onOpenChange={setShowGenerationDialog}>
          <DialogContent className="sm:max-w-[600px] bg-white border-2 border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-slate-900 text-xl">
                {t('generationDialog.title')}
              </DialogTitle>
              <DialogDescription className="text-slate-600 text-base">
                {t('generationDialog.description')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Generation Type Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-slate-900">
                  {t('generationDialog.selectType')}
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    type="button"
                    onClick={() => handleGenerationTypeSelect('image')}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      generationType === 'image'
                        ? 'border-violet-500 bg-violet-50 shadow-lg shadow-violet-500/30'
                        : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`p-2 rounded-lg ${
                          generationType === 'image'
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <ImageIcon className="size-5" />
                      </div>
                      <span className="font-semibold text-slate-900">
                        {t('generationDialog.image')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{t('generationDialog.imageDesc')}</p>
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => handleGenerationTypeSelect('video')}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      generationType === 'video'
                        ? 'border-violet-500 bg-violet-50 shadow-lg shadow-violet-500/30'
                        : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`p-2 rounded-lg ${
                          generationType === 'video'
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Video className="size-5" />
                      </div>
                      <span className="font-semibold text-slate-900">
                        {t('generationDialog.video')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{t('generationDialog.videoDesc')}</p>
                  </motion.button>
                </div>
              </div>

              {/* Generation Mode Selection */}
              {generationType && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-slate-900">
                    {t('generationDialog.selectMode')}
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <motion.button
                      type="button"
                      onClick={() => handleGenerationModeSelect('single')}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        generationMode === 'single'
                          ? 'border-violet-500 bg-violet-50 shadow-lg shadow-violet-500/30'
                          : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`p-2 rounded-lg ${
                            generationMode === 'single'
                              ? 'bg-violet-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Sparkles className="size-5" />
                        </div>
                        <span className="font-semibold text-slate-900">
                          {t('generationDialog.single')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{t('generationDialog.singleDesc')}</p>
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={() => handleGenerationModeSelect('batch')}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        generationMode === 'batch'
                          ? 'border-violet-500 bg-violet-50 shadow-lg shadow-violet-500/30'
                          : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`p-2 rounded-lg ${
                            generationMode === 'batch'
                              ? 'bg-violet-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <FileSpreadsheet className="size-5" />
                        </div>
                        <span className="font-semibold text-slate-900">
                          {t('generationDialog.batch')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{t('generationDialog.batchDesc')}</p>
                    </motion.button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => setShowGenerationDialog(false)}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                {t('generationDialog.cancel')}
              </Button>
              <Button
                onClick={handleConfirmGeneration}
                disabled={!generationType || !generationMode}
                className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('generationDialog.confirm')}
                <ChevronRight className="size-4 ml-2" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
