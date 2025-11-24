'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export function LandingFooter() {
  const t = useTranslations('nav');

  return (
    <footer className="border-t border-slate-200 dark:border-slate-700/50 bg-white dark:border-gray-800/50 dark:bg-slate-50 dark:bg-slate-900">
      <div className="container py-16 md:py-20">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center">
              <img
                src="/brandlogo5transb.png"
                alt="Viecom Logo"
                style={{ height: '56px', width: '210px', objectFit: 'contain' }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('footerDescription') || '为电商企业提供高质量的AI图片和视频生成服务'}
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">{t('footerProduct') || '产品'}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/image-generation" className="text-muted-foreground hover:text-primary">
                  {t('imageGeneration')}
                </Link>
              </li>
              <li>
                <Link href="/video-generation" className="text-muted-foreground hover:text-primary">
                  {t('videoGeneration')}
                </Link>
              </li>
              <li>
                <Link
                  href="/batch-image-generation"
                  className="text-muted-foreground hover:text-primary"
                >
                  {t('batchImageGeneration')}
                </Link>
              </li>
              <li>
                <Link
                  href="/batch-video-generation"
                  className="text-muted-foreground hover:text-primary"
                >
                  {t('batchVideoGeneration')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">{t('footerResources') || '资源'}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/assets" className="text-muted-foreground hover:text-primary">
                  {t('assets')}
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-muted-foreground hover:text-primary">
                  {t('footerDocs') || '文档'}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-primary">
                  {t('footerPricing') || '定价'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">{t('footerCompany') || '公司'}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary">
                  {t('footerAbout') || '关于我们'}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary">
                  {t('footerContact') || '联系我们'}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary">
                  {t('footerPrivacy') || '隐私政策'}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary">
                  {t('footerTerms') || '服务条款'}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Viecom. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
