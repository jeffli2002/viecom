'use client';

import { usePathname, useRouter } from '@/i18n/navigation';
import { locales } from '@/i18n/routing';
import { Globe } from 'lucide-react';
import { useLocale } from 'next-intl';

export function LanguageSwitcherNative() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
      <Globe className="w-4 h-4" />
      <select
        value={locale}
        onChange={(e) => router.push(pathname, { locale: e.target.value })}
        className="h-9 rounded-md border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/40 px-2 text-sm"
        aria-label="Language"
      >
        {locales.map((loc) => (
          <option key={loc.locale} value={loc.locale}>
            {loc.name}
          </option>
        ))}
      </select>
    </label>
  );
}
