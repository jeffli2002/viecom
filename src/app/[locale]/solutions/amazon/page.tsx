import { Check, CheckCircle2, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { getSEOMetadata } from '@/lib/seo/metadata-translations';
import { getSoftwareApplicationSchema, getFAQPageSchema, getHowToSchema } from '@/lib/utils/schema-generator';
import type { Metadata } from 'next';
import { FAQ } from '@/components/blocks/faq';

const AMAZON_FAQ = [
  {
    question: 'How do I ensure my images are Amazon compliant?',
    answer:
      'Simply select "Amazon" from the platform dropdown. Our system automatically sets the background to pure RGB(255,255,255), ensures the product occupies at least 85% of the frame, and removes any unauthorized text overlays.',
  },
  {
    question: 'What is the exact white background requirement for Amazon?',
    answer:
      'Amazon requires pure white background with RGB values of exactly 255, 255, 255. Our system automatically removes all background pixels and ensures perfect compliance.',
  },
  {
    question: 'Can I use these images for other marketplaces like eBay?',
    answer:
      'Yes! Amazon-compliant images also work perfectly for eBay and most other marketplaces that require white background product images.',
  },
  {
    question: 'How does the 85% frame fill work?',
    answer:
      'Our system automatically crops and zooms your product image to ensure the product occupies at least 85% of the frame, maximizing product visibility as required by Amazon.',
  },
  {
    question: 'Do you support batch generation for Amazon listings?',
    answer:
      'Yes! You can upload a CSV file with multiple product SKUs and our system will generate Amazon-compliant images for all of them automatically.',
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return getSEOMetadata(locale, 'solution', '/solutions/amazon');
}

export default function AmazonSolutionPage() {
  const softwareSchema = getSoftwareApplicationSchema(
    'Amazon Compliant Product Image Generator',
    [
      'Pure white background (RGB 255,255,255)',
      '85% frame fill automation',
      'Text overlay removal',
      'Amazon compliance check',
      'Batch processing',
      'Marketplace safe',
    ],
    '0'
  );

  const faqSchema = getFAQPageSchema(AMAZON_FAQ);

  const howToSchema = getHowToSchema(
    'How to Create Amazon-Compliant Product Images',
    [
      {
        name: 'Upload Your Product Image',
        text: 'Upload your product photo. The system will automatically detect the product and prepare it for Amazon compliance.',
      },
      {
        name: 'Select Amazon Platform',
        text: 'Choose "Amazon" from the platform dropdown. This activates all Amazon-specific compliance features.',
      },
      {
        name: 'Automatic Processing',
        text: 'Our AI automatically removes the background, sets it to pure white (RGB 255,255,255), and ensures 85% frame fill.',
      },
      {
        name: 'Download Compliant Images',
        text: 'Download your Amazon-ready images. All images are automatically optimized for Amazon listing requirements.',
      },
    ],
    'Step-by-step guide to creating Amazon-compliant product images with pure white backgrounds and proper frame fill.'
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
          Amazon-Compliant <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-500">Product Images</span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
          Generate Amazon-ready product images with pure white backgrounds. Automated compliance ensures your listings stay ranked.
        </p>
      </div>

      {/* Platform Visualizer */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="container-base">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="w-full md:w-1/3 space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-teal-500 relative">
                  <span className="absolute -top-3 left-4 px-2 bg-teal-500 text-white text-[10px] font-bold rounded uppercase">
                    Input Asset
                  </span>
                  <img
                    src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=400"
                    className="w-full rounded-lg"
                    alt="Source Product"
                  />
                </div>
              </div>

              <div className="w-full md:w-2/3">
                <div className="aspect-[4/5] bg-white rounded-xl border-2 border-teal-500 p-4 flex items-center justify-center relative overflow-hidden shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=400"
                    className="object-contain max-h-full mix-blend-multiply"
                    alt="Amazon Compliant"
                  />
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Amazon Main</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Pure White (255,255,255)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container-base">
          <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6 text-orange-500 mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">Marketplace Safe</h2>
          <p className="text-slate-600 dark:text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Amazon and eBay algorithms will suppress listings with non-compliant images. We automate the boring stuff so you stay ranked.
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">Pure White BG (RGB 255)</h4>
                <p className="text-xs text-slate-500">Automated removal of all background pixels.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">85% Frame Fill</h4>
                <p className="text-xs text-slate-500">Auto-crop and zoom to maximize product visibility.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">No Text Overlays</h4>
                <p className="text-xs text-slate-500">Automatic removal of unauthorized text and graphics.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">Batch Processing</h4>
                <p className="text-xs text-slate-500">Process hundreds of products via CSV upload.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FAQ items={AMAZON_FAQ} title="Amazon Compliance FAQ" className="bg-slate-50 dark:bg-slate-900" />

      <section className="py-20 bg-white dark:bg-slate-950 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">Ready to Generate Amazon-Compliant Images?</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/image-generation"
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
            <Link href="/solutions/tiktok" className="text-teal-500 hover:underline">
              TikTok Solutions →
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

