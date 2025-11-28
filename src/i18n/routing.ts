import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'zh'],
  defaultLocale: 'en',
  localePrefix: 'always', // Always show locale prefix
  localeDetection: true, // Auto-detect locale from browser
});

export const locales = [
  { name: 'English', locale: 'en' },
  { name: '中文', locale: 'zh' },
];
