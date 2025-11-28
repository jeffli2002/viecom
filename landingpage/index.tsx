import {
  Activity,
  Box,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cpu,
  FileSpreadsheet,
  Film,
  Github,
  Globe,
  Instagram,
  Layers,
  Linkedin,
  Loader2,
  Maximize2,
  Menu,
  Minus,
  MonitorPlay,
  Moon,
  Palette,
  Pause,
  Play,
  Plus,
  Ratio,
  RefreshCw,
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
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

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
      'API Access',
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
    input1: { label: 'Source Outfit', image: '/imagesgen/changemodel1.jpg' },
    input2: { label: 'Target Model', image: '/imagesgen/targetmodel.jpg' },
    result: '/imagesgen/changemode_output.png',
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

const FAQ_ITEMS = [
  {
    question: 'Can I use the generated videos for commercial ads?',
    answer:
      'Yes! All content generated on our Pro and Enterprise plans comes with a full commercial license, allowing you to use it for paid advertising on Facebook, TikTok, Instagram, and Amazon.',
  },
  {
    question: 'How does the AI maintain my brand consistency?',
    answer:
      'Our Brand Guard™ technology analyzes your website or uploaded assets to extract your specific color palette, fonts, and logo. It then enforces these guidelines on every pixel generated to ensure 100% on-brand results.',
  },
  {
    question: 'What is the video resolution?',
    answer:
      'Starter plans support 720p HD. Pro and Enterprise plans unlock 4K Ultra HD rendering for crisp, professional-quality visuals suitable for large screens and premium ad placements.',
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
];

const Hero = () => (
  // Uses global class 'bg-main'
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
        <button type="button" className="btn-primary">
          <Zap className="w-5 h-5" />
          Start Generating Free
        </button>
        <button
          type="button"
          className="px-8 py-4 bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/20 text-slate-900 dark:text-white font-medium rounded-xl backdrop-blur-md border border-slate-200 dark:border-white/10 transition-all flex items-center gap-2 shadow-sm dark:shadow-none"
        >
          <Play className="w-5 h-5 fill-current" />
          Watch Demo
        </button>
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
  // Uses global class 'section-base' and 'bg-alt'
  <section className="section-base bg-alt">
    <div className="container-base">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div className="order-2 lg:order-1">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-400 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
            <div className="relative bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
              {/* Mock UI for Brand Analysis */}
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
  const activeScenario = TRANSFORMATION_SCENARIOS[activeIndex];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % TRANSFORMATION_SCENARIOS.length);
  };

  const handlePrev = () => {
    setActiveIndex(
      (prev) => (prev - 1 + TRANSFORMATION_SCENARIOS.length) % TRANSFORMATION_SCENARIOS.length
    );
  };

  return (
    // Uses global class 'section-base' and 'bg-main'
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
          {/* Left Arrow */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-0 lg:-left-12 top-1/2 -translate-y-1/2 z-40 p-4 rounded-full glass-card shadow-xl text-slate-600 dark:text-slate-300 transition-all hover:scale-110 active:scale-95"
            aria-label="Previous scenario"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow */}
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-0 lg:-right-12 top-1/2 -translate-y-1/2 z-40 p-4 rounded-full glass-card shadow-xl text-slate-600 dark:text-slate-300 transition-all hover:scale-110 active:scale-95"
            aria-label="Next scenario"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="grid lg:grid-cols-12 gap-6 items-center max-w-7xl mx-auto min-h-[600px]">
            {/* Left Panel: Inputs */}
            <div className="lg:col-span-5 space-y-6 relative z-20">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-teal to-purple-600 rounded-2xl opacity-20 blur transition duration-500 group-hover:opacity-40" />
                <div className="glass-card p-8 rounded-2xl relative shadow-2xl">
                  <div className="flex gap-4 items-center mb-8">
                    <div className="w-10 h-10 rounded-full bg-brand-teal/10 flex items-center justify-center text-brand-teal font-bold text-lg">
                      1
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Input Assets
                    </h3>
                  </div>

                  <div
                    key={activeScenario.id}
                    className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-left-4 duration-500"
                  >
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {activeScenario.input1.label}
                      </span>
                      <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 relative group/input cursor-zoom-in shadow-inner">
                        <img
                          src={activeScenario.input1.image}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/input:scale-110"
                          alt="Input 1"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {activeScenario.input2.label}
                      </span>
                      <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 relative group/input cursor-zoom-in shadow-inner">
                        <img
                          src={activeScenario.input2.image}
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

            {/* Central Icon */}
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

            {/* Right Panel: 3D Carousel */}
            <div className="lg:col-span-5 lg:col-start-8 h-[600px] relative perspective-[1200px] flex items-center justify-center z-10">
              {TRANSFORMATION_SCENARIOS.map((scenario, index) => {
                const offset = index - activeIndex;
                const absOffset = Math.abs(offset);
                if (absOffset > 2) return null;

                const isActive = index === activeIndex;
                const zIndex = 50 - absOffset;
                const opacity = Math.max(0, 1 - absOffset * 0.6);
                const scale = Math.max(0, 1 - absOffset * 0.2);
                const translateX = offset * 50;
                const rotateY = offset * -15;

                return (
                  <button
                    type="button"
                    key={scenario.id}
                    className="absolute w-full max-w-[380px] aspect-[4/5] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer origin-center border-0 bg-transparent p-0"
                    style={{
                      zIndex,
                      opacity,
                      transform: `translateX(${translateX}%) scale(${scale}) rotateY(${rotateY}deg)`,
                    }}
                    onClick={() => setActiveIndex(index)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveIndex(index);
                      }
                    }}
                    aria-label={`View ${scenario.title || 'scenario'} ${index + 1}`}
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
  // Uses global class 'section-base' and 'bg-alt'
  <section className="section-base bg-alt">
    <div className="container-base">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="tag-pill bg-brand-blue/10 text-brand-blue dark:text-blue-400 mb-6">
            <Layers className="w-4 h-4" /> Batch Processing
          </div>
          <h2 className="h2-section">
            Scale Content <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-teal to-brand-blue">
              Exponentially
            </span>
          </h2>
          <p className="text-lg text-body leading-relaxed mb-8">
            Need to launch a campaign across 5 platforms? Generate hundreds of variations for A/B
            testing or multi-channel distribution in a single click.
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="p-3 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-brand-teal dark:text-teal-400">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Multi-Format Export</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Automatically resize and recompose for Stories, Posts, Banners, and Ads.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-brand-blue dark:text-blue-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">CSV Bulk Import</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Upload your entire product catalog spreadsheet and let AI do the rest.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-2 gap-4 relative z-10">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`aspect-square rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transform transition-transform hover:scale-105 ${i % 2 === 0 ? 'translate-y-8' : ''}`}
              >
                <div className="h-2/3 bg-slate-100 dark:bg-slate-800 relative overflow-hidden group">
                  <img
                    src={`https://images.unsplash.com/photo-${i === 1 ? '1542291026-7eec264c27ff' : i === 2 ? '1595777457583-95e059d581b8' : i === 3 ? '1523275335684-37898b6baf30' : '1505740420926-4d519d00f7d9'}?auto=format&fit=crop&q=80&w=400`}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    alt="Batch item"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 backdrop-blur rounded text-[10px] text-white font-bold">
                    {i === 1 ? '1:1' : i === 2 ? '9:16' : i === 3 ? '16:9' : '4:5'}
                  </div>
                </div>
                <div className="p-3">
                  <div className="h-2 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <div className="h-2 w-8 bg-slate-100 dark:bg-slate-800 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-brand-teal/20 to-brand-blue/20 blur-3xl rounded-full -z-0" />
        </div>
      </div>
    </div>
  </section>
);

const VideoGenerationShowcase = () => {
  const [activeCategory, setActiveCategory] = useState('Apparel');
  const [activeDemo, setActiveDemo] = useState(VEO_DEMOS[0]);
  const categories = Array.from(new Set(VEO_DEMOS.map((d) => d.category)));
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('Initializing...');

  const handleDemoChange = (demo) => {
    setActiveDemo(demo);
    setIsGenerating(false);
    setProgress(0);
    if (videoRef.current) {
      videoRef.current.load();
    }
    setIsPlaying(true);
  };

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    const firstInCat = VEO_DEMOS.find((d) => d.category === cat);
    if (firstInCat) handleDemoChange(firstInCat);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleGenerate = () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setProgress(0);
    setStage('Initializing connection to Veo...');
    setIsPlaying(false);
    if (videoRef.current) videoRef.current.pause();

    const duration = 4000; // Increased duration for better visual effect
    const intervalTime = 50;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min(Math.round((currentStep / steps) * 100), 100);
      setProgress(newProgress);

      // Simulate stages
      if (newProgress < 25) setStage('Analyzing prompt & geometry...');
      else if (newProgress < 50) setStage('Generating keyframes...');
      else if (newProgress < 75) setStage('Interpolating motion...');
      else setStage('Finalizing 4K output...');

      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(() => {
          setIsGenerating(false);
          setProgress(0);
          if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
            setIsPlaying(true);
          }
        }, 500);
      }
    }, intervalTime);
  };

  return (
    // Uses global class 'section-base' and 'bg-main'
    <section className="section-base bg-main">
      <div className="container-base">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 text-brand-teal font-mono text-xs font-bold tracking-widest uppercase mb-3">
              <span className="flex h-2 w-2 rounded-full bg-brand-teal animate-pulse" />
              Veo 3.1 Engine Active
            </div>
            <h2 className="h2-section">
              Static to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-teal to-brand-blue">
                Cinematic
              </span>
            </h2>
            <p className="text-body max-w-xl text-sm md:text-base">
              Generate high-fidelity video assets from a single product image. Control camera
              motion, lighting, and physics with simple text prompts.
            </p>
          </div>
        </div>

        {/* Main Studio Container */}
        <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 text-slate-300 font-sans ring-1 ring-white/10 lg:h-[650px] flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
            {/* LEFT PANEL: Input & Settings (3 Cols) */}
            <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900 flex flex-col h-full">
              {/* Panel Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5" /> Source
                </h3>
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
              </div>

              <div className="p-5 flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                {/* Category Pills */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        activeCategory === cat
                          ? 'bg-brand-teal/20 text-teal-300 border-brand-teal/50 shadow-[0_0_10px_rgba(20,184,166,0.1)]'
                          : 'bg-slate-800 text-slate-400 border-transparent hover:bg-slate-800/80 hover:text-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Input Image Card */}
                <div className="space-y-2">
                  <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden border border-slate-700 group bg-slate-800 shadow-inner">
                    <img
                      src={activeDemo.input}
                      className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:opacity-50"
                      alt="Input"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <div className="bg-slate-900/80 p-3 rounded-full border border-white/10 backdrop-blur">
                        <Upload className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-black/60 backdrop-blur text-[10px] font-mono text-white px-2 py-1 rounded border border-white/10 flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-400" /> READY
                      </span>
                    </div>
                  </div>
                </div>

                {/* Prompt Editor */}
                <div className="flex-1 min-h-[100px] bg-black/20 rounded-xl border border-slate-800 p-4 flex flex-col gap-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Wand2 className="w-3 h-3" /> Prompt
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">
                      {activeDemo.prompt.length} chars
                    </span>
                  </div>
                  <textarea
                    readOnly
                    className="w-full h-full bg-transparent text-sm text-slate-300 font-mono leading-relaxed resize-none focus:outline-none custom-scrollbar"
                    value={activeDemo.prompt}
                  />
                </div>
              </div>

              {/* Generate Button Area */}
              <div className="p-5 border-t border-slate-800 bg-slate-900 relative z-10 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`w-full py-4 bg-gradient-to-r from-brand-teal to-brand-blue hover:from-teal-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-[0_4px_20px_rgba(20,184,166,0.3)] flex items-center justify-center gap-2 transition-all active:scale-95 group border border-white/10 ${isGenerating ? 'opacity-75 cursor-wait' : ''}`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 group-hover:animate-spin" />
                      Generate Video
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* CENTER PANEL: Viewport (6 Cols) */}
            <div className="lg:col-span-6 bg-[#0f172a] relative flex flex-col h-full">
              {/* Viewport Header */}
              <div className="h-14 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900 z-20 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 rounded bg-red-500/10 border border-red-500/20 backdrop-blur-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-red-500 tracking-widest">REC</span>
                  </div>
                  <div className="h-4 w-px bg-slate-800" />
                  <span className="text-xs font-mono text-slate-500 flex items-center gap-2">
                    <Ratio className="w-3 h-3" />{' '}
                    {activeDemo.ratio === '9:16' ? '1080x1920' : '1920x1080'}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-500 tabular-nums">00:00:04:12</div>
              </div>

              {/* Viewport Content */}
              <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[#0a0f1e]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.1),transparent_70%)] pointer-events-none" />
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />

                {/* LOADING OVERLAY */}
                {isGenerating && (
                  <div className="absolute inset-0 z-50 bg-[#0f172a]/95 backdrop-blur-md flex flex-col items-center justify-center p-8 transition-all duration-300">
                    {/* Animated HUD */}
                    <div className="relative w-32 h-32 mb-8">
                      {/* Outer Ring */}
                      <div className="absolute inset-0 border-2 border-slate-800 rounded-full" />
                      <div className="absolute inset-0 border-2 border-brand-teal rounded-full border-t-transparent animate-spin" />

                      {/* Inner Ring Reverse */}
                      <div className="absolute inset-4 border-2 border-slate-700 rounded-full" />
                      <div
                        className="absolute inset-4 border-2 border-brand-blue rounded-full border-b-transparent animate-spin opacity-70"
                        style={{ animationDirection: 'reverse', animationDuration: '3s' }}
                      />

                      {/* Center Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Cpu className="w-8 h-8 text-white animate-pulse" />
                      </div>
                    </div>

                    {/* Text info */}
                    <h4 className="text-2xl font-bold text-white font-display tracking-tight mb-2">
                      {Math.round(progress)}%
                    </h4>
                    <p className="text-brand-teal font-mono text-xs uppercase tracking-widest mb-8 animate-pulse">
                      {stage}
                    </p>

                    {/* Staged Progress Bar */}
                    <div className="w-64 grid grid-cols-4 gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 rounded-full transition-colors duration-300 ${
                            progress >= i * 25
                              ? 'bg-brand-teal shadow-[0_0_10px_rgba(20,184,166,0.5)]'
                              : progress >= (i - 1) * 25 + 10
                                ? 'bg-brand-teal/50'
                                : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Console output mock */}
                    <div className="mt-8 font-mono text-[10px] text-slate-500 space-y-1 text-center opacity-70">
                      <div>&gt; Veo_Engine_v3.1 initialized</div>
                      <div className={progress > 20 ? 'text-slate-400' : 'hidden'}>
                        &gt; Geometry inference: OK
                      </div>
                      <div className={progress > 50 ? 'text-slate-400' : 'hidden'}>
                        &gt; Physics simulation: ACTIVE
                      </div>
                    </div>
                  </div>
                )}

                <div className="w-full h-full flex items-center justify-center p-4 relative group">
                  <video
                    key={activeDemo.id}
                    ref={videoRef}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl bg-black/20"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  >
                    <source src={activeDemo.video} type="video/mp4" />
                  </video>

                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className={`w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transform transition-all duration-300 shadow-2xl ${isPlaying && !isGenerating ? 'opacity-0 scale-90' : 'opacity-100 scale-100'} ${isGenerating ? 'hidden' : ''}`}
                    >
                      <Play className="w-8 h-8 fill-white text-white ml-1" />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="absolute inset-0 cursor-pointer"
                    onClick={togglePlay}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        togglePlay();
                      }
                    }}
                    aria-label={isPlaying ? 'Pause video' : 'Play video'}
                  />
                </div>
              </div>

              {/* Viewport Footer */}
              <div className="h-14 bg-slate-900 border-t border-slate-800 flex items-center px-6 gap-4 flex-shrink-0">
                <button
                  type="button"
                  onClick={togglePlay}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      togglePlay();
                    }
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                </button>
                <div className="flex-1 h-12 flex items-center group cursor-pointer">
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full w-1/3 bg-brand-teal group-hover:bg-teal-400 transition-colors" />
                    <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
                  <span className="text-[10px] font-mono text-slate-500">AUTO-LOOP</span>
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400 hover:text-white cursor-pointer transition-colors" />
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: Queue (3 Cols) */}
            <div className="lg:col-span-3 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-full">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Film className="w-3.5 h-3.5" /> Queue
                </h3>
                <span className="text-[10px] text-slate-600">{VEO_DEMOS.length} Items</span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {VEO_DEMOS.map((demo, _idx) => (
                  <button
                    type="button"
                    key={demo.id}
                    onClick={() => handleDemoChange(demo)}
                    className={`w-full text-left group rounded-xl overflow-hidden border transition-all duration-300 ${
                      activeDemo.id === demo.id
                        ? 'border-brand-teal ring-1 ring-brand-teal/30 bg-slate-800'
                        : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="h-32 w-full relative overflow-hidden bg-black/50">
                      <img
                        src={demo.input}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                        alt="Thumbnail"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                      {activeDemo.id === demo.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-brand-teal/10 backdrop-blur-[1px]">
                          <div className="w-10 h-10 rounded-full bg-brand-teal/90 flex items-center justify-center shadow-lg">
                            <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                        <span className="text-[10px] font-bold text-white bg-black/40 backdrop-blur px-1.5 py-0.5 rounded border border-white/10">
                          {demo.ratio}
                        </span>
                        <span className="text-[10px] font-medium text-slate-300 flex items-center gap-1 bg-black/40 backdrop-blur px-1.5 py-0.5 rounded border border-white/10">
                          <Sparkles className="w-3 h-3 text-teal-400" />
                          {demo.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed group-hover:text-slate-300 transition-colors">
                        {demo.prompt}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                        <Clock className="w-3 h-3" /> 00:05
                        <span className="w-0.5 h-0.5 rounded-full bg-slate-700" />
                        {demo.views} views
                      </div>
                    </div>
                  </button>
                ))}

                <div className="pt-2">
                  <button
                    type="button"
                    className="w-full py-3 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-slate-800 border-dashed hover:border-slate-600 flex items-center justify-center gap-2"
                  >
                    <Upload className="w-3 h-3" /> Add Media to Queue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Gallery = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 300;
      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      // Card width logic: mobile 220+20=240, desktop 280+20=300
      const cardWidth = window.innerWidth >= 768 ? 300 : 240;
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveIndex(newIndex);
    }
  };

  const scrollToItem = (index: number) => {
    if (scrollRef.current) {
      const cardWidth = window.innerWidth >= 768 ? 300 : 240;
      scrollRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
    }
  };

  return (
    // Uses global class 'section-base' and 'bg-alt'
    <section className="section-base bg-alt relative group">
      <div className="container-base">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="h2-section">
              Community <span className="text-brand-teal">Showcase</span>
            </h2>
            <p className="text-sm text-body">See what others are creating with EcomGen.ai</p>
          </div>
        </div>

        <div className="relative px-4 md:px-12">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white transition-all duration-300 hover:scale-110 hover:border-brand-teal hover:text-brand-teal hidden md:flex items-center justify-center"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white transition-all duration-300 hover:scale-110 hover:border-brand-teal hover:text-brand-teal hidden md:flex items-center justify-center"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-5 overflow-x-auto scrollbar-hide pb-8 -mx-4 px-4 snap-x"
          >
            {GALLERY_ITEMS.map((item, _index) => (
              <div
                key={item.id}
                className="w-[220px] md:w-[280px] flex-none aspect-[3/4] relative group/card rounded-xl overflow-hidden cursor-pointer snap-center border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 bg-slate-100 dark:bg-slate-800"
              >
                <img
                  loading="lazy"
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <span className="text-white font-bold text-base transform translate-y-4 group-hover/card:translate-y-0 transition-transform duration-300">
                    {item.title}
                  </span>
                  <span className="text-xs text-white/80 transform translate-y-4 group-hover/card:translate-y-0 transition-transform duration-300 delay-75">
                    {item.category}
                  </span>
                  {item.type === 'video' && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                      <Play className="w-3 h-3 text-white fill-current" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {GALLERY_ITEMS.map((item, idx) => (
              <button
                type="button"
                key={`gallery-${idx}-${item.id || idx}`}
                onClick={() => scrollToItem(idx)}
                className={`transition-all duration-300 rounded-full ${
                  activeIndex === idx
                    ? 'w-8 h-2 bg-brand-teal'
                    : 'w-2 h-2 bg-slate-300 dark:bg-slate-700 hover:bg-brand-teal/50'
                }`}
                aria-label={`Go to item ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    // Uses global class 'section-base' and 'bg-main'
    <section className="section-base bg-main">
      <div className="container-base">
        <div className="text-center mb-16">
          <h2 className="h2-section">
            Simple, Transparent <span className="text-brand-teal">Pricing</span>
          </h2>
          <p className="text-lg text-body mb-8">Choose the perfect plan for your creative needs.</p>

          <div className="flex items-center justify-center gap-4 mb-8">
            <span
              className={`text-sm font-medium ${!isAnnual ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}
            >
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-14 h-7 bg-brand-teal rounded-full relative transition-colors duration-300"
              aria-label={isAnnual ? 'Switch to monthly billing' : 'Switch to annual billing'}
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-sm ${isAnnual ? 'left-8' : 'left-1'}`}
              />
            </button>
            <span
              className={`text-sm font-medium ${isAnnual ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}
            >
              Yearly{' '}
              <span className="text-brand-teal text-xs font-bold bg-brand-teal/10 px-2 py-0.5 rounded-full ml-1">
                -20%
              </span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                plan.highlight
                  ? 'bg-main shadow-2xl scale-105 border-2 border-brand-teal z-10'
                  : 'bg-main shadow-lg border border-slate-200 dark:border-slate-800 hover:scale-105'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-teal text-white text-sm font-bold px-4 py-1 rounded-full shadow-lg">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">
                  $
                  {plan.price === 'Custom'
                    ? 'Custom'
                    : isAnnual && plan.price !== '0'
                      ? Math.floor(Number(plan.price) * 0.8)
                      : plan.price}
                </span>
                {plan.price !== 'Custom' && <span className="text-slate-500">/mo</span>}
              </div>
              <p className="text-body text-sm mb-6">{plan.description}</p>

              <button
                type="button"
                className={`w-full py-3 rounded-xl font-bold mb-8 transition-all ${
                  plan.highlight
                    ? 'bg-brand-teal text-white hover:bg-teal-600 shadow-lg shadow-teal-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {plan.cta}
              </button>

              <ul className="space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-body">
                    <Check className="w-5 h-5 text-brand-teal flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    // Uses global class 'section-base' and 'bg-alt'
    <section className="section-base bg-alt">
      <div className="container-base max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="h2-section">
            Frequently Asked <span className="text-brand-teal">Questions</span>
          </h2>
          <p className="text-lg text-body">Everything you need to know about EcomGen.ai</p>
        </div>

        <div className="space-y-4">
          {FAQ_ITEMS.map((item, index) => (
            <div
              key={`faq-${index}-${item.question}`}
              className={`border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all duration-300 ${openIndex === index ? 'bg-main shadow-md' : 'bg-slate-100 dark:bg-slate-900/50 hover:border-brand-teal/30'}`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                aria-expanded={openIndex === index}
                aria-controls={`faq-${index}`}
              >
                <span className="font-bold text-slate-900 dark:text-white pr-8">
                  {item.question}
                </span>
                <span
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${openIndex === index ? 'bg-brand-teal border-brand-teal text-white rotate-180' : 'border-slate-300 dark:border-slate-600 text-slate-500'}`}
                >
                  {openIndex === index ? (
                    <Minus className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </span>
              </button>

              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${openIndex === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="px-6 pb-6 text-body leading-relaxed text-sm md:text-base border-t border-slate-200/50 dark:border-slate-700/50 pt-4">
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  // Uses global class 'bg-main'
  <footer className="bg-main pt-20 pb-10 border-t border-slate-200 dark:border-white/5 transition-colors duration-300">
    <div className="container-base">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-2xl font-bold font-display text-slate-900 dark:text-white">
            <div className="w-8 h-8 rounded-lg bg-brand-teal flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            EcomGen.ai
          </div>
          <p className="text-body leading-relaxed">
            Empowering e-commerce brands with generative AI to create high-converting visuals at
            scale.
          </p>
          <div className="flex gap-4">
            {[
              { Icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
              { Icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
              { Icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
              { Icon: Github, href: 'https://github.com', label: 'GitHub' },
            ].map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-brand-teal hover:text-white transition-all"
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-6">Product</h4>
          <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
            <li>
              <a href="/video-generation" className="hover:text-brand-teal transition-colors">
                Video Generation
              </a>
            </li>
            <li>
              <a href="/image-generation" className="hover:text-brand-teal transition-colors">
                Image Studio
              </a>
            </li>
            <li>
              <a href="/brand-analysis" className="hover:text-brand-teal transition-colors">
                Brand Guard™
              </a>
            </li>
            <li>
              <a href="/batch-image-generation" className="hover:text-brand-teal transition-colors">
                Batch Processing
              </a>
            </li>
            <li>
              <a href="/pricing" className="hover:text-brand-teal transition-colors">
                Pricing
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-6">Resources</h4>
          <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
            <li>
              <a href="/docs" className="hover:text-brand-teal transition-colors">
                Blog
              </a>
            </li>
            <li>
              <a href="/docs" className="hover:text-brand-teal transition-colors">
                Case Studies
              </a>
            </li>
            <li>
              <a href="/docs" className="hover:text-brand-teal transition-colors">
                Community
              </a>
            </li>
            <li>
              <a href="/contact" className="hover:text-brand-teal transition-colors">
                Help Center
              </a>
            </li>
            <li>
              <a href="/docs" className="hover:text-brand-teal transition-colors">
                API Docs
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-6">Company</h4>
          <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
            <li>
              <a href="/about" className="hover:text-brand-teal transition-colors">
                About Us
              </a>
            </li>
            <li>
              <a href="/contact" className="hover:text-brand-teal transition-colors">
                Careers
              </a>
            </li>
            <li>
              <a href="/privacy" className="hover:text-brand-teal transition-colors">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="/terms" className="hover:text-brand-teal transition-colors">
                Terms of Service
              </a>
            </li>
            <li>
              <a href="/contact" className="hover:text-brand-teal transition-colors">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="pt-8 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500 dark:text-slate-500">
        <p>© 2024 EcomGen AI Inc. All rights reserved.</p>
        <div className="flex gap-8">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Cookies</span>
        </div>
      </div>
    </div>
  </footer>
);

const Navbar = ({ darkMode, setDarkMode }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'glass-card border-b py-4' : 'bg-transparent py-6'}`}
    >
      <div className="container-base">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-2xl font-bold font-display text-slate-900 dark:text-white">
            <div className="w-8 h-8 rounded-lg bg-brand-teal flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            EcomGen.ai
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-teal dark:hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#studio"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-teal dark:hover:text-white transition-colors"
            >
              Studio
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-teal dark:hover:text-white transition-colors"
            >
              Pricing
            </a>

            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              type="button"
              className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Get Started
            </button>
          </div>

          <div className="md:hidden flex items-center gap-4">
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-900 dark:text-white"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-main border-b border-slate-200 dark:border-slate-800 p-4 shadow-xl animate-in slide-in-from-top-5">
          <div className="flex flex-col gap-4">
            <a
              href="#features"
              className="text-base font-medium text-slate-900 dark:text-white p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
            >
              Features
            </a>
            <a
              href="#studio"
              className="text-base font-medium text-slate-900 dark:text-white p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
            >
              Studio
            </a>
            <a
              href="#pricing"
              className="text-base font-medium text-slate-900 dark:text-white p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
            >
              Pricing
            </a>
            <button
              type="button"
              className="w-full py-3 bg-brand-teal text-white font-bold rounded-xl mt-2"
            >
              Get Started Free
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

const App = () => {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen font-sans selection:bg-brand-teal/30 ${darkMode ? 'dark' : ''}`}>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <main>
        <Hero />
        <BrandAnalysis />
        <TransformationShowcase />
        <BatchGenerationFeature />
        <VideoGenerationShowcase />
        <Gallery />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
} else {
  console.error('Root element not found');
}
