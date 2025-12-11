import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Box,
  BrainCircuit,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Cpu,
  FileSpreadsheet,
  Film,
  Github,
  Globe,
  Instagram,
  Layers,
  Layout,
  Lightbulb,
  Linkedin,
  Loader2,
  Lock,
  Maximize2,
  Menu,
  Minus,
  MonitorPlay,
  Moon,
  MousePointerClick,
  MoveRight,
  Palette,
  Pause,
  Play,
  Plus,
  Ratio,
  RefreshCw,
  Scale,
  Scan,
  Shield,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Sun,
  Target,
  Twitter,
  Upload,
  Video,
  Wand2,
  X,
  Zap,
  ZapOff,
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Link, Route, Routes, useLocation } from 'react-router-dom';

// --- Constants & Data ---

const PLATFORMS = [
  {
    name: 'Amazon',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
    width: 'w-24',
  },
  {
    name: 'TikTok',
    logo: 'https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg',
    width: 'w-24',
  },
  {
    name: 'Shopee',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg',
    width: 'w-24',
  },
  {
    name: 'eBay',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg',
    width: 'w-20',
  },
  {
    name: 'Etsy',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Etsy_logo.svg',
    width: 'w-16',
  },
  {
    name: 'Temu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Temu_logo.svg',
    width: 'w-20',
  },
];

const VEO_DEMOS = [
  {
    id: 1,
    category: 'Apparel',
    input:
      'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=800',
    video: 'https://videos.pexels.com/video-files/5302646/5302646-uhd_2160_3840_25fps.mp4',
    prompt: 'Cinematic slow motion of woman in floral dress walking through meadow at golden hour',
    views: '2.4M',
    ratio: '9:16',
  },
  {
    id: 2,
    category: 'Beauty',
    input:
      'https://images.pexels.com/photos/3762466/pexels-photo-3762466.jpeg?auto=compress&cs=tinysrgb&w=800',
    video: 'https://videos.pexels.com/video-files/5091636/5091636-uhd_2560_1440_25fps.mp4',
    prompt:
      'Macro shot of perfume bottle with water ripples and floating petals, high end commercial',
    views: '1.8M',
    ratio: '16:9',
  },
  {
    id: 3,
    category: 'Electronics',
    input:
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=800',
    video: 'https://videos.pexels.com/video-files/3195987/3195987-uhd_2560_1440_25fps.mp4',
    prompt: '360 degree product spin of smartwatch with holographic data visualization overlay',
    views: '3.1M',
    ratio: '16:9',
  },
  {
    id: 4,
    category: 'Food',
    input:
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800',
    video: 'https://videos.pexels.com/video-files/2928377/2928377-uhd_3840_2160_24fps.mp4',
    prompt: 'Steam rising from fresh pizza, cheese pull close up, appetizing commercial lighting',
    views: '4.2M',
    ratio: '16:9',
  },
  {
    id: 5,
    category: 'Shoes',
    input:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
    video: 'https://videos.pexels.com/video-files/4724036/4724036-uhd_2560_1440_25fps.mp4',
    prompt: 'Sneaker floating in zero gravity, dynamic lighting, urban street background',
    views: '1.5M',
    ratio: '16:9',
  },
  {
    id: 6,
    category: 'Sports',
    input:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800',
    video: 'https://videos.pexels.com/video-files/6774644/6774644-uhd_2160_4096_25fps.mp4',
    prompt: 'High energy fitness model lifting weights, sweat droplets, neon gym atmosphere',
    views: '2.9M',
    ratio: '9:16',
  },
];

const GALLERY_ITEMS = [
  {
    id: 1,
    type: 'video',
    category: 'Fashion',
    url: 'https://videos.pexels.com/video-files/6394054/6394054-uhd_2560_1440_24fps.mp4',
    title: 'Summer Collection',
  },
  {
    id: 2,
    type: 'image',
    category: 'Beauty',
    url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800',
    title: 'Luxury Skincare',
  },
  {
    id: 3,
    type: 'image',
    category: 'Home',
    url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?auto=format&fit=crop&q=80&w=800',
    title: 'Modern Living',
  },
  {
    id: 4,
    type: 'video',
    category: 'Tech',
    url: 'https://videos.pexels.com/video-files/3753444/3753444-uhd_2560_1440_24fps.mp4',
    title: 'Gadget Showcase',
  },
  {
    id: 5,
    type: 'image',
    category: 'Shoes',
    url: 'https://images.unsplash.com/photo-1560769629-975e13f51863?auto=format&fit=crop&q=80&w=800',
    title: 'Urban Footwear',
  },
  {
    id: 6,
    type: 'image',
    category: 'Jewelry',
    url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=800',
    title: 'Elegant Pieces',
  },
  {
    id: 7,
    type: 'video',
    category: 'Beverage',
    url: 'https://videos.pexels.com/video-files/4109403/4109403-uhd_2560_1440_25fps.mp4',
    title: 'Fresh Drinks',
  },
  {
    id: 8,
    type: 'image',
    category: 'Automotive',
    url: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800',
    title: 'Car Accessories',
  },
];

const PRICING_PLANS = [
  {
    name: 'Starter',
    price: '0',
    description: 'Perfect for individual creators getting started.',
    features: [
      '5 Video Generations/mo',
      '720p Export Quality',
      'Standard Support',
      'Public Gallery Access',
    ],
    cta: 'Start Free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '49',
    description: 'For growing brands and power sellers.',
    features: [
      '50 Video Generations/mo',
      '4K Export Quality',
      'Priority Rendering',
      'No Watermark',
      'Commercial License',
    ],
    cta: 'Get Pro',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Scalable solutions for large teams.',
    features: [
      'Unlimited Generations',
      'Custom AI Models',
      'Dedicated Success Manager',
      'SSO & Security',
    ],
    cta: 'Contact Sales',
    highlight: false,
  },
];

const TRANSFORMATION_SCENARIOS = [
  {
    id: 1,
    title: 'Virtual Try-On',
    icon: <Shirt className="w-4 h-4" />,
    input1: {
      label: 'Garment',
      image:
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=800',
    },
    input2: {
      label: 'Model',
      image:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
    },
    result:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800',
    description: 'Instantly dress any model in your apparel without a photoshoot.',
  },
  {
    id: 2,
    title: 'Model Swap',
    icon: <RefreshCw className="w-4 h-4" />,
    input1: {
      label: 'Source Outfit',
      image:
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800',
    },
    input2: {
      label: 'Target Model',
      image:
        'https://images.unsplash.com/photo-1605763240004-7e93b172d754?auto=format&fit=crop&q=80&w=800',
    },
    result:
      'https://images.unsplash.com/photo-1627483297929-37f416fec7cd?auto=format&fit=crop&q=80&w=800',
    description: 'Transfer an outfit from one model to another while preserving garment details.',
  },
  {
    id: 3,
    title: 'Furniture Staging',
    icon: <Box className="w-4 h-4" />,
    input1: {
      label: 'Product',
      image:
        'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=800',
    },
    input2: {
      label: 'Room Scene',
      image:
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=800',
    },
    result:
      'https://images.unsplash.com/photo-1567538096630-e0c55bd9450b?auto=format&fit=crop&q=80&w=800',
    description: 'Visualize furniture in different interior styles instantly.',
  },
  {
    id: 4,
    title: 'Scene Generation',
    icon: <Camera className="w-4 h-4" />,
    input1: {
      label: 'Product Shot',
      image:
        'https://images.unsplash.com/photo-1609516461479-0c896947b198?auto=format&fit=crop&q=80&w=800',
    },
    input2: {
      label: 'Context Ref',
      image:
        'https://images.unsplash.com/photo-1555529733-0e670560f7e1?auto=format&fit=crop&q=80&w=800',
    },
    result:
      'https://images.unsplash.com/photo-1549488352-7d88989b5377?auto=format&fit=crop&q=80&w=800',
    description: 'Generate hyper-realistic environments for any product.',
  },
  {
    id: 5,
    title: 'Holiday Campaign',
    icon: <Sparkles className="w-4 h-4" />,
    input1: {
      label: 'Product',
      image:
        'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&q=80&w=800',
    },
    input2: {
      label: 'Holiday Theme',
      image:
        'https://images.unsplash.com/photo-1544967082-d9d25d867d66?auto=format&fit=crop&q=80&w=800',
    },
    result:
      'https://images.unsplash.com/photo-1576662712957-e23a63eb4232?auto=format&fit=crop&q=80&w=800',
    description: 'Adapt product imagery for seasonal campaigns in seconds.',
  },
];

// --- Comprehensive FAQ Data ---

const GENERAL_FAQ = [
  {
    question: 'Can I use the generated videos for commercial ads?',
    answer:
      'Yes! All content generated on our Pro and Enterprise plans comes with a full commercial license, allowing you to use it for paid advertising on Facebook, TikTok, Instagram, and Amazon without any copyright strikes.',
  },
  {
    question: 'How long does it take to generate a video?',
    answer:
      'Our Veo3 engine is optimized for speed. Standard generation takes about 30-60 seconds for a 5-second clip. High-resolution 4K rendering may take 2-3 minutes depending on server load.',
  },
  {
    question: 'How does the AI maintain my brand consistency?',
    answer:
      'Our Brand Guard™ technology analyzes your website or uploaded assets to extract your specific color palette, fonts, and logo. It then enforces these guidelines on every pixel generated to ensure 100% on-brand results.',
  },
  {
    question: "What if I don't like the result? Do I lose my credit?",
    answer:
      "We offer a 'Regenerate' feature. If the output has technical flaws (glitches, artifacts), our system detects it and refunds the credit automatically. For creative mismatches, Pro users get 10 free rerolls per month.",
  },
  {
    question: 'What is the video resolution and format?',
    answer:
      'Starter plans support 720p HD (MP4). Pro and Enterprise plans unlock 4K Ultra HD rendering for crisp, professional-quality visuals suitable for large screens. We support 16:9, 9:16, and 1:1 aspect ratios.',
  },
  {
    question: 'Do you offer a free trial?',
    answer:
      'Yes, you can start for free with 5 credits per month to test our image and video generation tools. No credit card is required to sign up.',
  },
  {
    question: 'Can I upload my own product 3D models?',
    answer:
      'Currently, we work with standard 2D product images (JPG, PNG, WEBP). Our Veo engine infers the 3D geometry automatically. Full 3D model support (GLB/OBJ) is coming in Q4.',
  },
  {
    question: 'Is my product data private?',
    answer:
      'Absolutely. We use enterprise-grade encryption for all uploaded assets. Your product images are used solely to generate your requested content and are never used to train our public base models without your explicit permission.',
  },
  {
    question: 'Can I use Viecom for bulk generation?',
    answer:
      'Yes, our Batch Mode allows you to upload a CSV file with up to 500 SKUs. The AI will generate image and video assets for each product automatically. This feature is available on Pro and Enterprise plans.',
  },
];

const NANO_FAQ = [
  {
    question: 'How does Nano Banana differ from Midjourney or Stable Diffusion?',
    answer:
      "Midjourney and generic SD models are 'Generative' first, meaning they often hallucinate or change product details. Nano Banana is 'Reconstructive' first—it locks your product's geometry and texture before generating the scene, ensuring the bottle, label, and material look exactly like the physical object.",
  },
  {
    question: 'Does it work for jewelry and reflective surfaces?',
    answer:
      "Yes. Nano Banana has a specific 'Ray-Tracing approximation' layer that calculates realistic reflections based on the generated environment. Gold looks like gold, not yellow plastic.",
  },
  {
    question: 'Can I train Nano Banana on my specific brand style?',
    answer:
      "Enterprise users can fine-tune the model on their existing brand photography (Lookbook training). For Pro users, our 'Brand Guard' system handles style matching via prompt engineering and color palette extraction.",
  },
  {
    question: 'What file formats does it output?',
    answer:
      'You can export in PNG (lossless), JPG, or WEBP. All images are 300 DPI ready for print, with options for transparent background (PNG).',
  },
];

const SOLUTIONS_FAQ = [
  {
    question: 'How do I ensure my images are Amazon compliant?',
    answer:
      "Simply select 'Amazon' from the platform dropdown. Our system automatically sets the background to pure RGB(255,255,255), ensures the product occupies at least 85% of the frame, and removes any unauthorized text overlays.",
  },
  {
    question: 'Can I convert a landscape image to a TikTok vertical video?',
    answer:
      "Yes. Use our 'Outpainting' feature to extend the background of your horizontal image to 9:16 vertical, then apply the 'Motion' filter to add camera movement and particle effects, creating a video ready for TikTok.",
  },
  {
    question: 'Do you support bulk generation for Shopify variants?',
    answer:
      'Absolutely. You can upload a CSV with product SKUs and mapped prompt styles. Our system will generate 4 unique images for each SKU, which you can then export as a structured ZIP file ready for Shopify upload.',
  },
];

const COMPARISON_FAQ = [
  {
    question: 'Is it legal to use Viecom if I switch from Pebblely?',
    answer:
      'Yes. You own the copyright to all input assets you own. Assets generated on other platforms are subject to their terms, but you are free to bring your raw product photos to Viecom. We do not use competitor models; our engine is proprietary.',
  },
  {
    question: 'Is Viecom cheaper for high volume?',
    answer:
      'Generally, yes. Our Pro plan offers 50 video generations and unlimited image generations for $49/mo. Competitors often charge per-credit for images and do not offer video at this price point.',
  },
  {
    question: 'Can I import my previous prompts?',
    answer:
      "Yes. Our prompt understanding is compatible with standard natural language. If you have prompts that worked well elsewhere, they will likely work even better here due to Nano Banana's higher semantic understanding.",
  },
];

// --- SEO Helper ---

const SEO = ({ title, description, keywords }) => {
  useEffect(() => {
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    }

    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', keywords);
    }
  }, [title, description, keywords]);
  return null;
};

// --- Components ---

const FAQ = ({
  items = GENERAL_FAQ,
  title = 'Frequently Asked Questions',
  className = 'bg-alt',
}) => {
  const [openIndex, setOpenIndex] = useState(null);
  return (
    <section className={`section-base ${className}`}>
      <div className="container-base max-w-4xl">
        <h2 className="h2-section text-center mb-16">{title}</h2>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={item.question}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-bold text-lg text-slate-900 dark:text-white pr-8">
                  {item.question}
                </span>
                <div
                  className={`p-2 rounded-full bg-slate-100 dark:bg-slate-800 transition-transform duration-300 ${openIndex === index ? 'rotate-45' : ''}`}
                >
                  <Plus className="w-5 h-5 text-slate-500" />
                </div>
              </button>
              <div
                className={`px-6 transition-all duration-300 ease-in-out overflow-hidden ${openIndex === index ? 'max-h-[500px] pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <p className="text-body leading-relaxed">{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Hero = () => (
  <header className="relative pt-32 pb-20 overflow-hidden bg-main border-b border-slate-200 dark:border-white/5">
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=2000')] opacity-5 dark:opacity-10 bg-cover bg-center mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/90 to-white dark:via-slate-900/90 dark:to-slate-900" />
    </div>

    <div className="container-base relative z-10 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal dark:text-teal-400 mb-8 backdrop-blur-sm animate-fade-in-up">
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">New: Veo3 Video Generation Engine</span>
      </div>

      <h1 className="h1-hero">
        Create Viral E-commerce <br />
        <span className="text-gradient">Content in Seconds</span>
      </h1>

      <p className="text-xl text-body mb-10 max-w-2xl mx-auto leading-relaxed">
        Turn static product photos into high-converting videos and lifestyle imagery using our
        advanced Gemini & Veo AI models. Tailored for Amazon, TikTok, and Shopify.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
        <Link to="/solutions/ecommerce" className="btn-primary">
          <Zap className="w-5 h-5" />
          Start Generating Free
        </Link>
        <Link
          to="/models/nano-banana"
          className="px-8 py-4 bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/20 text-slate-900 dark:text-white font-medium rounded-xl backdrop-blur-md border border-slate-200 dark:border-white/10 transition-all flex items-center gap-2 shadow-sm dark:shadow-none"
        >
          <Play className="w-5 h-5 fill-current" />
          Watch Demo
        </Link>
      </div>

      <div className="pt-8 border-t border-slate-200 dark:border-white/10">
        <p className="text-slate-500 text-sm font-medium mb-6 uppercase tracking-widest">
          Trusted by 50,000+ Sellers on
        </p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-60">
          {PLATFORMS.map((platform) => (
            <div key={platform.name} className="group relative">
              <img
                src={platform.logo}
                alt={platform.name}
                className={
                  'h-8 md:h-10 w-auto object-contain dark:brightness-0 dark:invert transition-all duration-300 opacity-60 group-hover:opacity-100 filter grayscale hover:grayscale-0'
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  </header>
);

const BrandAnalysis = () => (
  <section className="section-base bg-alt">
    <div className="container-base">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div className="order-2 lg:order-1">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-400 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
            <div className="relative bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
              <div className="flex items-center gap-4 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1">
                  <div className="h-2 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                  <div className="h-2 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
                <div className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-full border border-green-500/20">
                  Verified
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    Color Palette
                  </span>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#14b8a6] shadow-sm" />
                    <div className="w-8 h-8 rounded-full bg-[#0f172a] shadow-sm" />
                    <div className="w-8 h-8 rounded-full bg-[#f8fafc] border border-slate-200 shadow-sm" />
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    Typography
                  </span>
                  <div className="text-2xl text-display">Aa</div>
                  <div className="text-xs text-slate-500">Space Grotesk</div>
                </div>
              </div>

              <div className="mt-4 bg-brand-teal/5 border border-brand-teal/10 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-brand-teal dark:text-teal-400 text-sm font-medium mb-1">
                  <Sparkles className="w-4 h-4" /> Brand Voice Detected
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  "Professional, modern, and trustworthy with a focus on sustainability."
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="tag-pill bg-brand-blue/10 text-brand-blue dark:text-blue-400 mb-6">
            <Shield className="w-4 h-4" /> Brand Guard™
          </div>
          <h2 className="h2-section">
            Keep Every Pixel <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-teal">
              On Brand
            </span>
          </h2>
          <p className="text-lg text-body leading-relaxed mb-8">
            Don't let AI hallucinate your identity. Our engine analyzes your website to extract
            logos, fonts, and color palettes, ensuring every generated asset follows your brand
            guidelines automatically.
          </p>
          <ul className="space-y-4">
            {[
              'Auto-extract brand assets from URL',
              'Tone of voice consistency check',
              'Automatic logo placement & watermark',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                <div className="w-6 h-6 rounded-full bg-brand-blue/20 flex items-center justify-center text-brand-blue">
                  <Check className="w-3.5 h-3.5" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
);

const TransformationShowcase = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % TRANSFORMATION_SCENARIOS.length);
  };

  const handlePrev = () => {
    setActiveIndex(
      (prev) => (prev - 1 + TRANSFORMATION_SCENARIOS.length) % TRANSFORMATION_SCENARIOS.length
    );
  };

  return (
    <section id="studio" className="section-base bg-main overflow-hidden">
      <div className="container-base relative z-10">
        <div className="text-center mb-16">
          <span className="text-brand-teal font-medium tracking-wider text-sm uppercase mb-2 block">
            Gemini 3 Pro Capabilities
          </span>
          <h2 className="h2-section">
            Visualize Your Products in <span className="text-gradient">Any Context</span>
          </h2>
          <p className="text-body max-w-2xl mx-auto">
            Our AI understands the geometry of your product and blends it perfectly with models or
            scenes.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="flex flex-wrap justify-center gap-2 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-full border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
            {TRANSFORMATION_SCENARIOS.map((scenario, index) => (
              <button
                type="button"
                key={scenario.id}
                onClick={() => setActiveIndex(index)}
                className={`px-5 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 transition-all ${
                  activeIndex === index
                    ? 'bg-brand-teal text-white shadow-lg shadow-teal-500/25 scale-105'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5 hover:scale-105'
                }`}
              >
                {scenario.icon}
                {scenario.title}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-0 lg:-left-12 top-1/2 -translate-y-1/2 z-40 p-4 rounded-full glass-card shadow-xl text-slate-600 dark:text-slate-300 transition-all hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-0 lg:-right-12 top-1/2 -translate-y-1/2 z-40 p-4 rounded-full glass-card shadow-xl text-slate-600 dark:text-slate-300 transition-all hover:scale-110 active:scale-95"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="grid lg:grid-cols-12 gap-6 items-center max-w-7xl mx-auto min-h-[600px]">
            <div className="lg:col-span-5 space-y-6 relative z-20 h-[600px] flex items-center perspective-[1000px] justify-center">
              {TRANSFORMATION_SCENARIOS.map((scenario, index) => {
                const offset = index - activeIndex;
                const absOffset = Math.abs(offset);
                if (absOffset > 1) return null;
                const isActive = index === activeIndex;
                const zIndex = 20 - absOffset;
                const opacity = Math.max(0, 1 - absOffset * 0.8);
                const scale = Math.max(0, 1 - absOffset * 0.2);
                const rotateY = offset * 25;
                const translateX = offset * 20;

                return (
                  <div
                    key={scenario.id}
                    className="absolute w-full max-w-[400px] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] origin-center"
                    style={{
                      zIndex,
                      opacity,
                      transform: `translateX(${translateX}%) scale(${scale}) rotateY(${rotateY}deg)`,
                      pointerEvents: isActive ? 'auto' : 'none',
                    }}
                  >
                    <div className="relative group h-full flex flex-col justify-center">
                      <div
                        className={`absolute -inset-1 bg-gradient-to-r from-brand-teal to-blue-600 rounded-2xl opacity-20 blur transition duration-500 group-hover:opacity-40 ${isActive ? 'opacity-30' : 'opacity-0'}`}
                      />
                      <div className="glass-card p-8 rounded-2xl relative shadow-2xl backdrop-blur-xl">
                        <div className="flex gap-4 items-center mb-8">
                          <div className="w-10 h-10 rounded-full bg-brand-teal/10 flex items-center justify-center text-brand-teal font-bold text-lg">
                            1
                          </div>
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Input Assets
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              {scenario.input1.label}
                            </span>
                            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 relative group/input cursor-zoom-in shadow-inner">
                              <img
                                src={scenario.input1.image}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover/input:scale-110"
                                alt="Input 1"
                              />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              {scenario.input2.label}
                            </span>
                            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 relative group/input cursor-zoom-in shadow-inner">
                              <img
                                src={scenario.input2.image}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover/input:scale-110"
                                alt="Input 2"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="mt-8 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-white/5 pt-6">
                          <span>Supported: JPG, PNG, WEBP</span>
                          <span className="flex items-center gap-1">
                            <Maximize2 className="w-3 h-3" /> High Res Ready
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="absolute left-[50%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col items-center justify-center pointer-events-none">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-2xl border border-brand-teal/20 text-brand-teal animate-pulse-slow relative">
                <Sparkles className="w-8 h-8" />
                <div className="absolute -inset-1 bg-brand-teal/20 rounded-full blur animate-ping opacity-20" />
              </div>
              <div className="mt-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1 rounded-lg border border-brand-teal/20 shadow-lg">
                <span className="text-[10px] font-bold text-brand-teal uppercase tracking-widest">
                  AI Processing
                </span>
                <div className="text-[10px] text-slate-400 text-center">Gemini 3 Pro</div>
              </div>
            </div>
            <div className="lg:col-span-5 lg:col-start-8 h-[600px] relative perspective-[1200px] flex items-center justify-center z-10 overflow-hidden">
              {TRANSFORMATION_SCENARIOS.map((scenario, index) => {
                const offset = index - activeIndex;
                const absOffset = Math.abs(offset);
                if (absOffset > 1) return null;
                const isActive = index === activeIndex;
                const zIndex = 50 - absOffset;
                const opacity = Math.max(0, 1 - absOffset * 0.8);
                const scale = Math.max(0, 1 - absOffset * 0.2);
                const translateX = offset * 50;
                const rotateY = offset * -25;

                return (
                  <button
                    type="button"
                    key={scenario.id}
                    className="absolute w-full max-w-[380px] aspect-[4/5] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer origin-center"
                    style={{
                      zIndex,
                      opacity,
                      transform: `translateX(${translateX}%) scale(${scale}) rotateY(${rotateY}deg)`,
                    }}
                    onClick={() => setActiveIndex(index)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setActiveIndex(index);
                      }
                    }}
                  >
                    <div
                      className={`relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border transition-all duration-700 ${isActive ? 'border-brand-teal/50 shadow-teal-500/30' : 'border-slate-200 dark:border-slate-700 bg-slate-900'}`}
                    >
                      <div
                        className={`absolute inset-0 bg-black/60 z-10 transition-opacity duration-700 ${isActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                      />
                      <img
                        src={scenario.result}
                        className="w-full h-full object-cover"
                        alt={scenario.title}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-8 pt-32 transform transition-transform duration-700">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-brand-teal text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase shadow-lg shadow-teal-500/20">
                            Generated Result
                          </span>
                        </div>
                        <h3 className="text-white font-bold text-2xl mb-2">{scenario.title}</h3>
                        <p className="text-slate-300 text-sm leading-relaxed">
                          {scenario.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const BatchGenerationFeature = () => (
  <section className="section-base bg-alt">
    <div className="container-base">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div className="order-1">
          <div className="tag-pill bg-brand-teal/10 text-brand-teal mb-6">
            <Layers className="w-4 h-4" /> Scale Automation
          </div>
          <h2 className="h2-section">
            Generate 100+ Variations <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-teal to-brand-blue">
              In One Click
            </span>
          </h2>
          <p className="text-body text-lg mb-8 leading-relaxed">
            Need to test different backgrounds, models, or lighting setups? Our batch processor
            handles the heavy lifting, delivering hundreds of A/B testable assets in minutes.
          </p>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-teal/10 flex items-center justify-center text-brand-teal shrink-0">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  A/B Testing Ready
                </h4>
                <p className="text-body text-sm">
                  Automatically generate variations specifically tuned for higher CTR on Meta &
                  TikTok Ads.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-teal/10 flex items-center justify-center text-brand-teal shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  Bulk Export
                </h4>
                <p className="text-body text-sm">
                  Export all assets to CSV for streamlined upload to Shopify or other platforms.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="order-2">
          <div className="relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-brand-teal/20 blur-3xl rounded-full opacity-30" />
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2 overflow-hidden">
              <div className="grid grid-cols-2 gap-2 p-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img
                      src={`https://images.unsplash.com/photo-${1550000000000 + i * 100000}?auto=format&fit=crop&q=80&w=400`}
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                      alt="Batch variation"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-white text-xs font-medium border border-white/30">
                        Var {i}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    Processing Batch #4092
                  </span>
                </div>
                <div className="text-brand-teal font-mono text-xs">4/100 Generated</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const VideoGenerationShowcase = () => {
  const [selectedDemo, setSelectedDemo] = useState(VEO_DEMOS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setProgressStage] = useState(0);

  const handleGenerate = () => {
    setIsGenerating(true);
    setProgress(0);
    setProgressStage(1);

    let p = 0;
    const interval = setInterval(() => {
      p += 1;
      setProgress(p);
      if (p === 30) setProgressStage(2);
      if (p === 70) setProgressStage(3);
      if (p >= 100) {
        clearInterval(interval);
        setIsGenerating(false);
        setProgressStage(4);
        setTimeout(() => setProgressStage(0), 1000);
      }
    }, 40);
  };

  const getStageLabel = () => {
    switch (stage) {
      case 1:
        return 'Analyzing Prompt & Assets...';
      case 2:
        return 'Simulating Light & Physics...';
      case 3:
        return 'Veo Engine Rendering...';
      default:
        return 'Finalizing...';
    }
  };

  return (
    <section className="section-base bg-main overflow-hidden">
      <div className="container-base">
        <div className="text-center mb-12">
          <span className="text-brand-teal font-medium tracking-wider text-sm uppercase mb-2 block">
            Text-to-Video Studio
          </span>
          <h2 className="h2-section">
            Complete Video Production <br />
            <span className="text-gradient">In One Click</span>
          </h2>
        </div>

        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden ring-1 ring-white/10 lg:h-[650px] flex flex-col lg:flex-row">
          <div className="lg:w-80 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col z-10">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Video className="w-3 h-3" /> Project Settings
              </span>
              <div className="w-2 h-2 rounded-full bg-brand-teal shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
            </div>
            <div className="p-5 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                <p className="text-xs font-medium text-slate-500 uppercase">Input Asset</p>
                <div className="aspect-[3/4] rounded-lg overflow-hidden border border-slate-700 bg-slate-900 relative group cursor-pointer">
                  <img
                    src={selectedDemo.input}
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition"
                    alt="Source"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <div className="bg-black/50 p-2 rounded-full backdrop-blur-sm border border-white/10">
                      <Upload className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-medium text-slate-500 uppercase">Prompt Script</p>
                <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 font-mono leading-relaxed h-32 overflow-y-auto resize-none focus-within:border-brand-teal/50 focus-within:ring-1 focus-within:ring-brand-teal/50 transition">
                  {selectedDemo.prompt}
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-medium text-slate-500 uppercase">Aspect Ratio</p>
                <div className="grid grid-cols-3 gap-2">
                  {['9:16', '16:9', '1:1'].map((r) => (
                    <button
                      type="button"
                      key={r}
                      className={`px-2 py-1.5 rounded text-xs font-medium border transition ${selectedDemo.ratio === r ? 'bg-brand-teal/20 border-brand-teal text-brand-teal' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-800 bg-slate-950">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-500/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 group-hover:animate-pulse" /> Generate Video
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="flex-1 bg-slate-950 relative flex items-center justify-center p-8 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
            <div className="relative z-10 max-h-full max-w-full aspect-video shadow-2xl rounded-lg overflow-hidden border border-slate-800 group">
              <video
                key={selectedDemo.id}
                src={selectedDemo.video}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-contain bg-black"
              />
              {isGenerating && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-50 transition-all duration-500">
                  <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                    <div className="absolute inset-0 rounded-full border border-slate-700" />
                    <div
                      className="absolute inset-0 rounded-full border-t border-brand-teal animate-spin"
                      style={{ animationDuration: '3s' }}
                    />
                    <div className="absolute inset-4 rounded-full border border-slate-800" />
                    <div
                      className="absolute inset-4 rounded-full border-b border-blue-500 animate-spin"
                      style={{ animationDuration: '2s', animationDirection: 'reverse' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-brand-teal animate-pulse">
                      <Cpu className="w-10 h-10" />
                    </div>
                  </div>
                  <div className="w-64 space-y-2 text-center">
                    <div className="flex justify-between text-xs font-mono text-brand-teal mb-1">
                      <span>{getStageLabel()}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-teal to-blue-500 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-8 font-mono text-[10px] text-slate-500 space-y-1 text-left w-64 opacity-50">
                    <div className={stage >= 1 ? 'text-brand-teal' : ''}>
                      &gt; init_veo_engine --v3
                    </div>
                    <div className={stage >= 2 ? 'text-brand-teal' : ''}>
                      &gt; calculating_light_paths...
                    </div>
                    <div className={stage >= 3 ? 'text-brand-teal' : ''}>
                      &gt; rendering_frames [1080p]
                    </div>
                  </div>
                </div>
              )}
              {!isGenerating && (
                <>
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded text-xs font-mono text-white flex items-center gap-2 border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> REC
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded text-xs font-mono text-white border border-white/10">
                    00:00:12:04
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="lg:w-80 bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col z-10">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-3 h-3" /> Render Queue
              </span>
              <span className="text-xs font-bold text-slate-600 bg-slate-900 px-2 py-0.5 rounded">
                {VEO_DEMOS.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
              {VEO_DEMOS.map((demo) => (
                <button
                  type="button"
                  key={demo.id}
                  onClick={() => setSelectedDemo(demo)}
                  className={`w-full text-left group flex gap-3 p-3 rounded-xl transition-all border ${selectedDemo.id === demo.id ? 'bg-slate-900 border-brand-teal/50 shadow-lg shadow-teal-900/10' : 'bg-transparent border-transparent hover:bg-slate-900 hover:border-slate-800'}`}
                >
                  <div className="w-20 h-24 rounded-lg overflow-hidden bg-slate-800 shrink-0 relative">
                    <img
                      src={demo.input}
                      className="w-full h-full object-cover"
                      alt={demo.category}
                    />
                    <div
                      className={`absolute inset-0 bg-brand-teal/20 backdrop-blur-sm flex items-center justify-center transition-opacity ${selectedDemo.id === demo.id ? 'opacity-100' : 'opacity-0'}`}
                    >
                      <Play className="w-6 h-6 text-white fill-current" />
                    </div>
                  </div>
                  <div className="flex-1 py-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${selectedDemo.id === demo.id ? 'text-brand-teal' : 'text-slate-500'}`}
                      >
                        {demo.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed group-hover:text-slate-300">
                      {demo.prompt}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Gallery = () => {
  const scrollRef = useRef(null);
  const [activeScrollIndex, setActiveScrollIndex] = useState(0);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const index = Math.round(scrollRef.current.scrollLeft / 240);
      setActiveScrollIndex(index);
    }
  };

  return (
    <section className="section-base bg-alt overflow-hidden">
      <div className="container-base">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-brand-teal font-medium tracking-wider text-sm uppercase mb-2 block">
              Community Showcase
            </span>
            <h2 className="h2-section mb-0">
              Made with <span className="text-gradient">Viecom</span>
            </h2>
          </div>
          <div className="hidden md:flex gap-3">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="p-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-teal hover:border-brand-teal transition-all shadow-xl hover:scale-110 active:scale-95 z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="p-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-teal hover:border-brand-teal transition-all shadow-xl hover:scale-110 active:scale-95 z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="relative -mx-4 px-4">
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-slate-50 dark:from-slate-900 to-transparent z-10 pointer-events-none md:block hidden" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-50 dark:from-slate-900 to-transparent z-10 pointer-events-none md:block hidden" />

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-4 overflow-x-auto pb-12 pt-4 px-4 scrollbar-hide snap-x snap-mandatory"
          >
            {GALLERY_ITEMS.map((item) => (
              <div
                key={item.id}
                className="flex-none w-[220px] md:w-[280px] snap-start group relative rounded-2xl overflow-hidden aspect-[3/4] shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer bg-slate-200 dark:bg-slate-800"
              >
                {item.type === 'video' ? (
                  <video
                    src={item.url}
                    muted
                    loop
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img src={item.url} className="w-full h-full object-cover" alt={item.title} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-end">
                  <span className="text-[10px] font-bold text-brand-teal uppercase tracking-widest mb-1">
                    {item.category}
                  </span>
                  <h3 className="text-white font-bold text-lg leading-tight">{item.title}</h3>
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur rounded-full p-2 text-white">
                    {item.type === 'video' ? (
                      <Play className="w-4 h-4 fill-current" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-2 mt-4">
            {GALLERY_ITEMS.map((item, i) => (
              <div
                key={item.title ?? String(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === activeScrollIndex ? 'w-8 bg-brand-teal' : 'w-2 bg-slate-300 dark:bg-slate-700'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const Pricing = () => (
  <section id="pricing" className="section-base bg-main">
    <div className="container-base text-center">
      <span className="text-brand-teal font-medium tracking-wider text-sm uppercase mb-2 block">
        Simple Pricing
      </span>
      <h2 className="h2-section mb-16">
        Start for Free, <span className="text-gradient">Scale on Demand</span>
      </h2>
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
        {PRICING_PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative p-8 rounded-3xl text-left transition-all duration-300 ${plan.highlight ? 'bg-slate-900 text-white shadow-2xl scale-105 z-10 border border-brand-teal/50' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}
          >
            {plan.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-teal to-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                Most Popular
              </div>
            )}
            <h3
              className={`text-2xl font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-slate-900 dark:text-white'}`}
            >
              {plan.name}
            </h3>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold font-display">${plan.price}</span>
              {plan.price !== 'Custom' && (
                <span className={`text-sm ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>
                  /mo
                </span>
              )}
            </div>
            <p
              className={`text-sm mb-8 leading-relaxed ${plan.highlight ? 'text-slate-300' : 'text-slate-500'}`}
            >
              {plan.description}
            </p>
            <button
              type="button"
              className={`w-full py-4 rounded-xl font-bold mb-8 transition-transform hover:scale-105 ${plan.highlight ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'}`}
            >
              {plan.cta}
            </button>
            <ul className="space-y-4">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check
                    className={`w-5 h-5 shrink-0 ${plan.highlight ? 'text-brand-teal' : 'text-slate-400'}`}
                  />
                  <span
                    className={
                      plan.highlight ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'
                    }
                  >
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// --- New SEO Pages ---

const NanoBananaPage = () => (
  <div className="animate-fade-in-up">
    <SEO
      title="Nano Banana AI Model for E-commerce | Viecom"
      description="The specialized AI model for product photography. Nano Banana ensures 100% detail preservation, accurate text rendering, and realistic lighting for commercial use."
      keywords="Nano Banana, AI product photography, e-commerce AI, detail preservation, text rendering, realistic lighting"
    />
    <div className="pt-32 pb-16 container-base text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-teal/10 text-brand-teal mb-6">
        <Cpu className="w-4 h-4" /> Proprietary Architecture
      </div>
      <h1 className="h1-hero">
        Beyond Generation. <br />
        This is <span className="text-gradient">Reconstruction.</span>
      </h1>
      <p className="text-xl text-body max-w-3xl mx-auto mb-12">
        Generic AI models "dream" up new products. Nano Banana locks your product's geometry and
        texture before imagining the world around it.
      </p>
    </div>

    {/* Architecture Breakdown */}
    <section className="section-base bg-alt">
      <div className="container-base">
        <h2 className="h2-section text-center mb-16">The 3-Step "Trust" Pipeline</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 font-display text-6xl font-bold">
              01
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6">
              <Scan className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Geometry Scan</h3>
            <p className="text-body text-sm leading-relaxed">
              The model creates a wireframe map of your product, identifying edges, text zones, and
              structural lines that must remain immutable.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 font-display text-6xl font-bold">
              02
            </div>
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 mb-6">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Texture Lock</h3>
            <p className="text-body text-sm leading-relaxed">
              Unlike diffusion models that blend pixels, we freeze the RGB values of your product,
              ensuring logos and materials (like leather grain) are never altered.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 font-display text-6xl font-bold">
              03
            </div>
            <div className="w-12 h-12 bg-brand-teal/10 rounded-2xl flex items-center justify-center text-brand-teal mb-6">
              <Lightbulb className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Light Mapping</h3>
            <p className="text-body text-sm leading-relaxed">
              We calculate how light interacts with the scene and <em>then</em> cast simulated
              shadows/reflections onto your product without changing the product itself.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Hallucination Defense */}
    <section className="section-base bg-main">
      <div className="container-base grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="h2-section">Defense Against Hallucination</h2>
          <p className="text-body text-lg mb-6">
            The #1 fear of e-commerce managers is "Product Integrity". A generated image is useless
            if the brand logo is misspelled or the bottle shape is warped.
          </p>
          <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl mb-6">
            <h4 className="font-bold text-red-500 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" /> The "Generic AI" Problem
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Standard models treat text as shapes, often turning "NIKE" into "NIKEE" or blending
              buttons into the fabric.
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
                  className="opacity-50 blur-[2px] scale-110"
                  alt="Example with warped text"
                />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <AlertTriangle className="text-red-500 w-8 h-8 mb-2" />
                  <span className="text-xs font-bold text-white bg-red-500 px-2 py-1 rounded">
                    Text Warped
                  </span>
                </div>
              </div>
              <p className="text-xs text-center text-slate-500 font-mono">Midjourney V6</p>
            </div>
            <div className="group">
              <div className="aspect-square bg-slate-800 rounded-xl mb-3 flex items-center justify-center text-slate-600 border-2 border-brand-teal relative overflow-hidden shadow-[0_0_20px_rgba(20,184,166,0.2)]">
                <img
                  src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=400"
                  className="absolute inset-0 w-full h-full object-cover"
                  alt="Nano Banana preserved text"
                />
                <div className="absolute bottom-2 right-2 bg-brand-teal text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 100% Match
                </div>
              </div>
              <p className="text-xs text-center text-brand-teal font-bold font-mono">Nano Banana</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <FAQ items={NANO_FAQ} title="Technical Specifications" className="bg-alt" />

    <section className="section-base bg-main text-center">
      <h2 className="h2-section mb-8">Ready to switch?</h2>
      <Link to="/" className="btn-primary inline-flex">
        Try Nano Banana Free
      </Link>
    </section>
  </div>
);

const SolutionsPage = () => (
  <div className="animate-fade-in-up">
    <SEO
      title="AI Video Generator for Amazon & TikTok | Viecom"
      description="Create compliant white-background images for Amazon and viral 9:16 videos for TikTok. One platform for all your e-commerce channels."
      keywords="AI video generator, Amazon compliant images, TikTok video ads, e-commerce content, white background generator, viral video maker"
    />
    <div className="pt-32 pb-16 container-base text-center">
      <h1 className="h1-hero">
        One Product. <br />
        <span className="text-gradient">Everywhere.</span>
      </h1>
      <p className="text-xl text-body max-w-3xl mx-auto">
        Don't just generate art. Generate sales assets compliant with every major platform.
      </p>
    </div>

    {/* Platform Visualizer */}
    <section className="section-base bg-alt">
      <div className="container-base">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-1/3 space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-brand-teal relative">
                <span className="absolute -top-3 left-4 px-2 bg-brand-teal text-white text-[10px] font-bold rounded uppercase">
                  Input Asset
                </span>
                <img
                  src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=400"
                  className="w-full rounded-lg"
                  alt="Source Product"
                />
              </div>
              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-slate-400 rotate-90 md:rotate-0" />
              </div>
            </div>

            <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Amazon */}
              <div className="group relative">
                <div className="aspect-[4/5] bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-center relative overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=400"
                    className="object-contain max-h-full mix-blend-multiply"
                    alt="Amazon"
                  />
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Amazon Main
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">Pure White (255,255,255)</p>
                </div>
              </div>

              {/* Instagram */}
              <div className="group relative">
                <div className="aspect-[4/5] bg-slate-100 rounded-xl overflow-hidden relative">
                  <img
                    src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400"
                    className="w-full h-full object-cover"
                    alt="Instagram"
                  />
                </div>
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Instagram className="w-3 h-3 text-pink-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Instagram 4:5
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">Lifestyle Background</p>
                </div>
              </div>

              {/* TikTok */}
              <div className="group relative">
                <div className="aspect-[4/5] bg-black rounded-xl overflow-hidden relative">
                  <video
                    src="https://videos.pexels.com/video-files/4724036/4724036-uhd_2560_1440_25fps.mp4"
                    autoPlay
                    muted
                    loop
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <img
                      src={PLATFORMS[1].logo}
                      className="h-3 w-3 rounded-full bg-black p-0.5"
                      alt="TikTok logo"
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      TikTok 9:16
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">Motion & Audio</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Compliance Section */}
    <section className="section-base bg-main">
      <div className="container-base grid md:grid-cols-2 gap-12">
        <div>
          <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6 text-orange-500">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h2 className="h2-section text-3xl">Marketplace Safe</h2>
          <p className="text-body mb-6">
            Amazon and eBay algorithms will suppress listings with non-compliant images. We automate
            the boring stuff so you stay ranked.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Pure White BG (RGB 255)</h4>
                <p className="text-xs text-slate-500">
                  Automated removal of all background pixels.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm">85% Frame Fill</h4>
                <p className="text-xs text-slate-500">
                  Auto-crop and zoom to maximize product visibility.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center mb-6 text-pink-500">
            <Smartphone className="w-6 h-6" />
          </div>
          <h2 className="h2-section text-3xl">Viral Ready</h2>
          <p className="text-body mb-6">
            Static images don't convert on TikTok. Our "Still-to-Motion" engine adds physics-based
            movement to stop the scroll.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm">9:16 Outpainting</h4>
                <p className="text-xs text-slate-500">
                  Extends horizontal photos to vertical video formats seamlessly.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Physics Simulation</h4>
                <p className="text-xs text-slate-500">
                  Adds water splashes, smoke, or floating effects to static items.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Batch Workflow - Enterprise */}
    <section className="section-base bg-alt">
      <div className="container-base text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold uppercase tracking-wider mb-6">
          For Power Sellers
        </div>
        <h2 className="h2-section">500 SKUs? No Problem.</h2>
        <p className="text-body text-lg mb-12">
          Stop generating one-by-one. Upload your entire catalog via CSV and let our specialized
          agents handle the rest.
        </p>

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
                  <td className="p-3">Amazon</td>
                  <td className="p-3">"Studio white, detailed stitching"</td>
                  <td className="p-3 text-green-500">Done (4 images)</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="p-3 text-blue-400">#SKU-9022</td>
                  <td className="p-3">Running Shoes</td>
                  <td className="p-3">TikTok</td>
                  <td className="p-3">"Urban street, wet pavement, neon"</td>
                  <td className="p-3 text-yellow-500">Processing (65%)</td>
                </tr>
                <tr>
                  <td className="p-3 text-blue-400">#SKU-9023</td>
                  <td className="p-3">Face Cream</td>
                  <td className="p-3">Instagram</td>
                  <td className="p-3">"Bathroom shelf, morning light"</td>
                  <td className="p-3 text-slate-600">Queued</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12">
          <Link to="/" className="btn-primary inline-flex">
            Start Batch Processing
          </Link>
        </div>
      </div>
    </section>

    <FAQ items={SOLUTIONS_FAQ} title="E-commerce Solutions FAQ" className="bg-main" />
  </div>
);

const ComparisonPage = () => (
  <div className="animate-fade-in-up">
    <SEO
      title="Viecom vs Pebblely & Flair.ai | The Best Alternative"
      description="Compare Viecom with Pebblely and Flair AI. See why Viecom is the superior choice for video generation and batch workflows."
      keywords="Viecom vs Pebblely, Viecom vs Flair AI, best AI product photography, AI video generation comparison, batch workflow AI"
    />
    <div className="pt-32 pb-16 container-base text-center">
      <h1 className="h1-hero">
        Stop Paying for <br /> <span className="text-gradient">"Good Enough"</span>
      </h1>
      <p className="text-xl text-body max-w-3xl mx-auto">
        Most AI tools are just wrappers around Stable Diffusion. Viecom is a complete studio engine
        built for commercial scale.
      </p>
    </div>

    {/* Feature Matrix */}
    <section className="section-base bg-alt">
      <div className="container-base">
        <div className="overflow-x-auto mb-16 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse bg-white dark:bg-slate-900">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="py-6 px-4 text-slate-500 font-medium uppercase tracking-wider text-sm">
                  Feature
                </th>
                <th className="py-6 px-4 bg-brand-teal/5 text-brand-teal font-bold text-lg border-x border-brand-teal/10">
                  Viecom
                </th>
                <th className="py-6 px-4 text-slate-900 dark:text-white font-bold opacity-60">
                  Pebblely
                </th>
                <th className="py-6 px-4 text-slate-900 dark:text-white font-bold opacity-60">
                  Flair.ai
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {[
                {
                  feature: 'Core Technology',
                  viecom: 'Nano Banana (Proprietary)',
                  comp1: 'Stable Diffusion',
                  comp2: 'Stable Diffusion',
                },
                {
                  feature: 'Video Generation',
                  viecom: '✅ Native (Sora 2)',
                  comp1: '❌ No',
                  comp2: '❌ No',
                },
                {
                  feature: 'Batch Processing',
                  viecom: '✅ Excel/CSV Upload',
                  comp1: '⚠️ Limited',
                  comp2: '⚠️ Limited',
                },
                {
                  feature: 'Product Integrity',
                  viecom: '✅ Geometry Lock',
                  comp1: '❌ Hallucination Risk',
                  comp2: '❌ Hallucination Risk',
                },
                {
                  feature: 'Commercial License',
                  viecom: '✅ Included',
                  comp1: '✅ Included',
                  comp2: '✅ Included',
                },
              ].map((row) => (
                <tr key={row.feature} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-4 px-4 font-medium text-slate-900 dark:text-white">
                    {row.feature}
                  </td>
                  <td className="py-4 px-4 bg-brand-teal/5 font-bold text-brand-teal border-x border-brand-teal/10">
                    {row.viecom}
                  </td>
                  <td className="py-4 px-4 text-slate-500">{row.comp1}</td>
                  <td className="py-4 px-4 text-slate-500">{row.comp2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ROI Calculator */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-800">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="text-brand-teal" /> The Video Advantage
            </h3>
            <p className="text-slate-400 mb-6">
              Competitors only give you static JPEGs. In 2024, video ads convert{' '}
              <strong>86% higher</strong> than images.
            </p>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-800 rounded-xl">
                <span>Static Image CTR</span>
                <span className="font-mono text-slate-400">0.8%</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-brand-teal/20 border border-brand-teal/50 rounded-xl">
                <span className="font-bold text-brand-teal">Viecom Video CTR</span>
                <span className="font-mono font-bold text-brand-teal">3.2%</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Coins className="text-orange-500" /> Cost Analysis
            </h3>
            <p className="text-body mb-6">Cost to produce 10 Product Videos:</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-24 text-sm font-bold">Traditional</div>
                <div className="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden relative">
                  <div className="absolute top-0 left-0 h-full bg-slate-400 w-[100%]" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white">
                    $2,500+
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24 text-sm font-bold">Competitors</div>
                <div className="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden relative">
                  <div className="absolute top-0 left-0 h-full bg-slate-300 w-[0%]" />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    Not Supported
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24 text-sm font-bold text-brand-teal">Viecom</div>
                <div className="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden relative">
                  <div className="absolute top-0 left-0 h-full bg-brand-teal w-[10%]" />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-white">
                    $49
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <FAQ items={COMPARISON_FAQ} title="Switching to Viecom" className="bg-main" />

    <section className="section-base bg-alt text-center">
      <h2 className="h2-section mb-8">Join 50,000+ Smart Sellers</h2>
      <Link to="/" className="btn-primary inline-flex">
        Start Free Trial
      </Link>
    </section>
  </div>
);

const Home = () => (
  <>
    <SEO
      title="Viecom | AI Product Video & Image Generator for E-commerce (Nano Banana)"
      description="Turn product photos into viral videos & pro images in seconds. Powered by Nano Banana & Sora 2. Batch process for Amazon, TikTok & Shopify."
      keywords="AI product video, image generator, e-commerce AI, Nano Banana, Sora 2, Amazon, TikTok, Shopify, batch processing"
    />
    <Hero />
    <BrandAnalysis />
    <TransformationShowcase />
    <BatchGenerationFeature />
    <VideoGenerationShowcase />
    <Gallery />
    <Pricing />
    <FAQ items={GENERAL_FAQ} title="Frequently Asked Questions" className="bg-alt" />
  </>
);

const Footer = () => (
  <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
    <div className="container-base">
      <div className="grid md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-teal to-blue-500 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Viecom.pro</span>
          </div>
          <p className="text-sm leading-relaxed mb-6">
            Empowering e-commerce brands with generative AI. Create studio-quality content in
            seconds, not weeks.
          </p>
          <div className="flex gap-4">
            {[
              { Icon: Twitter, href: 'https://twitter.com' },
              { Icon: Instagram, href: 'https://instagram.com' },
              { Icon: Linkedin, href: 'https://linkedin.com' },
              { Icon: Github, href: 'https://github.com' },
            ].map(({ Icon, href }) => (
              <a
                key={href}
                href={href}
                className="p-2 bg-slate-900 rounded-full hover:bg-slate-800 hover:text-white transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Product</h4>
          <ul className="space-y-4 text-sm">
            <li>
              <Link to="/" className="hover:text-brand-teal transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link to="/models/nano-banana" className="hover:text-brand-teal transition-colors">
                Nano Banana Model
              </Link>
            </li>
            <li>
              <Link to="/solutions/ecommerce" className="hover:text-brand-teal transition-colors">
                Video Generator
              </Link>
            </li>
            <li>
              <a href="#studio" className="hover:text-brand-teal transition-colors">
                Image Studio
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Solutions</h4>
          <ul className="space-y-4 text-sm">
            <li>
              <Link to="/solutions/ecommerce" className="hover:text-brand-teal transition-colors">
                For Amazon Sellers
              </Link>
            </li>
            <li>
              <Link to="/solutions/ecommerce" className="hover:text-brand-teal transition-colors">
                For TikTok Shop
              </Link>
            </li>
            <li>
              <Link
                to="/compare/viecom-vs-competitors"
                className="hover:text-brand-teal transition-colors"
              >
                Compare vs Competitors
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Legal</h4>
          <ul className="space-y-4 text-sm">
            <li>
              <Link to="/privacy" className="hover:text-brand-teal transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-brand-teal transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link to="/cookies" className="hover:text-brand-teal transition-colors">
                Cookie Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
        <p>© 2024 Viecom AI Inc. All rights reserved.</p>
        <div className="flex gap-8">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" /> System Operational
          </span>
        </div>
      </div>
    </div>
  </footer>
);

const App = () => {
  return (
    <HashRouter>
      <div className="min-h-screen bg-main text-body font-sans selection:bg-brand-teal/20 selection:text-brand-teal">
        <nav className="fixed w-full z-50 top-0 left-0 border-b border-white/5 bg-slate-900/80 backdrop-blur-md">
          <div className="container-base flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-teal to-blue-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Viecom.pro</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link
                to="/models/nano-banana"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Nano Banana
              </Link>
              <Link
                to="/solutions/ecommerce"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Solutions
              </Link>
              <Link
                to="/compare/viecom-vs-competitors"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Compare
              </Link>
              <a
                href="#pricing"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Pricing
              </a>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <Sun className="w-5 h-5 hidden dark:block" />
                <Moon className="w-5 h-5 block dark:hidden" />
              </button>
              <button
                type="button"
                className="bg-white text-slate-900 px-5 py-2 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/models/nano-banana" element={<NanoBananaPage />} />
            <Route path="/solutions/ecommerce" element={<SolutionsPage />} />
            <Route path="/compare/viecom-vs-competitors" element={<ComparisonPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </HashRouter>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
