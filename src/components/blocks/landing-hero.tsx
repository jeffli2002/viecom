'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/store/auth-store';
import { ArrowRight, CheckCircle2, Image as ImageIcon, Play, Sparkles, Video } from 'lucide-react';
import { motion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export function LandingHero() {
  const t = useTranslations('hero');
  const locale = useLocale();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-white">
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
              {t('trustedBy')}
            </Badge>
          </motion.div>

          <motion.h1
            className="text-slate-900 tracking-tight leading-[1.15]"
            style={{ fontSize: 'clamp(2.25rem, 6vw, 4.5rem)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span>
              {locale === 'en' ? (
                <>
                  AI-Powered Visuals, Designed for{' '}
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
                      E-Commerce Brands
                    </span>
                    <motion.div
                      className="absolute bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-violet-200 to-fuchsia-200 -z-0"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.8, duration: 0.6 }}
                    />
                  </span>
                </>
              ) : (
                <>
                  AI助力你的
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
                      电商品牌
                    </span>
                    <motion.div
                      className="absolute bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-violet-200 to-fuchsia-200 -z-0"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.8, duration: 0.6 }}
                    />
                  </span>
                  和销售
                </>
              )}
            </span>
          </motion.h1>

          <motion.p
            className="text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed mt-6 md:text-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {t('description')}
          </motion.p>

          <motion.p
            className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed mt-3 md:text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {t('descriptionSub')}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {!mounted || !isAuthenticated ? (
              // Show default state during SSR to prevent hydration mismatch
              <>
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="gap-2 text-lg px-8 py-7 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-xl shadow-violet-500/25"
                  >
                    <Sparkles className="size-5" />
                    {t('ctaStart')}
                  </Button>
                </Link>
                <Link href="/video-generation">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-7 border-2 gap-2">
                    <Play className="size-5" />
                    {t('watchDemo')}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/image-generation">
                  <Button
                    size="lg"
                    className="gap-2 text-lg px-8 py-7 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-xl shadow-violet-500/25"
                  >
                    <Sparkles className="size-5" />
                    {t('ctaStart')}
                  </Button>
                </Link>
                <Link href="/video-generation">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-7 border-2 gap-2">
                    <Play className="size-5" />
                    {t('watchDemo')}
                  </Button>
                </Link>
              </>
            )}
          </motion.div>

          <motion.div
            className="flex items-center justify-center gap-8 text-sm text-slate-500 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-green-600" />
              {t('noCreditCard')}
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-green-600" />
              {t('freeCredits')}
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-green-600" />
              {t('cancelAnytime')}
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
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 relative group card-image-container">
              <img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80"
                alt="Product 1"
                className="w-full h-full object-cover transition-transform duration-300"
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
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-violet-100 to-fuchsia-100 relative group card-image-container">
              <img
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"
                alt="Product 2"
                className="w-full h-full object-cover transition-transform duration-300"
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
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 relative group card-image-container">
              <img
                src="https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80"
                alt="Product 3"
                className="w-full h-full object-cover transition-transform duration-300"
              />
              <div className="absolute bottom-4 left-4">
                <Badge className="bg-white/90 backdrop-blur-sm gap-1">
                  <ImageIcon className="size-3" />
                  Lifestyle
                </Badge>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
