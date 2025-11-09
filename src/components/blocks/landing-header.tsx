'use client';

import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/widget/language-switcher';
import { useAuthStore } from '@/store/auth-store';
import { ArrowRight, Menu, Sparkles, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useEffect, useState } from 'react';

export function LandingHeader() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch - only render auth-dependent content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between relative">
          <motion.div
            className="flex items-center gap-3 relative z-10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link href="/" className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl blur-lg opacity-50" />
                <div className="relative bg-gradient-to-br from-violet-600 to-fuchsia-600 p-2.5 rounded-xl">
                  <Sparkles className="size-5 text-white" />
                </div>
              </div>
              <span className="text-slate-900 font-semibold">Viecom</span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4 relative z-10">
            <Link
              href="/image-generation"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer relative z-10"
              prefetch={true}
            >
              {t('imageGeneration') || '图片生成'}
            </Link>
            <Link
              href="/video-generation"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer relative z-10"
              prefetch={true}
            >
              {t('videoGeneration') || '视频生成'}
            </Link>
            <Link
              href="/batch-image-generation"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer relative z-10"
              prefetch={true}
            >
              批量生图
            </Link>
            <Link
              href="/batch-video-generation"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer relative z-10"
              prefetch={true}
            >
              批量生视频
            </Link>
            <Link
              href="/assets"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer relative z-10"
              prefetch={true}
            >
              {t('assets') || '资产库'}
            </Link>
          </nav>

          <motion.div
            className="flex items-center gap-3 relative z-10"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <LanguageSwitcher />
            {!mounted ? (
              // Show default state during SSR to prevent hydration mismatch
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                    {t('login')}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/25">
                    {t('getStarted')}
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                </Link>
              </>
            ) : isAuthenticated ? (
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/25">
                  {t('dashboard')}
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                    {t('login')}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/25">
                    {t('getStarted')}
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </motion.div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            className="border-t md:hidden mt-4 pt-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex flex-col space-y-2">
              <Link
                href="/image-generation"
                className="px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('imageGeneration') || '图片生成'}
              </Link>
              <Link
                href="/video-generation"
                className="px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('videoGeneration') || '视频生成'}
              </Link>
              <Link
                href="/batch-image-generation"
                className="px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                批量生图
              </Link>
              <Link
                href="/batch-video-generation"
                className="px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                批量生视频
              </Link>
              <Link
                href="/assets"
                className="px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('assets') || '资产库'}
              </Link>
              {!isAuthenticated && (
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('login') || '登录'}
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
