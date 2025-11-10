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
  Globe,
  Image as ImageIcon,
  Loader2,
  Share2,
  Sparkles,
  Upload,
  Wand2,
  X,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface GenerationResult {
  imageUrl: string;
  prompt: string;
  model: string;
  error?: string;
}

type GenerationMode = 'text-to-image' | 'image-to-image';

export default function ImageGenerator() {
  const searchParams = useSearchParams();
  const initialMode = (searchParams?.get('mode') as GenerationMode) || 'text-to-image';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New fields for brand and product information
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isAnalyzingBrand, setIsAnalyzingBrand] = useState(false);
  const [brandAnalysis, setBrandAnalysis] = useState<BrandToneAnalysis | null>(null);
  const [productSellingPoints, setProductSellingPoints] = useState('');
  const [useBrandContext, setUseBrandContext] = useState(false);

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
          setWebsiteUrl(brandData.website || '');
          setUseBrandContext(true);
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

  const handleAnalyzeBrand = async () => {
    if (!websiteUrl.trim()) {
      alert('Please enter a website URL');
      return;
    }

    setIsAnalyzingBrand(true);
    try {
      const response = await fetch('/api/v1/analyze-brand-tone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl: websiteUrl.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze brand tone');
      }

      const data = await response.json();
      setBrandAnalysis(data.data);
      setUseBrandContext(true);
    } catch (error) {
      console.error('Brand analysis error:', error);
      alert(error instanceof Error ? error.message : 'Failed to analyze brand tone');
    } finally {
      setIsAnalyzingBrand(false);
    }
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
      };

      // Include brand context if available and enabled
      if (useBrandContext && brandAnalysis) {
        requestBody.brandTone = brandAnalysis.brandTone;
        requestBody.productFeatures = brandAnalysis.productFeatures;
        requestBody.styleKeywords = brandAnalysis.styleKeywords;
        requestBody.colorPalette = brandAnalysis.colorPalette;
      }

      // Include product selling points if provided
      if (productSellingPoints.trim()) {
        requestBody.productSellingPoints = productSellingPoints
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
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

      // Add brand context and selling points to the prompt if available
      if (useBrandContext && brandAnalysis) {
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

      if (productSellingPoints.trim()) {
        const sellingPoints = productSellingPoints
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (sellingPoints.length > 0) {
          finalPrompt = `${finalPrompt}\n\nProduct selling points: ${sellingPoints.join(', ')}`;
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
        prompt: prompt,
        model: data.model,
      });

      setIsGenerating(false);
    } catch (error) {
      setResult({
        imageUrl: '',
        prompt: prompt,
        model: 'nano-banana',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      setIsGenerating(false);
    }
  };

  const handleDownload = async (imageUrl: string) => {
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
      window.open(imageUrl, '_blank');
    }
  };

  const handleShare = async () => {
    if (!result?.imageUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Generated Image',
          text: 'Check out this AI-generated image!',
          url: result.imageUrl,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      navigator.clipboard.writeText(result.imageUrl);
      alert('Image URL copied to clipboard!');
    }
  };

  const canGenerate = prompt.trim().length > 0;

  return (
    <div className="mx-auto max-w-7xl">
      <Tabs value={mode} onValueChange={(v) => setMode(v as GenerationMode)} className="w-full">
        <TabsList className="mx-auto mb-8 grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="text-to-image" className="font-light">
            <Sparkles className="mr-2 h-4 w-4" />
            Text to Image
          </TabsTrigger>
          <TabsTrigger value="image-to-image" className="font-light">
            <ImageIcon className="mr-2 h-4 w-4" />
            Image to Image
          </TabsTrigger>
        </TabsList>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            {/* Brand Analysis Section */}
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-purple-600" />
                  <Label className="text-base font-semibold">Brand Analysis (Optional)</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website-url" className="text-sm text-gray-600">
                    Company Website URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="website-url"
                      type="url"
                      placeholder="https://example.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleAnalyzeBrand}
                      disabled={isAnalyzingBrand || !websiteUrl.trim()}
                      variant="outline"
                      className="border-purple-500 text-purple-700 hover:bg-purple-50"
                    >
                      {isAnalyzingBrand ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      {isAnalyzingBrand ? 'Analyzing...' : 'Analyze'}
                    </Button>
                  </div>
                </div>
                {brandAnalysis && (
                  <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-purple-900">Brand Analysis</span>
                      <Button
                        onClick={() => {
                          setBrandAnalysis(null);
                          setUseBrandContext(false);
                        }}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1 text-xs text-purple-800">
                      {brandAnalysis.brandTone.length > 0 && (
                        <p>
                          <strong>Tone:</strong> {brandAnalysis.brandTone.join(', ')}
                        </p>
                      )}
                      {brandAnalysis.styleKeywords.length > 0 && (
                        <p>
                          <strong>Style:</strong> {brandAnalysis.styleKeywords.join(', ')}
                        </p>
                      )}
                      {brandAnalysis.colorPalette.length > 0 && (
                        <p>
                          <strong>Colors:</strong> {brandAnalysis.colorPalette.join(', ')}
                        </p>
                      )}
                    </div>
                    <label className="mt-2 flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={useBrandContext}
                        onChange={(e) => setUseBrandContext(e.target.checked)}
                        className="rounded"
                      />
                      <span>Use brand context in prompt enhancement</span>
                    </label>
                  </div>
                )}
              </div>
            </Card>

            {/* Product Selling Points Section */}
            <div className="space-y-2">
              <Label htmlFor="selling-points" className="text-sm font-semibold">
                Product Selling Points (Optional)
              </Label>
              <Textarea
                id="selling-points"
                placeholder="e.g., Eco-friendly, Premium quality, Fast shipping, 24/7 support"
                value={productSellingPoints}
                onChange={(e) => setProductSellingPoints(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <p className="text-xs text-gray-500">
                Separate multiple points with commas. These will be incorporated into the prompt.
              </p>
            </div>

            <TabsContent value="text-to-image" className="mt-0 space-y-6">
              <div className="space-y-2">
                <Label className="font-light text-gray-700 text-sm">Image Description</Label>
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
                    {isEnhancing ? 'Enhancing...' : 'Enhance'}
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
                        Enhanced Prompt
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
                <Label className="font-light text-gray-700 text-sm">Source Image</Label>

                {!imagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="hover-card cursor-pointer rounded-xl border border-dashed border-gray-300 p-8 text-center transition-colors hover:border-purple-400"
                  >
                    <Upload className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                    <p className="mb-1 font-light text-gray-600 text-sm">
                      Click to upload or drag and drop
                    </p>
                    <p className="font-light text-gray-400 text-xs">
                      JPEG, PNG, or WebP (max 10MB)
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
                  Transformation Prompt <span className="text-red-500">*</span>
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
                    {isEnhancing ? 'Enhancing...' : 'Enhance'}
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
                        Enhanced Prompt
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
                      {style.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-light text-gray-700 text-sm">Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="border-gray-200 font-light">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nano-banana">
                      Nano Banana (Gemini 2.5 Flash) -{' '}
                      {creditsConfig.consumption.imageGeneration['nano-banana']} credits
                    </SelectItem>
                    <SelectItem value="flux-1.1-pro">
                      Flux 1.1 Pro - {creditsConfig.consumption.imageGeneration['flux-1.1-pro']}{' '}
                      credits
                    </SelectItem>
                    <SelectItem value="flux-1.1-ultra">
                      Flux 1.1 Ultra - {creditsConfig.consumption.imageGeneration['flux-1.1-ultra']}{' '}
                      credits
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-light text-gray-700 text-sm">Aspect Ratio</Label>
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

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
              <p className="text-gray-700">
                <strong>Credits:</strong> Dynamic based on model
              </p>
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
                  Generating Image...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-5 w-5" />
                  Generate Image
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
                      Your generated image will appear here
                    </p>
                  </div>
                </div>
              )}

              {isGenerating && (
                <div className="flex aspect-square items-center justify-center rounded-xl bg-gray-100">
                  <div className="space-y-4 text-center">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-purple-600" />
                    <p className="font-light text-base text-gray-700">Generating your image...</p>
                    <p className="font-light text-gray-500 text-xs">This may take a few moments</p>
                  </div>
                </div>
              )}

              {result && !result.error && result.imageUrl && (
                <div className="space-y-4">
                  <img src={result.imageUrl} alt="Generated" className="w-full rounded-xl" />
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => handleDownload(result.imageUrl)}
                      variant="outline"
                      className="border-gray-200 font-light"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      onClick={handleShare}
                      variant="outline"
                      className="border-gray-200 font-light"
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </div>
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
