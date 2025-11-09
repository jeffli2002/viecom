'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Palette, Sparkles, Video, Wand2 } from 'lucide-react';
import { motion } from 'motion/react';

export function LandingFeatures() {
  return (
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
            Our AI-powered platform combines cutting-edge technology with intuitive design to help
            you create professional product images and videos in minutes, not days.
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
              Simply upload your product photo and let our AI create stunning, contextual
              backgrounds. Choose from professional studio setups, lifestyle scenes, or creative
              environments that make your products stand out.
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
            <div className="aspect-square rounded-3xl overflow-hidden border-2 border-violet-200 shadow-2xl group card-image-container">
              <img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"
                alt="AI Background Generation"
                className="w-full h-full object-cover transition-transform duration-300"
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
            <div className="aspect-square rounded-3xl overflow-hidden border-2 border-fuchsia-200 shadow-2xl group card-image-container">
              <img
                src="https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80"
                alt="Video Generation"
                className="w-full h-full object-cover transition-transform duration-300"
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
              Turn static product images into dynamic videos with smooth animations, 360° rotations,
              and professional transitions. Perfect for social media, ads, and product pages.
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
                  <p className="text-slate-600">
                    Optimized for Instagram, TikTok, YouTube, and more
                  </p>
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
            <h3 className="text-4xl text-slate-900">Professional styles at your fingertips</h3>
            <p className="text-lg text-slate-600 leading-relaxed">
              Choose from dozens of professionally crafted style presets designed specifically for
              e-commerce. Each preset is optimized for maximum conversion and visual appeal.
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
            <div className="aspect-square rounded-3xl overflow-hidden border-2 border-purple-200 shadow-2xl group card-image-container">
              <img
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"
                alt="Style Presets"
                className="w-full h-full object-cover transition-transform duration-300"
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
  );
}
