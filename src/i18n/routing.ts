import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'zh'],
  defaultLocale: 'en',
  localePrefix: 'as-needed', // Don't show locale prefix for default locale
  localeDetection: true, // Auto-detect locale from browser
  pathnames: {
    // Explicitly exclude admin routes from i18n
  } as const,
});

export const locales = [
  { name: 'English', locale: 'en' },
  { name: '中文', locale: 'zh' },
];
