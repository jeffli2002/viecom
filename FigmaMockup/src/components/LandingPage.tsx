import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Sparkles, 
  Zap, 
  Image, 
  Video, 
  Wand2, 
  Palette, 
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Star,
  ShoppingBag,
  ChevronRight,
  Play,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl blur-lg opacity-50" />
                <div className="relative bg-gradient-to-br from-violet-600 to-fuchsia-600 p-2.5 rounded-xl">
                  <Sparkles className="size-5 text-white" />
                </div>
              </div>
              <span className="text-slate-900">AI Studio</span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Button 
                onClick={onGetStarted}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/25"
              >
                Get Started Free
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-fuchsia-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
        </div>

        <div className="container mx-auto max-w-7xl">
          <motion.div 
            className="text-center max-w-4xl mx-auto space-y-8 mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="gap-2 py-2 px-4 bg-violet-50 text-violet-700 border-violet-200">
                <Sparkles className="size-3" />
                Trusted by 50,000+ brands worldwide
              </Badge>
            </motion.div>
            
            <motion.h1 
              className="text-6xl md:text-8xl text-slate-900 tracking-tight leading-[1.1]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Product visuals that
              <br />
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
                  sell themselves
                </span>
                <motion.div 
                  className="absolute bottom-2 left-0 right-0 h-4 bg-gradient-to-r from-violet-200 to-fuchsia-200 -z-0"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                />
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Generate professional product images and videos with AI.
              <br />No photoshoot. No editing. Just results.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button 
                size="lg" 
                className="gap-2 text-lg px-8 py-7 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-xl shadow-violet-500/25"
                onClick={onGetStarted}
              >
                <Sparkles className="size-5" />
                Start Creating - It's Free
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-7 border-2 gap-2"
              >
                <Play className="size-5" />
                Watch Demo
              </Button>
            </motion.div>

            <motion.div 
              className="flex items-center justify-center gap-8 text-sm text-slate-500 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-600" />
                No credit card
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-600" />
                40 free credits
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-600" />
                Cancel anytime
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Visual - Bento Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            {/* Three equal showcases in one row */}
            <motion.div 
              className="relative group"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 relative">
                <img 
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80"
                  alt="Product 1"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <Badge className="bg-white/90 backdrop-blur-sm text-slate-900 gap-2">
                    <Sparkles className="size-3" />
                    AI Generated
                  </Badge>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="relative group"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-violet-100 to-fuchsia-100 relative">
                <img 
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"
                  alt="Product 2"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4">
                  <Badge className="bg-white/90 backdrop-blur-sm gap-1">
                    <Video className="size-3" />
                    Video
                  </Badge>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="relative group"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 relative">
                <img 
                  src="https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80"
                  alt="Product 3"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4">
                  <Badge className="bg-white/90 backdrop-blur-sm gap-1">
                    <Image className="size-3" />
                    Lifestyle
                  </Badge>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y bg-slate-50/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { value: '2M+', label: 'Images Generated' },
              { value: '50K+', label: 'Happy Customers' },
              { value: '3.2s', label: 'Avg. Generation' },
              { value: '99.9%', label: 'Satisfaction Rate' }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-4xl md:text-5xl bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Section */}
      <section className="py-32 px-6 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-6 bg-violet-50 text-violet-700 border-violet-200">
              Key Features
            </Badge>
            <h2 className="text-5xl md:text-6xl text-slate-900 mb-6">
              Everything you need to create
              <br />
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                stunning product visuals
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Our AI-powered platform combines cutting-edge technology with intuitive design to help you create professional product images and videos in minutes, not days.
            </p>
          </motion.div>

          {/* Feature 1 - AI Background Generation */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700">
                <Wand2 className="size-4" />
                <span className="text-sm">AI Background Generation</span>
              </div>
              <h3 className="text-4xl text-slate-900">
                Transform any product with AI-generated backgrounds
              </h3>
              <p className="text-lg text-slate-600 leading-relaxed">
                Simply upload your product photo and let our AI create stunning, contextual backgrounds. Choose from professional studio setups, lifestyle scenes, or creative environments that make your products stand out.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="size-6 text-violet-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-900">Automatic background removal</span>
                    <p className="text-slate-600">Remove backgrounds instantly with AI precision</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="size-6 text-violet-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-900">100+ preset environments</span>
                    <p className="text-slate-600">From minimalist studios to lifestyle settings</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="size-6 text-violet-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-900">Custom scene generation</span>
                    <p className="text-slate-600">Describe any scene and watch AI create it</p>
                  </div>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl overflow-hidden border-2 border-violet-200 shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"
                  alt="AI Background Generation"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-4 shadow-xl border-2 border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                    <Sparkles className="size-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Generation time</div>
                    <div className="text-2xl text-slate-900">2.3s</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Feature 2 - Video Generation */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative order-2 md:order-1"
            >
              <div className="aspect-square rounded-3xl overflow-hidden border-2 border-fuchsia-200 shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80"
                  alt="Video Generation"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-6 -left-6 bg-white rounded-2xl p-4 shadow-xl border-2 border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-gradient-to-br from-fuchsia-600 to-purple-600 flex items-center justify-center">
                    <Video className="size-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Video length</div>
                    <div className="text-2xl text-slate-900">5-30s</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6 order-1 md:order-2"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-100 text-fuchsia-700">
                <Video className="size-4" />
                <span className="text-sm">AI Video Generation</span>
              </div>
              <h3 className="text-4xl text-slate-900">
                Create engaging product videos automatically
              </h3>
              <p className="text-lg text-slate-600 leading-relaxed">
                Turn static product images into dynamic videos with smooth animations, 360° rotations, and professional transitions. Perfect for social media, ads, and product pages.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="size-6 text-fuchsia-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-900">360° product rotations</span>
                    <p className="text-slate-600">Showcase every angle with smooth spins</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="size-6 text-fuchsia-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-900">Motion graphics & effects</span>
                    <p className="text-slate-600">Add professional animations and transitions</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="size-6 text-fuchsia-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-900">Multiple aspect ratios</span>
                    <p className="text-slate-600">Optimized for Instagram, TikTok, YouTube, and more</p>
                  </div>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Feature 3 - Style Presets */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700">
                <Palette className="size-4" />
                <span className="text-sm">Smart Style Presets</span>
              </div>
              <h3 className="text-4xl text-slate-900">
                Professional styles at your fingertips
              </h3>
              <p className="text-lg text-slate-600 leading-relaxed">
                Choose from dozens of professionally crafted style presets designed specifically for e-commerce. Each preset is optimized for maximum conversion and visual appeal.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="size-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-900">Professional photography styles</span>
                    <p className="text-slate-600">Studio, lifestyle, minimal, and creative presets</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="size-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-900">Industry-specific templates</span>
                    <p className="text-slate-600">Fashion, tech, beauty, home goods, and more</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="size-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-900">Custom style creation</span>
                    <p className="text-slate-600">Save and reuse your own custom styles</p>
                  </div>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl overflow-hidden border-2 border-purple-200 shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"
                  alt="Style Presets"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-4 shadow-xl border-2 border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                    <Palette className="size-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Available styles</div>
                    <div className="text-2xl text-slate-900">100+</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How to Create Section */}
      <section className="py-32 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-6 bg-violet-50 text-violet-700 border-violet-200">
              Step-by-Step Guide
            </Badge>
            <h2 className="text-5xl md:text-6xl text-slate-900 mb-6">
              How to create images & videos
              <br />
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                for your products
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Follow this simple guide to transform your product photography and start creating professional visuals in minutes
            </p>
          </motion.div>

          {/* Step 1 */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-3">
                <div className="size-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white">
                  01
                </div>
                <h3 className="text-3xl text-slate-900">Upload Your Product</h3>
              </div>
              <p className="text-xl text-slate-600 leading-relaxed">
                Start by uploading a photo of your product. Don't worry about the background or lighting – our AI will handle that. You can upload images in any format (JPG, PNG, WEBP) and our system will automatically optimize them.
              </p>
              <div className="space-y-4 pl-2">
                <div className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="size-2 rounded-full bg-violet-600" />
                  </div>
                  <div>
                    <p className="text-slate-900">Take a clear photo of your product against any background</p>
                    <p className="text-sm text-slate-600">Use natural lighting or basic indoor lighting</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="size-2 rounded-full bg-violet-600" />
                  </div>
                  <div>
                    <p className="text-slate-900">Upload directly or drag & drop into the platform</p>
                    <p className="text-sm text-slate-600">Supports batch uploads for multiple products</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="size-2 rounded-full bg-violet-600" />
                  </div>
                  <div>
                    <p className="text-slate-900">AI automatically detects and isolates your product</p>
                    <p className="text-sm text-slate-600">Works with any product category</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-slate-200 p-8 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="size-20 rounded-2xl bg-white shadow-lg mx-auto flex items-center justify-center">
                    <Image className="size-10 text-violet-600" />
                  </div>
                  <p className="text-slate-600">Drag & drop your product image</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Step 2 */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative order-2 md:order-1"
            >
              <div className="aspect-[4/3] rounded-3xl overflow-hidden border-2 border-violet-200 shadow-xl">
                <img 
                  src="https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80"
                  alt="Choose settings"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6 order-1 md:order-2"
            >
              <div className="inline-flex items-center gap-3">
                <div className="size-12 rounded-xl bg-gradient-to-br from-fuchsia-600 to-purple-600 flex items-center justify-center text-white">
                  02
                </div>
                <h3 className="text-3xl text-slate-900">Choose Your Style & Settings</h3>
              </div>
              <p className="text-xl text-slate-600 leading-relaxed">
                Select from our library of professional styles or create your own. Customize every aspect – from background scenes to lighting, colors, and composition. Our intuitive interface makes it easy to get exactly the look you want.
              </p>
              <div className="space-y-4 pl-2">
                <div className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-fuchsia-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="size-2 rounded-full bg-fuchsia-600" />
                  </div>
                  <div>
                    <p className="text-slate-900">Pick a style: Professional, Lifestyle, Minimal, or Creative</p>
                    <p className="text-sm text-slate-600">Each style is optimized for e-commerce conversions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-fuchsia-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="size-2 rounded-full bg-fuchsia-600" />
                  </div>
                  <div>
                    <p className="text-slate-900">Customize background, lighting, and composition</p>
                    <p className="text-sm text-slate-600">Real-time preview as you adjust settings</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-fuchsia-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="size-2 rounded-full bg-fuchsia-600" />
                  </div>
                  <div>
                    <p className="text-slate-900">Select aspect ratio for your platform</p>
                    <p className="text-sm text-slate-600">Square, portrait, landscape, or custom dimensions</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Step 3 */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-3">
                <div className="size-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white">
                  03
                </div>
                <h3 className="text-3xl text-slate-900">Generate & Refine</h3>
              </div>
              <p className="text-xl text-slate-600 leading-relaxed">
                Click generate and watch the magic happen. Our AI creates your professional visual in seconds. Not satisfied? Adjust your settings and regenerate instantly. You can create unlimited variations until you get the perfect result.
              </p>
              <div className="space-y-4 pl-2">
                <div className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="size-2 rounded-full bg-purple-600" />
                  </div>
                  <div>
                    <p className="text-slate-900">AI generates your visual in 2-5 seconds</p>
                    <p className="text-sm text-slate-600">Lightning-fast processing with our advanced models</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="size-2 rounded-full bg-purple-600" />
                  </div>
                  <div>
                    <p className="text-slate-900">Preview and refine with one-click adjustments</p>
                    <p className="text-sm text-slate-600">Fine-tune colors, shadows, and details</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="size-2 rounded-full bg-purple-600" />
                  </div>
                  <div>
                    <p className="text-slate-900">Generate multiple variations instantly</p>
                    <p className="text-sm text-slate-600">Create A/B test options effortlessly</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-[4/3] rounded-3xl overflow-hidden border-2 border-purple-200 shadow-xl">
                <img 
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80"
                  alt="Generate result"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute top-4 right-4 bg-white rounded-xl p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-slate-900">Generating...</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Step 4 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative order-2 md:order-1"
            >
              <div className="aspect-[4/3] rounded-3xl overflow-hidden border-2 border-green-200 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 p-8 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="size-20 rounded-2xl bg-white shadow-lg mx-auto flex items-center justify-center">
                    <Download className="size-10 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-slate-900">Ready to download</p>
                    <div className="flex gap-2 justify-center">
                      <Badge variant="secondary">4K Quality</Badge>
                      <Badge variant="secondary">PNG/JPG</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6 order-1 md:order-2"
            >
              <div className="inline-flex items-center gap-3">
                <div className="size-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white">
                  04
                </div>
                <h3 className="text-3xl text-slate-900">Download & Use</h3>
              </div>
              <p className="text-xl text-slate-600 leading-relaxed">
                Download your professional visual in high resolution (up to 4K) and use it anywhere – on your website, social media, ads, or print materials. All downloads are royalty-free and ready for commercial use.
              </p>
              <div className="space-y-4 pl-2">
                <div className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="size-2 rounded-full bg-green-600" />
                  </div>
                  <div>
                    <p className="text-slate-900">Download in PNG, JPG, or WebP format</p>
                    <p className="text-sm text-slate-600">Choose the best format for your use case</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="size-2 rounded-full bg-green-600" />
                  </div>
                  <div>
                    <p className="text-slate-900">Resolution up to 4K for print quality</p>
                    <p className="text-sm text-slate-600">Perfect for large format printing and high-res displays</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="size-2 rounded-full bg-green-600" />
                  </div>
                  <div>
                    <p className="text-slate-900">Full commercial license included</p>
                    <p className="text-sm text-slate-600">Use on any platform without restrictions</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-soft-light filter blur-3xl opacity-10 animate-blob" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full mix-blend-soft-light filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
        </div>
        
        <div className="container mx-auto max-w-4xl text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-5xl md:text-7xl text-white leading-tight">
              Ready to create stunning visuals?
            </h2>
            <p className="text-2xl text-violet-100 max-w-2xl mx-auto">
              Join 50,000+ brands using AI to transform their product photography
            </p>
            <div className="pt-4">
              <Button 
                size="lg"
                className="gap-2 text-xl px-12 py-8 bg-white text-violet-600 hover:bg-slate-50 shadow-2xl"
                onClick={onGetStarted}
              >
                <Sparkles className="size-6" />
                Start Creating Free
                <ArrowRight className="size-6" />
              </Button>
            </div>
            <p className="text-violet-200">
              40 free credits · No credit card required · Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl blur-lg opacity-50" />
                <div className="relative bg-gradient-to-br from-violet-600 to-fuchsia-600 p-2.5 rounded-xl">
                  <Sparkles className="size-5 text-white" />
                </div>
              </div>
              <span className="text-white">E-Commerce AI Studio</span>
            </div>
            <p className="text-sm">
              © 2025 E-Commerce AI Studio. Crafted with AI ✨
            </p>
          </div>
        </div>
      </footer>

      {/* Add custom animations */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .bg-grid-white\/5 {
          background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        .bg-grid-white\/10 {
          background-image: linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
}