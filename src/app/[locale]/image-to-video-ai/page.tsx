import { Button } from '@/components/ui/button';
import { creditsConfig } from '@/config/credits.config';
import { paymentConfig } from '@/config/payment.config';
import { getImageToVideoFAQSchema, getPricingData } from '@/lib/utils/faq-generator';
import { buildLocaleCanonicalMetadata } from '@/lib/seo/metadata';
import { ArrowRight, Check, Clock, Sparkles, TrendingUp, Zap } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const baseMetadata = buildLocaleCanonicalMetadata(locale, '/image-to-video-ai');

  if (locale === 'zh') {
    return {
      ...baseMetadata,
      title: '图片转视频AI工具免费 | 产品照片60秒变视频',
      description:
        '用AI将产品图片转换为吸引人的视频。上传照片，立即获得专业视频。Sora 2模型，720p/1080p质量。注册送30积分免费试用。',
      keywords: [
        '图片转视频',
        '图片转视频AI',
        '免费图片转视频',
        'AI图片转视频生成器',
        '产品照片转视频',
        '电商视频AI',
      ],
      openGraph: {
        title: '图片转视频AI工具免费 | 产品照片转视频',
        description: '用AI将产品图片转换为吸引人的视频。注册送30积分免费试用。',
        type: 'website',
      },
    };
  }

  return {
    ...baseMetadata,
    title: 'Image to Video AI Free | Product Photos to Videos in 60 Seconds',
    description:
      'Transform product images into engaging videos with AI. Upload photos, get professional videos instantly. Sora 2 models, 720p/1080p quality. Free trial with 30 credits sign-up bonus.',
    keywords: [
      'image to video',
      'image to video ai',
      'image to video ai free',
      'ai image to video generator',
      'product photos to videos',
      'e-commerce video ai',
    ],
    openGraph: {
      title: 'Image to Video AI Free | Product Photos to Videos',
      description:
        'Transform product images into engaging videos with AI. Free trial with 30 credits sign-up bonus.',
      type: 'website',
    },
  };
}

const useCases = [
  {
    title: 'E-commerce Product Videos',
    description:
      'Turn static product photos into dynamic videos for Amazon, Shopify, and Etsy listings.',
    icon: TrendingUp,
  },
  {
    title: 'Social Media Content',
    description: 'Create engaging Instagram Reels, TikTok videos, and YouTube Shorts from images.',
    icon: Sparkles,
  },
  {
    title: 'Marketing Campaigns',
    description: 'Generate professional video ads from product photography in minutes.',
    icon: Zap,
  },
];

const features = [
  'Upload product images (PNG, JPG, WebP)',
  '720p videos in 2-3 minutes',
  '1080p videos in 5-7 minutes (Sora 2 Pro)',
  'Multiple video styles and effects',
  'Batch generation (up to 5 videos simultaneously)',
  'No video editing skills required',
  'Brand tone consistency',
  'Download in MP4 format',
];

const getPricingComparison = () => {
  const pricing = getPricingData();
  const sora2Cost = pricing.credits.sora2_720p_10s;
  const imageCount = Math.floor(pricing.free.signupCredits / pricing.credits.imageCostMin);
  const proVideoCount = Math.floor(pricing.pro.monthlyCredits / sora2Cost);
  const proplusVideoCount = Math.floor(pricing.proplus.monthlyCredits / sora2Cost);

  return [
    {
      plan: 'Free',
      credits: `${pricing.free.signupCredits} credits (sign-up bonus, one-time)`,
      videos: `Up to 1 video (or ${imageCount} images)`,
      price: '$0',
      features: ['720p quality', 'Sora 2 model', `${pricing.free.batchSize} video at a time`, 'Watermark'],
    },
    {
      plan: 'Pro',
      credits: `${pricing.pro.monthlyCredits} credits/month`,
      videos: `Up to ${proVideoCount} videos`,
      price: `$${pricing.pro.price}`,
      features: ['720p/1080p quality', 'Sora 2 & 2 Pro', `${pricing.pro.batchSize} videos at once`, 'No watermark'],
      popular: true,
    },
    {
      plan: 'Pro+',
      credits: `${pricing.proplus.monthlyCredits} credits/month`,
      videos: `Up to ${proplusVideoCount} videos`,
      price: `$${pricing.proplus.price}`,
      features: ['720p/1080p quality', 'Priority processing', `${pricing.proplus.batchSize} videos at once`, 'No watermark'],
    },
  ];
};

const pricingComparison = getPricingComparison();

export default function ImageToVideoAIPage() {
  const pricing = getPricingData();
  const sora2Cost = `${pricing.credits.sora2_720p_10s}-${pricing.credits.sora2_720p_15s}`;
  const sora2ProCost = `${pricing.credits.sora2Pro_720p_10s}-${pricing.credits.sora2Pro_1080p_15s}`;
  const imageCount = Math.floor(pricing.free.signupCredits / pricing.credits.imageCostMin);
  
  const howItWorksSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Convert Images to Videos with AI',
    description: 'Step-by-step guide to transform product photos into engaging videos using AI',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Upload Your Product Image',
        text: 'Upload your product photo (PNG, JPG, or WebP format). Our AI supports high-resolution images.',
        position: 1,
      },
      {
        '@type': 'HowToStep',
        name: 'Choose Video Settings',
        text: 'Select video resolution (720p or 1080p), duration (5-15 seconds), and style preferences.',
        position: 2,
      },
      {
        '@type': 'HowToStep',
        name: 'Generate & Download',
        text: 'Click generate and wait 2-7 minutes. Download your professional video in MP4 format.',
        position: 3,
      },
    ],
  };

  const faqSchema = getImageToVideoFAQSchema();

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Viecom Image to Video AI',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema is safe
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howItWorksSchema) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema is safe
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema is safe
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />

      <div className="container-base py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 px-4 py-2 rounded-full border border-teal-200 dark:border-teal-800 mb-6">
            <Sparkles className="h-4 w-4 text-teal-500" />
            <span className="text-sm font-medium text-teal-900 dark:text-teal-100">
              #1 Image to Video AI for E-commerce
            </span>
          </div>

          <h1 className="h1-hero text-center mb-6">
            Transform Product Photos into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">
              Engaging Videos
            </span>{' '}
            in 60 Seconds
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
            Upload your product images and let AI create professional videos for e-commerce, social
            media, and ads. No video editing skills required. Free trial with 30 credits sign-up
            bonus (one-time).
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/video-generation">
              <Button size="lg" className="btn-primary text-lg px-8 py-6 group">
                Try Free - No Credit Card
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                View Pricing
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>30 Free Credits</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Cancel Anytime</span>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mb-20">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-8 md:p-12 border border-slate-200 dark:border-slate-700">
            <h2 className="h2-section text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                  Upload Image
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Upload your product photo (PNG, JPG, WebP). High-resolution images work best.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                  Choose Settings
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Select resolution (720p/1080p), duration (5-15s), and video style preferences.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                  Generate & Download
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Wait 2-7 minutes and download your professional video in MP4 format.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mb-20">
          <h2 className="h2-section text-center mb-12">Perfect For</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase) => (
              <div
                key={useCase.title}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <useCase.icon className="h-12 w-12 text-teal-500 mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                  {useCase.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="h2-section text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <Check className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-lg text-slate-700 dark:text-slate-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto mb-20">
          <h2 className="h2-section text-center mb-4">Simple, Transparent Pricing</h2>
          <p className="text-center text-slate-600 dark:text-slate-400 mb-12">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {pricingComparison.map((plan) => (
              <div
                key={plan.plan}
                className={`bg-white dark:bg-slate-900 border-2 rounded-xl p-8 ${
                  plan.popular
                    ? 'border-teal-500 shadow-xl scale-105'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {plan.popular && (
                  <div className="bg-gradient-to-r from-teal-500 to-blue-500 text-white text-sm font-semibold px-4 py-1 rounded-full inline-block mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
                  {plan.plan}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">
                    {plan.price}
                  </span>
                  {plan.price !== '$0' && (
                    <span className="text-slate-600 dark:text-slate-400">/month</span>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{plan.credits}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{plan.videos}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-slate-700 dark:text-slate-300"
                    >
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.plan === 'Free' ? '/video-generation' : '/pricing'}>
                  <Button
                    className={plan.popular ? 'btn-primary w-full' : 'w-full'}
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    {plan.plan === 'Free' ? 'Get Started' : `Upgrade to ${plan.plan}`}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto mb-20">
          <h2 className="h2-section text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                How long does it take to convert an image to video?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                720p videos take 2-3 minutes. 1080p videos take 5-7 minutes. We use a priority queue
                system to process 720p videos first for faster results.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                What image formats are supported?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                We support PNG, JPG, JPEG, and WebP formats. Images up to 10MB and 4K resolution
                work best.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                Is there a free trial?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Yes! Get {pricing.free.signupCredits} free credits on signup (no credit card required). This allows you to
                generate 1 Sora 2 video (or up to {imageCount} images) to test our platform. Pro plan costs ${pricing.pro.price}/month with {pricing.pro.monthlyCredits} credits.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                How many credits does image-to-video cost?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Sora 2 (720p): {sora2Cost} credits per video. Sora 2 Pro (1080p): {sora2ProCost} credits per video
                depending on duration.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                Can I generate multiple videos at once?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Yes! Free users can generate {pricing.free.batchSize} video at a time. Pro users: {pricing.pro.batchSize} videos simultaneously.
                Pro+ users: {pricing.proplus.batchSize} videos simultaneously.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Product Images?</h2>
            <p className="text-xl mb-8 opacity-90">
              Start creating professional videos today. No credit card required.
            </p>
            <Link href="/video-generation">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
