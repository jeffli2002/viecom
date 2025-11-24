'use client';

import { Link } from '@/i18n/navigation';
import { Mail, Twitter } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('nav');

  return (
    <footer className="bg-main pt-20 pb-10 border-t border-slate-200 dark:border-white/5 transition-colors duration-300">
      <div className="container-base">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center">
              <img
                src="/ViecomLogoV6.png"
                alt="Viecom Logo"
                style={{ height: '56px', width: '210px', objectFit: 'contain' }}
              />
            </div>
            <p className="text-body leading-relaxed">
              {t('footerDescription') || '为电商企业提供高质量的AI图片和视频生成服务'}
            </p>
            <div className="flex gap-4">
              <a
                href="https://x.com/jeffli2002"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-teal-500 hover:text-white transition-all"
                aria-label="X (Twitter)"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="mailto:support@viecom.pro"
                className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-teal-500 hover:text-white transition-all"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Tools */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-6">
              {t('footerProduct') || '产品'}
            </h4>
            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/image-generation" className="hover:text-teal-500 transition-colors">
                  {t('imageGeneration')}
                </Link>
              </li>
              <li>
                <Link href="/video-generation" className="hover:text-teal-500 transition-colors">
                  {t('videoGeneration')}
                </Link>
              </li>
              <li>
                <Link
                  href="/batch-image-generation"
                  className="hover:text-teal-500 transition-colors"
                >
                  {t('batchImageGeneration')}
                </Link>
              </li>
              <li>
                <Link
                  href="/batch-video-generation"
                  className="hover:text-teal-500 transition-colors"
                >
                  {t('batchVideoGeneration')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Learn */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-6">
              Learn
            </h4>
            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/image-to-video-ai" className="hover:text-teal-500 transition-colors">
                  Image to Video AI
                </Link>
              </li>
              <li>
                <Link href="/ai-video-generator-free" className="hover:text-teal-500 transition-colors">
                  Free AI Video Generator
                </Link>
              </li>
              <li>
                <Link href="/video-enhancer-ai" className="hover:text-teal-500 transition-colors">
                  Video Enhancer
                </Link>
              </li>
              <li>
                <Link href="/assets" className="hover:text-teal-500 transition-colors">
                  {t('assets')}
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-teal-500 transition-colors">
                  {t('footerDocs') || '文档'}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-teal-500 transition-colors">
                  {t('footerPricing') || '定价'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-6">
              {t('footerCompany') || '公司'}
            </h4>
            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/about" className="hover:text-teal-500 transition-colors">
                  {t('footerAbout') || '关于我们'}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-teal-500 transition-colors">
                  {t('footerContact') || '联系我们'}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-teal-500 transition-colors">
                  {t('footerPrivacy') || '隐私政策'}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-teal-500 transition-colors">
                  {t('footerTerms') || '服务条款'}
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-teal-500 transition-colors">
                  {t('footerRefund') || '退款政策'}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500 dark:text-slate-500">
          <p>© {new Date().getFullYear()} Viecom. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
