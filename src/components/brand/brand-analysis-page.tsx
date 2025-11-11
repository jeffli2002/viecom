'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Globe,
  Sparkles,
  Loader2,
  CheckCircle2,
  Palette,
  Tag,
  Zap,
  Eye,
  TrendingUp,
  Copy,
  Download,
  FileText,
  Users,
  Target,
  Heart,
  MessageSquare,
  Image as ImageIcon,
  ChevronRight,
  Star,
  Lightbulb,
  Award,
  BarChart3,
  Video,
  FileSpreadsheet,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

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
  metadata: {
    title: string;
    description: string;
    language: string;
  };
  socialMediaTone?: string;
  marketingFocus?: string[];
}

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

  const handleAnalyze = async (inputUrl?: string) => {
    // Check authentication first
    if (!isAuthenticated) {
      toast.error(t('errors.loginRequired') || 'Please login to use this feature');
      router.push('/login');
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
      selectedStyle: selectedStyle || undefined,  // 带入选中的风格
    };
    sessionStorage.setItem('brandAnalysis', JSON.stringify(brandData));

    // Navigate to the appropriate page
    if (generationMode === 'single') {
      if (generationType === 'image') {
        router.push('/image-generation?fromBrandAnalysis=true');
      } else {
        router.push('/video-generation?fromBrandAnalysis=true');
      }
    } else {
      if (generationType === 'image') {
        router.push('/batch-image-generation?fromBrandAnalysis=true');
      } else {
        router.push('/batch-video-generation?fromBrandAnalysis=true');
      }
    }

    setShowGenerationDialog(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Hero Section */}
        {!result && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 mb-12"
          >
            <h2 className="text-4xl md:text-6xl text-slate-900 max-w-3xl mx-auto leading-tight">
              {t('hero.title')}
              <br />
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                {t('hero.titleHighlight')}
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">{t('hero.description')}</p>
          </motion.div>
        )}

        {/* Input Section */}
        <Card className="max-w-4xl mx-auto border-2 shadow-xl mb-12">
          <CardHeader className="border-b bg-gradient-to-r from-violet-50 to-fuchsia-50">
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-6 text-violet-600" />
              {t('input.title')}
            </CardTitle>
            <CardDescription className="text-base">{t('input.description')}</CardDescription>
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
                  className="gap-2 h-12 px-8 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-violet-500/25"
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
                <p className="text-sm text-slate-600">{t('input.quickExamples')}</p>
                <div className="grid grid-cols-3 gap-3">
                  {quickExamples.map((example, index) => (
                    <motion.button
                      key={index}
                      onClick={() => {
                        setUrl(example.url);
                        handleAnalyze(example.url);
                      }}
                      className="p-4 rounded-xl border-2 border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all text-left group"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white rounded-lg border border-slate-200 p-2 overflow-hidden">
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
                                fallback.className = 'logo-fallback text-lg font-semibold text-slate-600';
                                fallback.textContent = example.name.charAt(0);
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="text-slate-900 group-hover:text-violet-900 font-medium">
                            {example.name}
                          </div>
                          <div className="text-xs text-slate-500">{example.url}</div>
                        </div>
                        <ChevronRight className="size-5 text-slate-400 group-hover:text-violet-600" />
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
                      <span className="text-slate-900">
                        {t(`steps.${analysisSteps[analysisStep].label}`)}
                      </span>
                      <span className="text-violet-600">
                        {analysisSteps[analysisStep].progress}%
                      </span>
                    </div>
                    <Progress value={analysisSteps[analysisStep].progress} className="h-3" />
                  </div>

                  <div className="grid grid-cols-5 gap-3">
                    {analysisSteps.map((step, index) => (
                      <div
                        key={index}
                        className={`
                          p-3 rounded-xl text-center transition-all
                          ${
                            index < analysisStep
                              ? 'bg-green-100 border-2 border-green-300'
                              : index === analysisStep
                                ? 'bg-violet-100 border-2 border-violet-300'
                                : 'bg-slate-100 border-2 border-slate-200'
                          }
                        `}
                      >
                        {index < analysisStep ? (
                          <CheckCircle2 className="size-6 mx-auto text-green-600" />
                        ) : index === analysisStep ? (
                          <Loader2 className="size-6 mx-auto text-violet-600 animate-spin" />
                        ) : (
                          <div className="size-6 mx-auto rounded-full border-2 border-slate-400" />
                        )}
                        <p className="text-xs mt-2 text-slate-600">
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
              <Card className="border-2 border-violet-200 bg-gradient-to-br from-white to-violet-50/30 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h2 className="text-4xl text-slate-900">{result.brandName}</h2>
                        <Badge className="gap-1 bg-green-100 text-green-700 border-green-300">
                          <CheckCircle2 className="size-3" />
                          {t('result.analyzed')}
                        </Badge>
                      </div>
                      <p className="text-lg text-slate-600">{result.metadata.description}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Globe className="size-4" />
                        {result.website}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-600 mb-1">{t('result.completeness')}</div>
                      <div className="text-3xl bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                        98%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-white/80 border border-violet-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="size-4 text-violet-600" />
                        <span className="text-sm text-slate-600">{t('result.productCategory')}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {result.productCategory.slice(0, 2).map((cat, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/80 border border-violet-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="size-4 text-fuchsia-600" />
                        <span className="text-sm text-slate-600">{t('result.targetAge')}</span>
                      </div>
                      <div className="text-slate-900">{result.audienceAge || 'N/A'}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/80 border border-violet-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="size-4 text-green-600" />
                        <span className="text-sm text-slate-600">{t('result.incomeLevel')}</span>
                      </div>
                      <div className="text-slate-900">{result.audienceIncome || 'N/A'}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/80 border border-violet-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="size-4 text-amber-600" />
                        <span className="text-sm text-slate-600">{t('result.language')}</span>
                      </div>
                      <div className="text-slate-900">{result.metadata.language}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs for detailed analysis */}
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-5 h-auto p-2 bg-white border-2 border-slate-200 rounded-xl shadow-lg">
                  <TabsTrigger 
                    value="overview" 
                    className="gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-600 data-[state=active]:to-violet-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-500/50 transition-all hover:scale-105 data-[state=inactive]:hover:bg-slate-100"
                  >
                    <BarChart3 className="size-4" />
                    <span className="hidden md:inline font-semibold">{t('tabs.overview')}</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="visual" 
                    className="gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 transition-all hover:scale-105 data-[state=inactive]:hover:bg-slate-100"
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
                    className="gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-gradient-to-br data-[state=active]:from-fuchsia-600 data-[state=active]:to-fuchsia-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-fuchsia-500/50 transition-all hover:scale-105 data-[state=inactive]:hover:bg-slate-100"
                  >
                    <Lightbulb className="size-4" />
                    <span className="hidden md:inline font-semibold">{t('tabs.recommendations')}</span>
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Brand Tone */}
                    <Card className="border-2 hover:border-violet-300 transition-colors">
                      <CardHeader className="bg-gradient-to-r from-violet-50 to-transparent">
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="size-5 text-violet-600" />
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
                            {result.brandPersonality.map((trait, index) => (
                              <Badge
                                key={index}
                                className="bg-violet-100 text-violet-800 border-violet-200"
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
                      <Card className="border-2 hover:border-green-300 transition-colors">
                        <CardHeader className="bg-gradient-to-r from-green-50 to-transparent">
                          <CardTitle className="flex items-center gap-2">
                            <Award className="size-5 text-green-600" />
                            {t('overview.competitiveAdvantage')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {result.competitiveAdvantage.map((advantage, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200"
                              >
                                <Star className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
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
                    <CardHeader className="bg-gradient-to-r from-fuchsia-50 to-transparent">
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="size-5 text-fuchsia-600" />
                        {t('overview.styleKeywords')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-3">
                        {result.styleKeywords.map((keyword, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-lg py-2 px-4 border-2 hover:bg-fuchsia-50 hover:border-fuchsia-300 cursor-pointer transition-colors"
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
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent">
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="size-5 text-purple-600" />
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
                            onClick={() => copyToClipboard(result.colors.primary)}
                          >
                            <Copy className="size-3 mr-1" />
                            {t('actions.copy')}
                          </Button>
                        </div>
                        <div className="flex items-center gap-4">
                          <div
                            className="size-20 rounded-2xl border-4 border-white shadow-xl cursor-pointer hover:scale-110 transition-transform"
                            style={{ backgroundColor: result.colors.primary }}
                            onClick={() => copyToClipboard(result.colors.primary)}
                          />
                          <div>
                            <div className="text-2xl text-slate-900 mb-1">
                              {result.colors.primary}
                            </div>
                            <p className="text-sm text-slate-600">{t('visual.primaryColorDesc')}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-sm text-slate-600">{t('visual.secondaryColors')}</div>
                        <div className="grid grid-cols-3 gap-4">
                          {result.colors.secondary.map((color, index) => (
                            <div
                              key={index}
                              className="space-y-2 p-4 rounded-xl bg-slate-50 border-2 border-slate-200 hover:border-purple-300 transition-colors cursor-pointer"
                              onClick={() => copyToClipboard(color)}
                            >
                              <div
                                className="aspect-square rounded-xl border-4 border-slate-300 shadow-lg hover:scale-105 transition-transform"
                                style={{ backgroundColor: color || '#E5E7EB' }}
                                title={color}
                              />
                              <div className="text-center">
                                <div className="text-sm font-semibold text-slate-900">{color}</div>
                                <div className="text-xs text-slate-500">{t('visual.clickToCopy')}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {result.colors.secondary.length === 0 && (
                          <p className="text-sm text-slate-500 text-center py-4">
                            {t('visual.noSecondaryColors') || '未提取到辅助色彩'}
                          </p>
                        )}
                      </div>

                      {result.colors.accent && (
                        <div 
                          className="p-4 rounded-xl bg-amber-50 border-2 border-amber-200 cursor-pointer hover:border-amber-300 transition-colors"
                          onClick={() => copyToClipboard(result.colors.accent!)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="size-16 rounded-xl border-4 border-slate-300 shadow-lg hover:scale-110 transition-transform"
                              style={{ backgroundColor: result.colors.accent }}
                              title={result.colors.accent}
                            />
                            <div>
                              <div className="text-sm text-slate-600">{t('visual.accentColor')}</div>
                              <div className="text-lg font-semibold text-slate-900">{result.colors.accent}</div>
                              <div className="text-xs text-slate-500 mt-1">{t('visual.clickToCopy')}</div>
                            </div>
                          </div>
                        </div>
                      )}
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
                            <FileText className="size-5 text-purple-600" />
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
                            <Users className="size-5 text-violet-600" />
                            <span className="text-sm text-slate-600">{t('audience.ageRange')}</span>
                          </div>
                          <div className="text-2xl text-slate-900">
                            {result.audienceAge || 'N/A'}
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white border-2 border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="size-5 text-green-600" />
                            <span className="text-sm text-slate-600">{t('audience.income')}</span>
                          </div>
                          <div className="text-2xl text-slate-900">
                            {result.audienceIncome || 'N/A'}
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white border-2 border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Heart className="size-5 text-fuchsia-600" />
                            <span className="text-sm text-slate-600">{t('audience.preference')}</span>
                          </div>
                          <div className="text-2xl text-slate-900">{t('audience.qualityFirst')}</div>
                        </div>
                      </div>
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
                          {result.contentThemes.map((theme, index) => (
                            <div
                              key={index}
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
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent">
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="size-5 text-purple-600" />
                          {t('content.socialTone')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-lg text-slate-900 mb-4">
                          {result.socialMediaTone || t('content.defaultSocialTone')}
                        </p>
                        {result.marketingFocus && result.marketingFocus.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm text-slate-600">{t('content.marketingFocus')}</div>
                            <div className="flex flex-wrap gap-2">
                              {result.marketingFocus.map((focus, index) => (
                                <Badge key={index} variant="secondary">
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
                  {result.recommendedImageStyles && result.recommendedImageStyles.length > 0 && (
                    <Card className="border-2 border-violet-200">
                      <CardHeader className="bg-gradient-to-r from-violet-50 to-fuchsia-50">
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="size-5 text-violet-600" />
                          {t('recommendations.title')}
                        </CardTitle>
                        <CardDescription>{t('recommendations.description')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                          {result.recommendedImageStyles.map((style, index) => {
                            const isSelected = selectedStyle === style;
                            return (
                              <div
                                key={index}
                                onClick={() => setSelectedStyle(isSelected ? null : style)}
                                className={`
                                  p-4 rounded-xl cursor-pointer transition-all
                                  ${isSelected 
                                    ? 'bg-violet-50 border-2 border-violet-500 shadow-md' 
                                    : 'bg-white/80 border border-violet-200 hover:border-violet-400 hover:shadow-sm'
                                  }
                                `}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  {isSelected ? (
                                    <CheckCircle2 className="size-4 text-violet-600" />
                                  ) : (
                                    <ImageIcon className="size-4 text-violet-600" />
                                  )}
                                  <span className={`text-sm font-medium ${isSelected ? 'text-violet-700' : 'text-slate-900'}`}>
                                    {style}
                                  </span>
                                </div>
                                <div className={`text-xs ${isSelected ? 'text-violet-600' : 'text-slate-600'}`}>
                                  {isSelected ? t('recommendations.selected') || '已选择' : t('recommendations.clickToUse')}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* CTA */}
                  <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white">
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <h3 className="text-2xl">{t('recommendations.ctaTitle')}</h3>
                          <p className="text-violet-100">{t('recommendations.ctaDescription')}</p>
                        </div>
                        <Button
                          size="lg"
                          className="bg-white text-violet-600 hover:bg-slate-50 shadow-xl gap-2"
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
              <DialogTitle className="text-slate-900 text-xl">{t('generationDialog.title')}</DialogTitle>
              <DialogDescription className="text-slate-600 text-base">{t('generationDialog.description')}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Generation Type Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-slate-900">{t('generationDialog.selectType')}</Label>
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    type="button"
                    onClick={() => handleGenerationTypeSelect('image')}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      generationType === 'image'
                        ? 'border-violet-500 bg-violet-50 shadow-lg shadow-violet-500/30'
                        : 'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/50'
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
                      <span className="font-semibold text-slate-900">{t('generationDialog.image')}</span>
                    </div>
                    <p className="text-sm text-slate-600">{t('generationDialog.imageDesc')}</p>
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => handleGenerationTypeSelect('video')}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      generationType === 'video'
                        ? 'border-violet-500 bg-violet-50 shadow-lg shadow-violet-500/30'
                        : 'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/50'
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
                      <span className="font-semibold text-slate-900">{t('generationDialog.video')}</span>
                    </div>
                    <p className="text-sm text-slate-600">{t('generationDialog.videoDesc')}</p>
                  </motion.button>
                </div>
              </div>

              {/* Generation Mode Selection */}
              {generationType && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-slate-900">{t('generationDialog.selectMode')}</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <motion.button
                      type="button"
                      onClick={() => handleGenerationModeSelect('single')}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        generationMode === 'single'
                          ? 'border-violet-500 bg-violet-50 shadow-lg shadow-violet-500/30'
                          : 'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/50'
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
                        <span className="font-semibold text-slate-900">{t('generationDialog.single')}</span>
                      </div>
                      <p className="text-sm text-slate-600">{t('generationDialog.singleDesc')}</p>
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={() => handleGenerationModeSelect('batch')}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        generationMode === 'batch'
                          ? 'border-violet-500 bg-violet-50 shadow-lg shadow-violet-500/30'
                          : 'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/50'
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
                        <span className="font-semibold text-slate-900">{t('generationDialog.batch')}</span>
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
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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

