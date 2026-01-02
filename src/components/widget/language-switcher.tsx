'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales } from '@/i18n/routing';
import { Globe } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLanguageChange = (newLocale: string) => {
    if (!mounted || typeof window === 'undefined') return;
    try {
      // usePathname from @/i18n/navigation already returns pathname without locale
      // useRouter.push() from @/i18n/navigation automatically handles locale prefix
      router.push(pathname || '/', { locale: newLocale });
    } catch (error) {
      // Fallback to window.location if router fails
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const pathWithoutLocale = currentPath.replace(/^\/[^/]+/, '') || '/';
        window.location.href = `/${newLocale}${pathWithoutLocale}`;
      }
    }
  };

  return (
    <div suppressHydrationWarning>
      <Select value={locale} onValueChange={handleLanguageChange}>
        <SelectTrigger className="language-switcher-trigger" aria-label="Select language">
          <Globe className="mr-2 h-4 w-4" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="language-switcher-content">
          {locales.map((loc) => (
            <SelectItem key={loc.locale} value={loc.locale} className="language-switcher-item">
              {loc.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
