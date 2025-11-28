import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'zh', 'es', 'fr', 'de', 'ja'],
  defaultLocale: 'en',
  localePrefix: 'always', // Always show locale prefix
  localeDetection: true, // Auto-detect locale from browser
});

export const locales = [
  { name: 'English', locale: 'en' },
  { name: '中文', locale: 'zh' },
  { name: 'Español', locale: 'es' },
  { name: 'Français', locale: 'fr' },
  { name: 'Deutsch', locale: 'de' },
  { name: '日本語', locale: 'ja' },
];
