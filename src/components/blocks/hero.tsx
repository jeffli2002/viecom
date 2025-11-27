'use client';

import { Link } from '@/i18n/navigation';
import { useIsAuthenticated } from '@/store/auth-store';
import { Play, Sparkles, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

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
];

export function Hero() {
  const t = useTranslations('hero');
  const isAuthenticated = useIsAuthenticated();
  const [textColor, setTextColor] = useState('rgb(15 23 42)'); // Light mode default
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const headingFontSize = '5rem';

  // Determine the link based on authentication status
  const ctaHref = isAuthenticated
    ? '/image-generation'
    : `/signup?callbackUrl=${encodeURIComponent('/image-generation')}`;

  const updateHeadingColor = useCallback(() => {
    const htmlElement = document.documentElement;
    const hasDarkClass = htmlElement.classList.contains('dark');
    const hasDarkTheme = htmlElement.getAttribute('data-theme') === 'dark';
    const isDarkMode = hasDarkClass || hasDarkTheme;
    const nextColor = isDarkMode ? 'rgb(255 255 255)' : 'rgb(15 23 42)';

    setTextColor((prev) => (prev === nextColor ? prev : nextColor));
  }, []);

  // Initialize color based on dark mode before paint
  useLayoutEffect(() => {
    updateHeadingColor();
  }, [updateHeadingColor]);

  // React to theme toggles by observing the html element
  useEffect(() => {
    updateHeadingColor();

    const observer = new MutationObserver(() => {
      updateHeadingColor();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });

    return () => observer.disconnect();
  }, [updateHeadingColor]);

  // Clean up any legacy color classes once on mount
  useEffect(() => {
    if (!h1Ref.current) return;
    const colorAffectingClasses = [
      'text-white',
      'text-slate-900',
      'text-slate-50',
      'text-slate-100',
      'text-slate-800',
      'text-slate-700',
      'text-gray-900',
      'text-gray-50',
      'dark:text-white',
      'dark:text-slate-900',
    ];
    colorAffectingClasses.forEach((cls) => h1Ref.current?.classList.remove(cls));
  }, []);

  return (
    <header className="relative pt-32 pb-20 overflow-hidden bg-main border-b border-slate-200 dark:border-white/5">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=2000')] opacity-5 dark:opacity-10 bg-cover bg-center mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/90 to-white dark:via-slate-900/90 dark:to-slate-900" />
      </div>

      <div className="container-base relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-500 dark:text-teal-400 mb-8 backdrop-blur-sm">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">{t('badge')}</span>
        </div>

        <h1
          ref={h1Ref}
          style={{
            fontSize: headingFontSize,
            letterSpacing: '-0.025em',
            lineHeight: '1.25',
            fontWeight: 600,
            color: textColor,
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontFamily: 'inherit',
          }}
        >
          {t('titleLine1')} <br />
          <span className="text-gradient">{t('titleLine2')}</span>
        </h1>

        <p className="text-xl text-body mb-10 max-w-2xl mx-auto leading-relaxed">{t('subtitle')}</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Link href={ctaHref} className="btn-primary">
            <Zap className="w-5 h-5" />
            {t('ctaStart')}
          </Link>
          <a
            href="#video-sample"
            className="px-8 py-4 bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/20 text-slate-900 dark:text-white font-medium rounded-xl backdrop-blur-md border border-slate-200 dark:border-white/10 transition-all flex items-center gap-2 shadow-sm dark:shadow-none"
          >
            <Play className="w-5 h-5 fill-current" />
            {t('watchDemo')}
          </a>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-white/10">
          <p className="text-slate-500 text-sm font-medium mb-6 uppercase tracking-widest">
            {t('trustedBy')}
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-60">
            {PLATFORMS.map((platform) => (
              <div key={platform.name} className="group relative">
                <img
                  src={platform.logo}
                  alt={platform.name}
                  className="h-8 md:h-10 w-auto object-contain dark:brightness-0 dark:invert transition-all duration-300 opacity-60 group-hover:opacity-100 filter grayscale hover:grayscale-0"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
