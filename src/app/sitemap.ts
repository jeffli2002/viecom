import type { MetadataRoute } from 'next';
import { getMetadataBase } from '@/lib/seo/metadata';
import { locales, routing } from '@/i18n/routing';

const PUBLIC_PATHS: string[] = [
  '/',
  '/about',
  '/pricing',
  '/docs',
  '/contact',
  '/terms',
  '/privacy',
  '/refund',
  '/assets',
  '/brand-analysis',
  '/image-generation',
  '/video-generation',
  '/batch-generation',
  '/batch-image-generation',
  '/batch-video-generation',
  '/dashboard',
  '/reset-password',
  '/login',
  '/signup',
];

const defaultLocale = (routing as { defaultLocale?: string }).defaultLocale ?? 'en';

const localeCodes = locales.map((locale) => locale.locale);

const lastModified = new Date();

function buildLocalizedPaths(path: string): string[] {
  const normalizedPath = path === '/' ? '' : path;
  const defaultPath = normalizedPath || '/';
  const localizedPaths = [defaultPath];

  for (const locale of localeCodes) {
    if (locale === defaultLocale) continue;
    const prefix = locale ? `/${locale}` : '';
    localizedPaths.push(
      normalizedPath ? `${prefix}${normalizedPath}` : `${prefix || '/'}`
    );
  }

  return localizedPaths;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getMetadataBase();
  const baseUrl = base.toString().replace(/\/$/, '');

  return PUBLIC_PATHS.flatMap((path) =>
    buildLocalizedPaths(path).map((fullPath) => ({
      url: `${baseUrl}${fullPath}`,
      lastModified,
    }))
  );
}


