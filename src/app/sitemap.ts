import { locales, routing } from '@/i18n/routing';
import { getMetadataBase } from '@/lib/seo/metadata';
import type { MetadataRoute } from 'next';

// Public pages that should be indexed
const PUBLIC_PATHS: Array<{
  path: string;
  priority: number;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}> = [
  { path: '/', priority: 1.0, changeFrequency: 'daily' },
  { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/pricing', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/docs', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/terms', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/refund', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/assets', priority: 0.8, changeFrequency: 'daily' },
  { path: '/brand-analysis', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/image-generation', priority: 0.9, changeFrequency: 'daily' },
  { path: '/video-generation', priority: 0.9, changeFrequency: 'daily' },
  { path: '/image-to-video-ai', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/ai-video-generator-free', priority: 0.95, changeFrequency: 'weekly' },
  { path: '/video-enhancer-ai', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/batch-generation', priority: 0.9, changeFrequency: 'daily' },
  { path: '/batch-image-generation', priority: 0.9, changeFrequency: 'daily' },
  { path: '/batch-video-generation', priority: 0.9, changeFrequency: 'daily' },
  { path: '/dashboard', priority: 0.7, changeFrequency: 'daily' },
  { path: '/reset-password', priority: 0.3, changeFrequency: 'monthly' },
  { path: '/login', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/signup', priority: 0.8, changeFrequency: 'monthly' },
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
    localizedPaths.push(normalizedPath ? `${prefix}${normalizedPath}` : `${prefix || '/'}`);
  }

  return localizedPaths;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getMetadataBase();
  const baseUrl = base.toString().replace(/\/$/, '');

  return PUBLIC_PATHS.flatMap(({ path, priority, changeFrequency }) =>
    buildLocalizedPaths(path).map((fullPath) => ({
      url: `${baseUrl}${fullPath}`,
      lastModified,
      changeFrequency,
      priority,
    }))
  );
}
