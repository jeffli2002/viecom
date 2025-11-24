import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Settings, Sparkles, TrendingUp, Zap } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AI Video Enhancer | Upscale to 4K Quality Free Trial',
  description:
    'Enhance product video quality with AI. Upscale 720p to 1080p/4K, improve clarity, reduce noise. Nano Banana Pro model. Perfect for e-commerce. Try free!',
  keywords: [
    'video enhancer',
    'video quality enhancer',
    'ai video enhancer',
    'video upscaler',
    'upscale video quality',
    'enhance video resolution',
  ],
  openGraph: {
    title: 'AI Video Enhancer | Upscale Video Quality',
    description:
      'Enhance product video quality with AI. Upscale 720p to 1080p/4K, improve clarity, reduce noise.',
    type: 'website',
  },
};

const features = [
  {
    title: 'AI Upscaling',
    description: 'Enhance 720p videos to 1080p or 4K resolution using advanced AI algorithms',
    icon: TrendingUp,
  },
  {
    title: 'Noise Reduction',
    description: 'Remove grain and artifacts while preserving important details',
    icon: Sparkles,
  },
  {
    title: 'Smart Enhancement',
    description: 'Automatically adjust brightness, contrast, and color for optimal results',
    icon: Settings,
  },
  {
    title: 'Fast Processing',
    description: 'Enhance videos in minutes with Nano Banana Pro AI model',
    icon: Zap,
  },
];

const useCases = [
  'Upscale product videos for better e-commerce listings',
  'Enhance old marketing videos to modern quality',
  'Improve social media video clarity',
  'Prepare videos for 4K displays',
  'Fix low-quality footage from mobile devices',
  'Create professional-looking content on a budget',
];

const pricingTiers = [
  {
    name: 'Free Trial',
    price: '$0',
    credits: '30 credits',
    videos: '2-6 enhanced videos',
    features: [
      '720p to 1080p upscaling',
      'Basic noise reduction',
      'Standard processing speed',
      'Small watermark',
    ],
  },
  {
    name: 'Pro',
    price: '$14.9',
    credits: '500 credits/month',
    videos: 'Up to 100 videos',
    features: [
      '720p to 4K upscaling',
      'Advanced noise reduction',
      'Faster processing',
      'No watermark',
    ],
    popular: true,
  },
  {
    name: 'Pro+',
    price: '$24.9',
    credits: '900 credits/month',
    videos: 'Up to 180 videos',
    features: [
      'All Pro features',
      'Priority processing queue',
      'Batch enhancement (5 at once)',
      'Premium support',
    ],
  },
];

export default function VideoEnhancerAIPage() {
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Viecom AI Video Enhancer',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'AI video upscaling',
      '720p to 4K enhancement',
      'Noise reduction',
      'Smart color correction',
      'Batch processing',
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does AI video enhancement work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our Nano Banana Pro AI model analyzes each frame, intelligently adds pixels, reduces noise, and enhances colors to improve overall video quality. It uses deep learning trained on millions of videos.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I upscale 720p to 4K?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Pro and Pro+ plans support upscaling from 720p to 1080p or 4K resolution. Free tier supports 720p to 1080p upscaling.',
        },
      },
      {
        '@type': 'Question',
        name: 'How long does video enhancement take?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Enhancement typically takes 3-7 minutes per video depending on length and target resolution. Pro+ users get priority processing for faster results.',
        },
      },
      {
        '@type': 'Question',
        name: 'What video formats are supported?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We support MP4, MOV, AVI, and WebM formats. Maximum video length is 60 seconds for free tier, unlimited for paid plans.',
        },
      },
      {
        '@type': 'Question',
        name: 'Will enhancement work on all videos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'AI enhancement works best on videos with some clarity. Extremely blurry or corrupted videos may have limited improvement. Product videos and footage shot in good lighting see the best results.',
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema is safe
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema is safe
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="container-base py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-800 mb-6">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Powered by Nano Banana Pro AI
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Enhance Product Videos to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              4K Quality
            </span>{' '}
            with AI
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
            Upscale video resolution, reduce noise, and improve clarity automatically. Perfect for
            e-commerce product videos, social media content, and marketing materials. Try free with
            30 credits.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/video-generation">
              <Button size="lg" className="text-lg px-8 py-6 group">
                Try Video Enhancer Free
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
              <span>Up to 4K Resolution</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>AI-Powered Enhancement</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>3-7 Minute Processing</span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900 dark:text-white">
            Before & After Examples
          </h2>
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-8 md:p-12 border border-slate-200 dark:border-slate-700">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <div className="bg-slate-200 dark:bg-slate-700 rounded-lg aspect-video flex items-center justify-center mb-3">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    720p Original
                  </span>
                </div>
                <p className="text-sm text-center text-slate-600 dark:text-slate-400">
                  Original 720p product video
                </p>
              </div>
              <div>
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg aspect-video flex items-center justify-center mb-3 border-2 border-blue-500">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    1080p Enhanced
                  </span>
                </div>
                <p className="text-sm text-center text-slate-600 dark:text-slate-400">
                  AI-enhanced 1080p with improved clarity
                </p>
              </div>
            </div>
            <p className="text-center text-slate-600 dark:text-slate-300">
              <strong>Result:</strong> 2x resolution increase, sharper details, better colors,
              reduced noise
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900 dark:text-white">
            AI Enhancement Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <feature.icon className="h-10 w-10 text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900 dark:text-white">
            Perfect For
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {useCases.map((useCase) => (
              <div key={useCase} className="flex items-start gap-3">
                <Check className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-lg text-slate-700 dark:text-slate-300">{useCase}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-4 text-slate-900 dark:text-white">
            Enhancement Pricing
          </h2>
          <p className="text-center text-slate-600 dark:text-slate-400 mb-12">
            Try free, upgrade for unlimited enhancements
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`bg-white dark:bg-slate-900 border-2 rounded-xl p-8 ${
                  tier.popular
                    ? 'border-blue-500 shadow-xl scale-105'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {tier.popular && (
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold px-4 py-1 rounded-full inline-block mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
                  {tier.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">
                    {tier.price}
                  </span>
                  {tier.price !== '$0' && (
                    <span className="text-slate-600 dark:text-slate-400">/month</span>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{tier.credits}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{tier.videos}</p>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-slate-700 dark:text-slate-300"
                    >
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href={tier.name === 'Free Trial' ? '/video-generation' : '/pricing'}>
                  <Button
                    className="w-full"
                    variant={tier.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    {tier.name === 'Free Trial' ? 'Start Free' : `Upgrade to ${tier.name}`}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                How does AI video enhancement work?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Our Nano Banana Pro AI model analyzes each frame, intelligently adds pixels, reduces
                noise, and enhances colors to improve overall video quality. It uses deep learning
                trained on millions of videos.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                Can I upscale 720p to 4K?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Yes! Pro and Pro+ plans support upscaling from 720p to 1080p or 4K resolution. Free
                tier supports 720p to 1080p upscaling.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                How long does video enhancement take?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Enhancement typically takes 3-7 minutes per video depending on length and target
                resolution. Pro+ users get priority processing for faster results.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                What video formats are supported?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                We support MP4, MOV, AVI, and WebM formats. Maximum video length is 60 seconds for
                free tier, unlimited for paid plans.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                Will enhancement work on all videos?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                AI enhancement works best on videos with some clarity. Extremely blurry or corrupted
                videos may have limited improvement. Product videos and footage shot in good
                lighting see the best results.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Enhance Your Videos?</h2>
            <p className="text-xl mb-8 opacity-90">
              Start improving video quality with AI today. Free trial included.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/video-generation">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                  Try Video Enhancer
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/image-to-video-ai">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 bg-transparent hover:bg-white/10 text-white border-white"
                >
                  View All Features
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
