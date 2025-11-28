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

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: string) => {
    // usePathname from @/i18n/navigation already returns pathname without locale
    // useRouter.push() from @/i18n/navigation automatically handles locale prefix
    router.push(pathname, { locale: newLocale });
  };

  return (
    <div suppressHydrationWarning>
      <Select value={locale} onValueChange={handleLanguageChange}>
        <SelectTrigger className="language-switcher-trigger">
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
