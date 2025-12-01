import { AlertTriangle, CheckCircle2, Cpu, Lightbulb, Lock, Scan } from 'lucide-react';
import Link from 'next/link';
import { getSEOMetadata } from '@/lib/seo/metadata-translations';
import { getSoftwareApplicationSchema, getFAQPageSchema } from '@/lib/utils/schema-generator';
import type { Metadata } from 'next';
import { FAQ } from '@/components/blocks/faq';

const NANO_FAQ = [
  {
    question: 'How does Nano Banana Pro differ from other AI image generators?',
    answer:
      'Nano Banana Pro is "Reconstructive" first—it locks your product\'s geometry and texture before generating the scene, ensuring the bottle, label, and material look exactly like the physical object. Other models are "Generative" first, meaning they often hallucinate or change product details.',
  },
  {
    question: 'Does Nano Banana Pro work for jewelry and reflective surfaces?',
    answer:
      'Yes. Nano Banana Pro has a specific "Ray-Tracing approximation" layer that calculates realistic reflections based on the generated environment. Gold looks like gold, not yellow plastic.',
  },
  {
    question: 'Can I train Nano Banana Pro on my specific brand style?',
    answer:
      'Enterprise users can fine-tune the model on their existing brand photography (Lookbook training). For Pro users, our "Brand Guard" system handles style matching via prompt engineering and color palette extraction.',
  },
  {
    question: 'What file formats does Nano Banana Pro output?',
    answer:
      'You can export in PNG (lossless), JPG, or WEBP. All images are 300 DPI ready for print, with options for transparent background (PNG).',
  },
  {
    question: 'How does Nano Banana Pro preserve product integrity?',
    answer:
      'Nano Banana Pro uses a 3-step pipeline: Geometry Scan (identifies immutable edges and text zones), Texture Lock (freezes RGB values of your product), and Light Mapping (calculates realistic lighting without altering the product itself).',
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return getSEOMetadata(locale, 'model', '/models/nano-banana');
}

export default function NanoBananaPage() {
  const softwareSchema = getSoftwareApplicationSchema(
    'Nano Banana Pro AI Model',
    [
      'Product detail preservation',
      'Accurate text rendering',
      'Realistic lighting',
      'Geometry lock',
      'Texture preservation',
      'Commercial photography',
    ],
    '0',
    { value: '4.8', count: '1250' }
  );

  const faqSchema = getFAQPageSchema(NANO_FAQ);

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

      <div className="pt-32 pb-16 container-base text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 text-teal-500 mb-6">
          <Cpu className="w-4 h-4" /> Proprietary Architecture
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Beyond Generation. <br />
          This is <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-500">Reconstruction.</span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-12">
          Generic AI models "dream" up new products. Nano Banana Pro locks your product's geometry and texture before imagining the world around it.
        </p>
      </div>

      {/* Architecture Breakdown */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="container-base">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">The 3-Step "Trust" Pipeline</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl font-bold">01</div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6">
                <Scan className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Geometry Scan</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                The model creates a wireframe map of your product, identifying edges, text zones, and structural lines that must remain immutable.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl font-bold">02</div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 mb-6">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Texture Lock</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Unlike diffusion models that blend pixels, we freeze the RGB values of your product, ensuring logos and materials (like leather grain) are never altered.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl font-bold">03</div>
              <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-500 mb-6">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Light Mapping</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                We calculate how light interacts with the scene and <em>then</em> cast simulated shadows/reflections onto your product without changing the product itself.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hallucination Defense */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container-base grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Defense Against Hallucination</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-6">
              The #1 fear of e-commerce managers is "Product Integrity". A generated image is useless if the brand logo is misspelled or the bottle shape is warped.
            </p>
            <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl mb-6">
              <h4 className="font-bold text-red-500 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" /> The "Generic AI" Problem
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Standard models treat text as shapes, often turning "NIKE" into "NIKEE" or blending buttons into the fabric.
              </p>
            </div>
          </div>
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl">
            <div className="flex justify-between text-sm font-mono text-slate-500 mb-6 border-b border-slate-800 pb-4">
              <span>Hallucination Stress Test</span>
              <span>Input: "Perfume bottle"</span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="group">
                <div className="aspect-square bg-slate-800 rounded-xl mb-3 flex items-center justify-center text-slate-600 relative overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=400"
                    alt="Generic AI result with errors"
                    className="opacity-50 blur-[2px] scale-110"
                  />
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <AlertTriangle className="text-red-500 w-8 h-8 mb-2" />
                    <span className="text-xs font-bold text-white bg-red-500 px-2 py-1 rounded">Text Warped</span>
                  </div>
                </div>
                <p className="text-xs text-center text-slate-500 font-mono">Generic AI Models</p>
              </div>
              <div className="group">
                <div className="aspect-square bg-slate-800 rounded-xl mb-3 flex items-center justify-center text-slate-600 border-2 border-teal-500 relative overflow-hidden shadow-[0_0_20px_rgba(20,184,166,0.2)]">
                  <img
                    src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=400"
                    alt="Nano Banana Pro result"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-teal-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> 100% Match
                  </div>
                </div>
                <p className="text-xs text-center text-teal-500 font-bold font-mono">Nano Banana Pro</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FAQ items={NANO_FAQ} title="Technical Specifications" className="bg-slate-50 dark:bg-slate-900" />

      <section className="py-20 bg-white dark:bg-slate-950 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">Ready to switch?</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/image-generation"
            className="inline-flex items-center gap-2 px-8 py-4 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl transition-colors"
          >
            Try Nano Banana Pro Free
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            View Documentation
          </Link>
        </div>
        <div className="mt-6 text-sm text-slate-600 dark:text-slate-400">
          <p className="mb-2">Platform-Specific Solutions:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/solutions/amazon" className="text-teal-500 hover:underline">
              Amazon →
            </Link>
            <Link href="/solutions/tiktok" className="text-teal-500 hover:underline">
              TikTok →
            </Link>
            <Link href="/solutions/shopify" className="text-teal-500 hover:underline">
              Shopify →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

