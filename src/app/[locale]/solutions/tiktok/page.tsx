import { FAQ } from '@/components/blocks/faq';
import { getSEOMetadata } from '@/lib/seo/metadata-translations';
import {
  getFAQPageSchema,
  getHowToSchema,
  getSoftwareApplicationSchema,
} from '@/lib/utils/schema-generator';
import { Check, Play, Smartphone, Sparkles, Zap } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

const TIKTOK_FAQ = [
  {
    question: 'Can I convert a landscape image to a TikTok vertical video?',
    answer:
      'Yes. Use our "Outpainting" feature to extend the background of your horizontal image to 9:16 vertical, then apply the "Motion" filter to add camera movement and particle effects, creating a video ready for TikTok.',
  },
  {
    question: 'What video formats does TikTok Shop require?',
    answer:
      'TikTok Shop requires 9:16 vertical videos (1080x1920) in MP4 format. Our system automatically generates videos in the correct format and aspect ratio.',
  },
  {
    question: 'How long can TikTok product videos be?',
    answer:
      'TikTok Shop supports videos up to 60 seconds, but shorter videos (15-30 seconds) typically perform better. Our system can generate videos in 10s or 15s durations.',
  },
  {
    question: 'Can I add motion effects to static product images?',
    answer:
      'Yes! Our "Still-to-Motion" engine adds physics-based movement, water splashes, smoke, or floating effects to static items, making them perfect for TikTok engagement.',
  },
  {
    question: 'Do you support batch video generation for TikTok?',
    answer:
      'Yes! Upload a CSV file with multiple product SKUs and our system will generate TikTok-ready 9:16 videos for all of them automatically.',
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return getSEOMetadata(locale, 'solution', '/solutions/tiktok');
}

export default function TikTokSolutionPage() {
  const softwareSchema = getSoftwareApplicationSchema(
    'TikTok Video Generator',
    [
      '9:16 vertical video format',
      'Image to video conversion',
      'Motion effects',
      'TikTok Shop optimization',
      'Viral content generation',
      'Batch processing',
    ],
    '0'
  );

  const faqSchema = getFAQPageSchema(TIKTOK_FAQ);

  const howToSchema = getHowToSchema(
    'How to Create TikTok Product Videos',
    [
      {
        name: 'Upload Your Product Image',
        text: 'Upload your product photo. The system will automatically prepare it for TikTok video conversion.',
      },
      {
        name: 'Select TikTok Platform',
        text: 'Choose "TikTok" from the platform dropdown. This activates 9:16 vertical format and motion effects.',
      },
      {
        name: 'Add Motion Effects',
        text: 'Our AI automatically adds physics-based movement, particle effects, and engaging visuals to make your product stand out.',
      },
      {
        name: 'Download TikTok-Ready Video',
        text: 'Download your 9:16 vertical video optimized for TikTok Shop. Ready to upload and go viral!',
      },
    ],
    'Step-by-step guide to creating viral 9:16 vertical videos for TikTok Shop from static product images.'
  );

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
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema is safe
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      <div className="pt-32 pb-16 container-base text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          TikTok Shop <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-500">
            Video Generator
          </span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
          Create viral 9:16 vertical videos for TikTok Shop. Convert static product images to
          engaging videos with motion effects.
        </p>
      </div>

      {/* Video Showcase */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="container-base">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-2xl">
            <div className="relative grid gap-8 md:grid-cols-2 items-center">
              {/* Input card */}
              <div className="flex justify-center">
                <div className="group relative max-w-[320px] w-full rounded-2xl border-2 border-teal-500 bg-slate-50 dark:bg-slate-900 p-4 overflow-hidden shadow-xl transition-all duration-300 hover:shadow-teal-500/40 hover:-translate-y-1">
                  <span className="absolute -top-3 left-4 px-2 bg-teal-500 text-white text-[10px] font-bold rounded uppercase tracking-wide">
                    Input Image
                  </span>
                  <div className="aspect-[4/5] rounded-xl overflow-hidden">
                    <img
                      src="/imagesgen/cloth.jpg"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      alt="Source Product - Apparel"
                    />
                  </div>
                </div>
              </div>

              {/* Output video card */}
              <div className="flex flex-col items-center gap-3">
                <div className="group relative w-full max-w-[260px] aspect-[9/16] rounded-2xl border-2 border-teal-500 bg-black overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-teal-500/40 hover:-translate-y-1">
                  <video
                    src="/video/apparel.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls
                    className="w-full h-full object-cover opacity-90"
                  />
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
                      TikTok 9:16
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Looping motion video · Tap speaker to enable sound
                  </p>
                </div>
              </div>

              {/* Transform icon between input and output (desktop only) */}
              <div className="pointer-events-none hidden md:flex items-center justify-center absolute inset-y-0 left-1/2 -translate-x-1/2">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative bg-white dark:bg-slate-900 rounded-full border border-teal-500/40 p-3 shadow-lg shadow-teal-500/20">
                    <Sparkles className="w-5 h-5 text-teal-500" />
                    <div className="absolute -inset-1 rounded-full bg-teal-500/20 blur opacity-40" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-300">
                    AI Transform
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container-base">
          <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center mb-6 text-pink-500 mx-auto">
            <Smartphone className="w-6 h-6" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">Viral Ready</h2>
          <p className="text-slate-600 dark:text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Static images don't convert on TikTok. Our "Still-to-Motion" engine adds physics-based
            movement to stop the scroll.
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">9:16 Outpainting</h4>
                <p className="text-xs text-slate-500">
                  Extends horizontal photos to vertical video formats seamlessly.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">Physics Simulation</h4>
                <p className="text-xs text-slate-500">
                  Adds water splashes, smoke, or floating effects to static items.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">Auto-Optimization</h4>
                <p className="text-xs text-slate-500">
                  Automatically optimizes for TikTok Shop requirements and best practices.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">Batch Generation</h4>
                <p className="text-xs text-slate-500">
                  Generate multiple TikTok videos from CSV upload in one go.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FAQ
        items={TIKTOK_FAQ}
        title="TikTok Video Generation FAQ"
        className="bg-slate-50 dark:bg-slate-900"
      />

      <section className="py-20 bg-white dark:bg-slate-950 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">
          Ready to Create Viral TikTok Videos?
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/video-generation"
            className="inline-flex items-center gap-2 px-8 py-4 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl transition-colors"
          >
            Start Generating Free
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            View Pricing
          </Link>
        </div>
        <div className="mt-6 text-sm text-slate-600 dark:text-slate-400">
          <p className="mb-2">Other Platform Solutions:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/solutions/amazon" className="text-teal-500 hover:underline">
              Amazon Solutions →
            </Link>
            <Link href="/solutions/shopify" className="text-teal-500 hover:underline">
              Shopify Solutions →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
