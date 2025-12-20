import { Link } from '@/i18n/navigation';
import { Mail, Twitter } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export async function Footer() {
  const t = await getTranslations('nav');

  return (
    <footer className="bg-main pt-20 pb-10 border-t border-slate-200 dark:border-white/5 transition-colors duration-300">
      <div className="container-base">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
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
            <h3 className="font-bold text-slate-900 dark:text-white mb-6">{t('footerProduct')}</h3>
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
            <h3 className="font-bold text-slate-900 dark:text-white mb-6">{t('footerLearn')}</h3>
            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/docs" className="hover:text-teal-500 transition-colors">
                  {t('footerDocs')}
                </Link>
              </li>
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
                <Link href="/models/nano-banana" className="hover:text-teal-500 transition-colors">
                  {t('nanoBananaPro')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-6">{t('solutions')}</h3>
            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/solutions/amazon" className="hover:text-teal-500 transition-colors">
                  {t('amazonSolutions')}
                </Link>
              </li>
              <li>
                <Link href="/solutions/tiktok" className="hover:text-teal-500 transition-colors">
                  {t('tiktokSolutions')}
                </Link>
              </li>
              <li>
                <Link href="/solutions/shopify" className="hover:text-teal-500 transition-colors">
                  {t('shopifySolutions')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-6">{t('footerCompany')}</h3>
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
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <p>© {new Date().getFullYear()} Viecom. All rights reserved.</p>
          </div>
          <div className="pt-4 border-t border-slate-200 dark:border-white/5">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('independenceDisclaimer')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
