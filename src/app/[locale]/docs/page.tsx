import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { creditsConfig } from '@/config/credits.config';
import { paymentConfig } from '@/config/payment.config';
import { getSEOMetadata } from '@/lib/seo/metadata-translations';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Coins,
  FileSpreadsheet,
  Image as ImageIcon,
  Sparkles,
  Upload,
  Video,
  Wand2,
  Zap,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return getSEOMetadata(locale, 'learn', '/docs');
}

export default function DocsPage() {
  const freePlan = paymentConfig.plans.find((p) => p.id === 'free');
  const proPlan = paymentConfig.plans.find((p) => p.id === 'pro');
  const nanoBananaCost = creditsConfig.consumption.imageGeneration['nano-banana'];
  const nanoBananaProCost = creditsConfig.consumption.imageGeneration['nano-banana-pro'];
  const videoCostMin = creditsConfig.consumption.videoGeneration['sora-2-720p-10s'];
  const videoCostMax = creditsConfig.consumption.videoGeneration['sora-2-pro-1080p-15s'];
  const dailyCheckin = creditsConfig.rewards.checkin.dailyCredits;
  const referralReward = creditsConfig.rewards.referral.creditsPerReferral;

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* SEO-optimized Header */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
          How to Use Viecom AI Image & Video Generator
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 max-w-3xl mx-auto">
          Complete step-by-step guides for creating stunning e-commerce visuals with AI. Learn how
          to generate product images, create marketing videos, and scale your content production.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/image-to-video-ai" className="text-teal-500 hover:underline">
            Image to Video AI Guide →
          </Link>
          <Link href="/ai-video-generator-free" className="text-teal-500 hover:underline">
            Free AI Video Generator →
          </Link>
          <Link href="/video-enhancer-ai" className="text-teal-500 hover:underline">
            Video Enhancer AI →
          </Link>
          <Link href="/models/nano-banana" className="text-teal-500 hover:underline">
            Nano Banana Pro Model →
          </Link>
        </div>
      </div>

      {/* Quick Start Guide */}
      <Card className="mb-8 border-teal-200 dark:border-teal-800">
        <CardHeader className="bg-teal-50 dark:bg-teal-900/20">
          <CardTitle className="flex items-center gap-2 text-2xl text-gray-900 dark:text-white">
            <Zap className="h-6 w-6 text-teal-500" />
            How to Get Started in 3 Easy Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Sign Up and Get Free Credits
                </h3>
                <p className="text-gray-700 dark:text-slate-300 text-sm mb-2">
                  Create your free account at{' '}
                  <Link href="/signup" className="text-teal-500 hover:underline">
                    viecom.pro/signup
                  </Link>{' '}
                  and receive {freePlan?.credits.onSignup || 30} free credits immediately. No credit
                  card required.
                </p>
                <p className="text-gray-600 dark:text-slate-400 text-xs">
                  💡 Tip: Earn {dailyCheckin} credits per day through daily check-ins and{' '}
                  {referralReward} credits per referral.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Choose Your Generation Type
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Text-to-Image:</strong> Describe your product and AI creates the image
                      ({nanoBananaCost}-{nanoBananaProCost} credits depending on model)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Image-to-Image:</strong> Upload a product image and transform its
                      style ({nanoBananaCost}-{nanoBananaProCost} credits depending on model)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Text-to-Video:</strong> Create product videos from descriptions (
                      {videoCostMin}-{videoCostMax} credits)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Image-to-Video:</strong> Animate product images (no people/faces) (
                      {videoCostMin}-{videoCostMax} credits)
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Generate and Download
                </h3>
                <p className="text-gray-700 dark:text-slate-300 text-sm mb-2">
                  Enter your prompt (or use AI enhancement), select your preferences (aspect ratio,
                  style, quality), and click Generate. Your content will be ready in 30 seconds to
                  13 minutes depending on the type.
                </p>
                <p className="text-gray-600 dark:text-slate-400 text-xs">
                  💾 Free plan: 7 days asset display | Pro/Pro+: 30 days asset display
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How-to Sections */}
      <div className="space-y-8">
        {/* Image Generation */}
        <Card className="border-teal-200 dark:border-teal-800">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-white">
              <ImageIcon className="h-6 w-6 text-teal-500" />
              How to Generate AI Images for Products
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Text-to-Image */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-teal-500" />
                  How to Create Images from Text Descriptions
                </h3>
                <ol className="space-y-2 text-sm text-gray-700 dark:text-slate-300 ml-6 list-decimal">
                  <li>
                    Navigate to{' '}
                    <Link href="/image-generation" className="text-teal-500 hover:underline">
                      Image Generation
                    </Link>{' '}
                    page
                  </li>
                  <li>
                    Select <strong>Text-to-Image</strong> mode
                  </li>
                  <li>
                    Enter your product description (e.g., "Modern wireless headphones on white
                    background, studio lighting")
                  </li>
                  <li>
                    Click <strong>Enhance Prompt</strong> to improve your description with AI
                    (optional)
                  </li>
                  <li>Choose aspect ratio (1:1 for square, 16:9 for landscape, etc.)</li>
                  <li>Select image style (Studio Shot, Lifestyle, Minimalist, etc.)</li>
                  <li>
                    Choose AI model: <strong>Nano Banana</strong> ({nanoBananaCost} credits) for
                    standard quality, or <strong>Nano Banana Pro</strong> ({nanoBananaProCost}{' '}
                    credits) for premium quality with enhanced detail and realism
                  </li>
                  <li>
                    Choose output format: <strong>PNG</strong> (lossless) or <strong>JPEG</strong>{' '}
                    (smaller file)
                  </li>
                  <li>
                    Click <strong>Generate Image</strong> button
                  </li>
                  <li>Wait 20-60 seconds for AI to create your image</li>
                  <li>Download the result or share directly</li>
                </ol>
                <p className="text-xs text-gray-600 dark:text-slate-400 mt-2">
                  ⚡ Cost: {nanoBananaCost}-{nanoBananaProCost} credits per image depending on model
                  (Nano Banana {nanoBananaCost} credits, Nano Banana Pro {nanoBananaProCost}{' '}
                  credits)
                </p>
              </div>

              {/* Image-to-Image */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-teal-500" />
                  How to Transform Existing Product Images
                </h3>
                <ol className="space-y-2 text-sm text-gray-700 dark:text-slate-300 ml-6 list-decimal">
                  <li>
                    Navigate to{' '}
                    <Link
                      href="/image-generation?mode=image-to-image"
                      className="text-teal-500 hover:underline"
                    >
                      Image Generation
                    </Link>{' '}
                    page
                  </li>
                  <li>
                    Select <strong>Image-to-Image</strong> mode
                  </li>
                  <li>Upload your source image (JPEG, PNG, or WebP, max 10MB)</li>
                  <li>
                    Enter transformation prompt (e.g., "Transform to watercolor style with pastel
                    colors")
                  </li>
                  <li>
                    Choose AI model: <strong>Nano Banana</strong> ({nanoBananaCost} credits) for
                    standard quality, or <strong>Nano Banana Pro</strong> ({nanoBananaProCost}{' '}
                    credits) for premium quality
                  </li>
                  <li>Select aspect ratio and output format</li>
                  <li>
                    Click <strong>Generate Image</strong>
                  </li>
                  <li>AI will transform your image while preserving the composition</li>
                </ol>
                <p className="text-xs text-gray-600 dark:text-slate-400 mt-2">
                  💡 Use cases: Style transfer, background removal, color adjustment
                </p>
              </div>

              {/* Available Styles */}
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                  Available Image Styles:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 dark:text-slate-300">
                  <div>
                    • <strong>Studio Shot:</strong> Professional product photography
                  </div>
                  <div>
                    • <strong>Lifestyle:</strong> Real-life context and natural setting
                  </div>
                  <div>
                    • <strong>Minimalist:</strong> Clean, simple composition
                  </div>
                  <div>
                    • <strong>Seasonal:</strong> Holiday and seasonal themes
                  </div>
                  <div>
                    • <strong>Infographic:</strong> Product info overlays
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video Generation */}
        <Card className="border-teal-200 dark:border-teal-800">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-white">
              <Video className="h-6 w-6 text-teal-500" />
              How to Generate AI Videos for E-commerce
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Text-to-Video */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-teal-500" />
                  How to Create Videos from Text Prompts
                </h3>
                <ol className="space-y-2 text-sm text-gray-700 dark:text-slate-300 ml-6 list-decimal">
                  <li>
                    Go to{' '}
                    <Link href="/video-generation" className="text-teal-500 hover:underline">
                      Video Generation
                    </Link>{' '}
                    page
                  </li>
                  <li>
                    Select <strong>Text-to-Video</strong> mode
                  </li>
                  <li>
                    Write your video description (e.g., "Professional smartphone rotating smoothly,
                    studio lighting")
                  </li>
                  <li>Choose video style (Spoken Script, Cinematic, Product Demo, etc.)</li>
                  <li>
                    Select model: <strong>Sora 2</strong> (economical) or{' '}
                    <strong>Sora 2 Pro</strong> (premium quality)
                  </li>
                  <li>Choose aspect ratio: Landscape (16:9) or Portrait (9:16)</li>
                  <li>
                    Select duration: <strong>10 seconds</strong> or <strong>15 seconds</strong>
                  </li>
                  <li>For Sora 2 Pro, choose quality: Standard (720P) or High (1080P)</li>
                  <li>
                    Click <strong>Generate Video</strong>
                  </li>
                  <li>Wait 2-13 minutes depending on quality and length</li>
                </ol>
                <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>💰 Credit Costs:</strong> Sora 2:{' '}
                    {creditsConfig.consumption.videoGeneration['sora-2-720p-10s']}-
                    {creditsConfig.consumption.videoGeneration['sora-2-720p-15s']} credits | Sora 2
                    Pro: {creditsConfig.consumption.videoGeneration['sora-2-pro-720p-10s']}-
                    {creditsConfig.consumption.videoGeneration['sora-2-pro-1080p-15s']} credits
                  </p>
                </div>
              </div>

              {/* Image-to-Video */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-teal-500" />
                  How to Animate Product Images into Videos
                </h3>
                <div className="mb-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    <strong>⚠️ Important:</strong> Image-to-video does NOT support images with
                    people, faces, or human figures. Use product images, objects, or landscapes
                    only.
                  </p>
                </div>
                <ol className="space-y-2 text-sm text-gray-700 dark:text-slate-300 ml-6 list-decimal">
                  <li>
                    Go to{' '}
                    <Link
                      href="/video-generation?mode=image-to-video"
                      className="text-teal-500 hover:underline"
                    >
                      Video Generation
                    </Link>{' '}
                    page
                  </li>
                  <li>
                    Select <strong>Image-to-Video</strong> mode
                  </li>
                  <li>Upload product image (no people or faces, max 10MB)</li>
                  <li>
                    Enter motion description (e.g., "Smooth rotation showcasing product details")
                  </li>
                  <li>Configure model, duration, and quality settings</li>
                  <li>Generate and download your video</li>
                </ol>
                <p className="text-xs text-gray-600 dark:text-slate-400 mt-2">
                  ✅ Supported: Products, objects, landscapes, abstract content
                </p>
              </div>

              {/* Video Styles */}
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                  Available Video Styles:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 dark:text-slate-300">
                  <div>
                    • <strong>Spoken Script:</strong> Voiceover-style presentation
                  </div>
                  <div>
                    • <strong>Product Comparison:</strong> Side-by-side showcase
                  </div>
                  <div>
                    • <strong>Narrative/Comedy:</strong> Storytelling approach
                  </div>
                  <div>
                    • <strong>360° Showcase:</strong> Complete product rotation
                  </div>
                  <div>
                    • <strong>Product Demo:</strong> Feature highlights
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand Analysis */}
        <Card className="border-teal-200 dark:border-teal-800">
          <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
            <CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-white">
              <Sparkles className="h-6 w-6 text-teal-500" />
              How to Use Brand Analysis for Consistent Content
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-teal-500" />
                  How to Analyze Your Brand Automatically
                </h3>
                <ol className="space-y-2 text-sm text-gray-700 dark:text-slate-300 ml-6 list-decimal">
                  <li>
                    Navigate to{' '}
                    <Link href="/brand-analysis" className="text-teal-500 hover:underline">
                      Brand Analysis
                    </Link>{' '}
                    page
                  </li>
                  <li>Enter your company website URL</li>
                  <li>
                    Click <strong>Start Analysis</strong>
                  </li>
                  <li>AI will analyze your brand tone, colors, audience, and content strategy</li>
                  <li>
                    Review the analysis results (brand personality, visual style, target audience)
                  </li>
                  <li>Select a recommended image/video style</li>
                  <li>
                    Click <strong>Start Creating</strong> to use brand context in generation
                  </li>
                  <li>Your brand data will be automatically applied to prompts</li>
                </ol>
                <p className="text-xs text-gray-600 dark:text-slate-400 mt-2">
                  🎨 Brand context includes: tone, colors, audience, recommended styles
                </p>
              </div>

              <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4 border border-teal-200 dark:border-teal-800">
                <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2 text-sm">
                  Benefits of Brand Analysis:
                </h4>
                <ul className="space-y-1 text-xs text-purple-800 dark:text-purple-200">
                  <li>✓ Consistent brand voice across all generated content</li>
                  <li>✓ AI-recommended styles matching your brand</li>
                  <li>✓ Automatic color palette integration</li>
                  <li>✓ Target audience-optimized visuals</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Batch Generation */}
        <Card className="border-teal-200 dark:border-teal-800">
          <CardHeader className="bg-gradient-to-r from-green-50 to-purple-50 dark:from-green-900/20 dark:to-purple-900/20">
            <CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-white">
              <FileSpreadsheet className="h-6 w-6 text-teal-500" />
              How to Use Batch Generation for Scale
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-teal-500" />
                  How to Generate Multiple Images at Once
                </h3>
                <ol className="space-y-2 text-sm text-gray-700 dark:text-slate-300 ml-6 list-decimal">
                  <li>
                    Go to{' '}
                    <Link href="/batch-image-generation" className="text-teal-500 hover:underline">
                      Batch Image Generation
                    </Link>{' '}
                    page
                  </li>
                  <li>Download the Excel or CSV template</li>
                  <li>Fill in product names, descriptions, and prompts for each row</li>
                  <li>Upload the completed file</li>
                  <li>Select generation settings (aspect ratio, style, output format)</li>
                  <li>Review the data preview and edit prompts if needed</li>
                  <li>
                    Click <strong>Enhance All Prompts</strong> to improve all descriptions
                    (optional)
                  </li>
                  <li>
                    Select rows to generate and click <strong>Start Batch Generation</strong>
                  </li>
                  <li>Monitor progress in real-time</li>
                  <li>Download all results as a ZIP file</li>
                </ol>
                <p className="text-xs text-gray-600 dark:text-slate-400 mt-2">
                  🚀 Concurrency: Free (1), Pro (3), Pro+ (10) concurrent generations
                </p>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-teal-500" />
                  How to Generate Multiple Videos at Once
                </h3>
                <ol className="space-y-2 text-sm text-gray-700 dark:text-slate-300 ml-6 list-decimal">
                  <li>
                    Visit{' '}
                    <Link href="/batch-video-generation" className="text-teal-500 hover:underline">
                      Batch Video Generation
                    </Link>{' '}
                    page
                  </li>
                  <li>Download and fill the template with video prompts</li>
                  <li>For Image-to-Video mode, include product image URLs in the template</li>
                  <li>Upload your completed file</li>
                  <li>Configure model (Sora 2/Sora 2 Pro), duration (10s/15s), and quality</li>
                  <li>The system will intelligently process videos based on priority</li>
                  <li>Faster videos (Sora 2, 720P, 10s) are processed first</li>
                  <li>Download completed videos individually or in bulk</li>
                </ol>
                <p className="text-xs text-gray-600 dark:text-slate-400 mt-2">
                  ⚡ Pro tip: Use Sora 2 for drafts, Sora 2 Pro 1080P for final deliverables
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                  Template File Format:
                </h4>
                <div className="text-xs text-gray-700 dark:text-slate-300 space-y-1">
                  <p>
                    <strong>Required columns:</strong> prompt (or productName + productDescription)
                  </p>
                  <p>
                    <strong>Optional columns:</strong> baseImageUrl (for I2I/I2V),
                    productSellingPoints, enhancedPrompt
                  </p>
                  <p>
                    <strong>Supported formats:</strong> .xlsx, .xls, .csv
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credits & Pricing Section */}
      <Card className="mt-8 border-teal-200 dark:border-teal-800">
        <CardHeader className="bg-teal-50 dark:bg-teal-900/20">
          <CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-white">
            <Wand2 className="h-6 w-6 text-teal-500" />
            How to Manage Credits and Choose Plans
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                How Do Credits Work?
              </h3>
              <p className="text-sm text-gray-700 dark:text-slate-300 mb-3">
                Viecom uses a credit-based system. Each generation consumes credits based on the AI
                model and settings used.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-200 text-sm mb-2">
                    Image Generation
                  </h4>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    {nanoBananaCost}-{nanoBananaProCost} credits per image (Nano Banana{' '}
                    {nanoBananaCost} credits, Nano Banana Pro {nanoBananaProCost} credits, Flux
                    models 5-10 credits)
                  </p>
                </div>
                <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-3 border border-teal-200 dark:border-teal-800">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-200 text-sm mb-2">
                    Video Generation
                  </h4>
                  <p className="text-xs text-purple-800 dark:text-purple-200">
                    {videoCostMin}-{videoCostMax} credits per video (varies by model, quality,
                    duration)
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                How to Get More Credits?
              </h3>
              <p className="text-sm text-gray-700 dark:text-slate-300 mb-4">
                You have several options to get more credits:
              </p>
              <div className="grid md:grid-cols-2 gap-3 mb-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                  <div className="font-semibold text-green-900 dark:text-green-200 text-sm mb-1">
                    Daily Check-in
                  </div>
                  <div className="text-xs text-green-800 dark:text-green-200">
                    +{dailyCheckin} credits/day
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                  <div className="font-semibold text-blue-900 dark:text-blue-200 text-sm mb-1">
                    Referral Program
                  </div>
                  <div className="text-xs text-blue-800 dark:text-blue-200">
                    +{referralReward} credits per referral
                  </div>
                </div>
                <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-3 border border-teal-200 dark:border-teal-800">
                  <div className="font-semibold text-purple-900 dark:text-purple-200 text-sm mb-1">
                    Social Sharing
                  </div>
                  <div className="text-xs text-purple-800 dark:text-purple-200">
                    +{creditsConfig.rewards.socialShare.creditsPerShare} credits per share
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                  <div className="font-semibold text-purple-900 dark:text-purple-200 text-sm mb-1">
                    Purchase Credit Packs
                  </div>
                  <div className="text-xs text-purple-800 dark:text-purple-200">
                    Starting at $9.90 for 200 credits (never expire)
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-400">
                💡 <strong>Tip:</strong> Credit packs are perfect if you need extra credits without
                committing to a subscription. Visit the{' '}
                <Link href="/pricing" className="text-teal-500 hover:underline">
                  Pricing page
                </Link>{' '}
                to purchase credit packs or upgrade to Pro/Pro+ for monthly allocations.
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                How to Choose the Right Plan?
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-gray-100 dark:bg-slate-700 rounded px-2 py-1 text-xs font-bold text-gray-700 dark:text-slate-200">
                    FREE
                  </div>
                  <div className="flex-1 text-sm text-gray-700 dark:text-slate-300">
                    Perfect for testing: {freePlan?.credits.onSignup} credits sign-up bonus, daily
                    check-in rewards, basic features, 7 days asset display
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-teal-500 text-white rounded px-2 py-1 text-xs font-bold">
                    PRO
                  </div>
                  <div className="flex-1 text-sm text-gray-700 dark:text-slate-300">
                    For creators: {proPlan?.credits.monthly} credits/month (${proPlan?.price}/mo),
                    Sora 2 & Sora 2 Pro access, batch generation (3 concurrent), commercial license,
                    30 days asset display
                  </div>
                </div>
                <p className="text-xs text-teal-500 mt-2">
                  <Link href="/pricing" className="hover:underline">
                    View full pricing comparison →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-900 dark:text-white">
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                How long does it take to generate content?
              </h3>
              <p className="text-sm text-gray-700 dark:text-slate-300">
                <strong>Images:</strong> 20-60 seconds | <strong>Videos:</strong> 2-3 minutes (Sora
                2, 720P) to 8-13 minutes (Sora 2 Pro, 1080P). Batch generation processes multiple
                items concurrently based on your plan.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                How do I enhance my prompts with AI?
              </h3>
              <p className="text-sm text-gray-700 dark:text-slate-300">
                Click the <strong>Enhance Prompt</strong> button (with sparkle icon) on any
                generation page. AI will analyze your description and add professional details,
                lighting, composition, and style keywords. You can edit the enhanced prompt before
                generating.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                How to use brand analysis with batch generation?
              </h3>
              <p className="text-sm text-gray-700 dark:text-slate-300">
                First, run brand analysis on your website. Then, when you click "Start Creating" and
                choose batch generation, your brand data (tone, colors, style) will be automatically
                applied to all generated content. You'll see a "Brand Context Applied" card in the
                batch generation page.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                How to download and manage my generated assets?
              </h3>
              <p className="text-sm text-gray-700 dark:text-slate-300">
                All generated content is saved in your{' '}
                <Link href="/assets" className="text-teal-500 hover:underline">
                  Assets Library
                </Link>
                . Free plan: assets display for 7 days. Pro/Pro+ plans: 30 days. You can download
                individual assets or bulk download from batch generation results.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                How to maximize my free credits?
              </h3>
              <p className="text-sm text-gray-700 dark:text-slate-300">
                Combine all reward methods: {freePlan?.credits.onSignup} credits sign-up bonus +
                daily check-in ({dailyCheckin} credits/day) + refer friends ({referralReward}{' '}
                credits each) + share content ({creditsConfig.rewards.socialShare.creditsPerShare}{' '}
                credits/share). In one month, you could earn {freePlan?.credits.onSignup} + (
                {dailyCheckin} × 30) + referrals = 100+ free credits!
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                How to choose between Sora 2 and Sora 2 Pro?
              </h3>
              <p className="text-sm text-gray-700 dark:text-slate-300">
                <strong>Sora 2 (720P):</strong> Best for drafts, iterations, and budget-conscious
                projects. Costs {creditsConfig.consumption.videoGeneration['sora-2-720p-10s']}-
                {creditsConfig.consumption.videoGeneration['sora-2-720p-15s']} credits, generates in
                2-3 minutes.
                <br />
                <br />
                <strong>Sora 2 Pro (720P/1080P):</strong> Premium quality for final deliverables.
                Better physics, motion, and detail. Costs{' '}
                {creditsConfig.consumption.videoGeneration['sora-2-pro-720p-10s']}-
                {creditsConfig.consumption.videoGeneration['sora-2-pro-1080p-15s']} credits,
                generates in 5-13 minutes.
                <br />
                <br />💡 <strong>Pro Tip:</strong> Use Sora 2 for testing and previews, then upgrade
                to Sora 2 Pro 1080P for final marketing materials.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Section */}
      <Card className="mt-8 border-teal-200 dark:border-teal-800">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
          <CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-white">
            <Sparkles className="h-6 w-6 text-teal-500" />
            How Viecom Compares to Alternatives
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Why Choose Viecom Over Other AI Tools?
              </h3>
              <div className="overflow-x-auto mb-8 shadow-lg rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse bg-white dark:bg-slate-800">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="py-4 px-4 text-slate-500 font-medium uppercase tracking-wider text-sm">Feature</th>
                      <th className="py-4 px-4 bg-teal-500/5 text-teal-500 font-bold text-base border-x border-teal-500/10">Viecom</th>
                      <th className="py-4 px-4 text-slate-900 dark:text-white font-bold opacity-60">Alternative Tools</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {[
                      { feature: 'Core Technology', viecom: 'Nano Banana Pro (Proprietary)', alt: 'Generic Models' },
                      { feature: 'Video Generation', viecom: '✅ Native (Sora 2)', alt: '❌ No' },
                      { feature: 'Batch Processing', viecom: '✅ Excel/CSV Upload', alt: '⚠️ Limited' },
                      { feature: 'Product Integrity', viecom: '✅ Geometry Lock', alt: '❌ Hallucination Risk' },
                      { feature: 'Commercial License', viecom: '✅ Included', alt: '✅ Included' },
                      { feature: 'Platform Compliance', viecom: '✅ Amazon/TikTok/Shopify', alt: '⚠️ Manual' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4 font-medium text-sm text-slate-900 dark:text-white">{row.feature}</td>
                        <td className="py-3 px-4 bg-teal-500/5 font-bold text-sm text-teal-500 border-x border-teal-500/10">{row.viecom}</td>
                        <td className="py-3 px-4 text-sm text-slate-500">{row.alt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="text-teal-500" /> The Video Advantage
                </h4>
                <p className="text-slate-400 mb-4 text-sm">
                  Most alternatives only give you static JPEGs. In 2024, video ads convert <strong>86% higher</strong> than images.
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                    <span className="text-sm">Static Image CTR</span>
                    <span className="font-mono text-xs text-slate-400">0.8%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-teal-500/20 border border-teal-500/50 rounded-lg">
                    <span className="text-sm font-bold text-teal-500">Viecom Video CTR</span>
                    <span className="font-mono text-xs font-bold text-teal-500">3.2%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Coins className="text-orange-500" /> Cost Analysis
                </h4>
                <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">Cost to produce 10 Product Videos:</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-20 text-xs font-bold">Traditional</div>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
                      <div className="absolute top-0 left-0 h-full bg-slate-400 w-[100%]" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white">$2,500+</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20 text-xs font-bold">Alternatives</div>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
                      <div className="absolute top-0 left-0 h-full bg-slate-300 w-[0%]" />
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">Not Supported</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20 text-xs font-bold text-teal-500">Viecom</div>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
                      <div className="absolute top-0 left-0 h-full bg-teal-500 w-[10%]" />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white">Competitive</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4 border border-teal-200 dark:border-teal-800">
              <h4 className="font-semibold text-teal-900 dark:text-teal-200 mb-2 text-sm">Key Differentiators:</h4>
              <ul className="space-y-1 text-xs text-teal-800 dark:text-teal-200">
                <li>✓ Native video generation (Sora 2) - most alternatives don't offer this</li>
                <li>✓ Advanced batch processing with CSV upload for enterprise scale</li>
                <li>✓ Nano Banana Pro model ensures 100% product detail preservation</li>
                <li>✓ Platform-specific compliance (Amazon, TikTok, Shopify) built-in</li>
                <li>✓ Commercial license included in all plans</li>
              </ul>
              <div className="mt-4 pt-4 border-t border-teal-200 dark:border-teal-800">
                <p className="text-xs text-teal-700 dark:text-teal-300 mb-2">Platform-Specific Solutions:</p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/solutions/amazon" className="text-xs text-teal-600 dark:text-teal-400 hover:underline">
                    Amazon Solutions →
                  </Link>
                  <Link href="/solutions/tiktok" className="text-xs text-teal-600 dark:text-teal-400 hover:underline">
                    TikTok Solutions →
                  </Link>
                  <Link href="/solutions/shopify" className="text-xs text-teal-600 dark:text-teal-400 hover:underline">
                    Shopify Solutions →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help CTA */}
      <div className="mt-12 bg-gradient-to-r from-teal-500 to-pink-600 dark:from-teal-600 dark:to-pink-700 rounded-lg p-8 text-center text-white">
        <h3 className="text-2xl font-bold mb-4">Need More Help?</h3>
        <p className="text-purple-100 dark:text-purple-200 mb-6">
          Our support team is ready to assist you with any questions about AI image and video
          generation.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-teal-500 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            Contact Support
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
          >
            View Pricing Plans
          </Link>
        </div>
      </div>
    </div>
  );
}
