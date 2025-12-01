import { Check, FileSpreadsheet, Layers } from 'lucide-react';
import Link from 'next/link';
import { getSEOMetadata } from '@/lib/seo/metadata-translations';
import { getSoftwareApplicationSchema, getFAQPageSchema, getHowToSchema } from '@/lib/utils/schema-generator';
import type { Metadata } from 'next';
import { FAQ } from '@/components/blocks/faq';

const SHOPIFY_FAQ = [
  {
    question: 'Do you support bulk generation for Shopify variants?',
    answer:
      'Absolutely. You can upload a CSV with product SKUs and mapped prompt styles. Our system will generate 4 unique images for each SKU, which you can then export as a structured ZIP file ready for Shopify upload.',
  },
  {
    question: 'What image formats does Shopify support?',
    answer:
      'Shopify supports JPG, PNG, and WEBP formats. Our system can generate images in all these formats, optimized for web performance.',
  },
  {
    question: 'Can I generate product images for multiple Shopify variants at once?',
    answer:
      'Yes! Our batch processing feature allows you to upload a CSV file with all your product variants, and the system will generate optimized images for each variant automatically.',
  },
  {
    question: 'How do I integrate generated images into my Shopify store?',
    answer:
      'After batch generation, you can download all images as a structured ZIP file. The file structure matches Shopify\'s requirements, making it easy to bulk upload to your store.',
  },
  {
    question: 'Do you support Shopify product video generation?',
    answer:
      'Yes! In addition to images, you can generate product videos optimized for Shopify. Videos help increase conversion rates and showcase products better.',
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return getSEOMetadata(locale, 'solution', '/solutions/shopify');
}

export default function ShopifySolutionPage() {
  const softwareSchema = getSoftwareApplicationSchema(
    'Shopify Product Image & Video Generator',
    [
      'Bulk CSV upload',
      'Shopify variant support',
      'Structured ZIP export',
      'Product image optimization',
      'Video generation',
      'Batch processing',
    ],
    '0'
  );

  const faqSchema = getFAQPageSchema(SHOPIFY_FAQ);

  const howToSchema = getHowToSchema(
    'How to Generate Product Images for Shopify',
    [
      {
        name: 'Prepare Your CSV File',
        text: 'Create a CSV file with your product SKUs, names, and any specific style prompts you want for each product.',
      },
      {
        name: 'Upload CSV to Batch Generator',
        text: 'Upload your CSV file to our batch image generation tool. The system will process all products automatically.',
      },
      {
        name: 'Wait for Processing',
        text: 'Our AI generates optimized product images for each SKU. You can track progress in real-time.',
      },
      {
        name: 'Download Structured ZIP',
        text: 'Download all generated images as a structured ZIP file, ready for bulk upload to your Shopify store.',
      },
    ],
    'Step-by-step guide to generating bulk product images for Shopify stores using CSV upload and batch processing.'
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
          Shopify Product <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-500">Image Generator</span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
          Generate product images and videos for Shopify stores. Bulk CSV upload for variants, automated optimization, and seamless integration.
        </p>
      </div>

      {/* Batch Processing Showcase */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="container-base">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold uppercase tracking-wider mb-6">
                For Power Sellers
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">500 SKUs? No Problem.</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Stop generating one-by-one. Upload your entire catalog via CSV and let our specialized agents handle the rest.
              </p>
            </div>

            <div className="bg-slate-900 rounded-2xl p-2 shadow-2xl overflow-hidden text-left border border-slate-800 relative">
              <div className="absolute top-0 left-0 w-full h-8 bg-slate-800 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="mt-8 overflow-x-auto">
                <table className="w-full text-sm text-slate-400 font-mono">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="p-3">SKU_ID</th>
                      <th className="p-3">Product_Name</th>
                      <th className="p-3">Target_Platform</th>
                      <th className="p-3">Vibe_Prompt</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-800">
                      <td className="p-3 text-blue-400">#SKU-9021</td>
                      <td className="p-3">Leather Wallet</td>
                      <td className="p-3">Shopify</td>
                      <td className="p-3">"Studio white, detailed stitching"</td>
                      <td className="p-3 text-green-500">Done (4 images)</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="p-3 text-blue-400">#SKU-9022</td>
                      <td className="p-3">Running Shoes</td>
                      <td className="p-3">Shopify</td>
                      <td className="p-3">"Urban street, wet pavement, neon"</td>
                      <td className="p-3 text-yellow-500">Processing (65%)</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-blue-400">#SKU-9023</td>
                      <td className="p-3">Face Cream</td>
                      <td className="p-3">Shopify</td>
                      <td className="p-3">"Bathroom shelf, morning light"</td>
                      <td className="p-3 text-slate-600">Queued</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container-base">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 text-blue-500 mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">Scale Your Store</h2>
          <p className="text-slate-600 dark:text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Perfect for scaling your e-commerce store. Generate hundreds of product images in minutes, not weeks.
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">CSV Upload</h4>
                <p className="text-xs text-slate-500">Upload your entire product catalog via CSV for batch processing.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">Variant Support</h4>
                <p className="text-xs text-slate-500">Generate images for multiple product variants automatically.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">Structured Export</h4>
                <p className="text-xs text-slate-500">Download images in a structured ZIP file ready for Shopify upload.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">Auto-Optimization</h4>
                <p className="text-xs text-slate-500">Images automatically optimized for web performance and Shopify requirements.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FAQ items={SHOPIFY_FAQ} title="Shopify Integration FAQ" className="bg-slate-50 dark:bg-slate-900" />

      <section className="py-20 bg-white dark:bg-slate-950 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">Ready to Scale Your Shopify Store?</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/batch-image-generation"
            className="inline-flex items-center gap-2 px-8 py-4 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl transition-colors"
          >
            Start Batch Processing
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
            <Link href="/solutions/tiktok" className="text-teal-500 hover:underline">
              TikTok Solutions →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

