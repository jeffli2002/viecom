import { HeaderAuthControls } from '@/components/layout/header-auth-controls';
import { Deferred } from '@/components/performance/deferred';
import { LanguageSwitcherNative } from '@/components/widget/language-switcher-native';
import { ThemeToggle } from '@/components/widget/theme-toggle';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';

const NAV_LINKS = [
  { href: '/', key: 'home' },
  { href: '/image-generation', key: 'imageGeneration' },
  { href: '/video-generation', key: 'videoGeneration' },
  { href: '/pricing', key: 'pricing' },
  { href: '/docs', key: 'documentation' },
] as const;

export async function Header() {
  const t = await getTranslations('nav');

  return (
    <header className="sticky top-0 z-50 bg-main/80 backdrop-blur border-b border-slate-200 dark:border-white/5">
      <div className="container-base h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/ViecomLogoV6.png"
            alt="Viecom"
            width={140}
            height={38}
            className="h-8 w-auto"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Deferred>
            <ThemeToggle />
          </Deferred>
          <Deferred timeoutMs={1400}>
            <LanguageSwitcherNative />
          </Deferred>
          <Deferred timeoutMs={1600}>
            <HeaderAuthControls />
          </Deferred>
        </div>

        <details className="md:hidden">
          <summary className="list-none cursor-pointer p-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/40">
            <span className="sr-only">Menu</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Open menu"
              className="text-slate-700 dark:text-slate-200"
            >
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </summary>
          <div className="absolute left-0 right-0 top-16 bg-main border-b border-slate-200 dark:border-white/5">
            <div className="container-base py-4 flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="py-2 text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                >
                  {t(link.key)}
                </Link>
              ))}
              <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                <Deferred>
                  <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <LanguageSwitcherNative />
                  </div>
                </Deferred>
                <Deferred timeoutMs={1600}>
                  <HeaderAuthControls />
                </Deferred>
              </div>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
