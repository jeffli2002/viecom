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
            <p className="text-body leading-relaxed">{t('footerDescription')}</p>
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
            <h4 className="font-bold text-slate-900 dark:text-white mb-6">{t('footerProduct')}</h4>
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
              <li>
                <Link href="/brand-analysis" className="hover:text-teal-500 transition-colors">
                  {t('brandAnalysis')}
                </Link>
              </li>
              <li>
                <Link href="/assets" className="hover:text-teal-500 transition-colors">
                  {t('assets')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Learn */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-6">{t('footerLearn')}</h4>
            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/image-to-video-ai" className="hover:text-teal-500 transition-colors">
                  {t('imageToVideoAI')}
                </Link>
              </li>
              <li>
                <Link
                  href="/ai-video-generator-free"
                  className="hover:text-teal-500 transition-colors"
                >
                  {t('freeAIVideoGenerator')}
                </Link>
              </li>
              <li>
                <Link href="/video-enhancer-ai" className="hover:text-teal-500 transition-colors">
                  {t('videoEnhancer')}
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-teal-500 transition-colors">
                  {t('footerDocs')}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-teal-500 transition-colors">
                  {t('footerPricing')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-6">{t('footerCompany')}</h4>
            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/about" className="hover:text-teal-500 transition-colors">
                  {t('footerAbout')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-teal-500 transition-colors">
                  {t('footerContact')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-teal-500 transition-colors">
                  {t('footerPrivacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-teal-500 transition-colors">
                  {t('footerTerms')}
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-teal-500 transition-colors">
                  {t('footerRefund')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-white/5 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500 dark:text-slate-500">
            <p>© {new Date().getFullYear()} Viecom. All rights reserved.</p>
            <a
              href="https://www.producthunt.com/products/ai-image-and-video-generator?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-viecom&#0045;offcial&#0045;launch"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
              aria-label="Viecom on Product Hunt"
            >
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1043550&theme=neutral&t=1764334824681"
                alt="Viecom&#0032;offcial&#0032;launch - &#0032;AI&#0045;powered&#0032;image&#0032;&#0038;&#0032;video&#0032;generation&#0032;for&#0032;e&#0045;commerce&#0032;sellers&#0046; | Product Hunt"
                style={{ width: '250px', height: '54px' }}
                width="250"
                height="54"
                className="transition-opacity hover:opacity-80"
              />
            </a>
          </div>
          <div className="pt-4 border-t border-slate-200 dark:border-white/5">
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              {t('independenceDisclaimer')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
