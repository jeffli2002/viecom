import { locales, routing } from '@/i18n/routing';
import { getMetadataBase } from '@/lib/seo/metadata';
import type { MetadataRoute } from 'next';

// Public pages that should be indexed
const PUBLIC_PATHS: Array<{
  path: string;
  priority: number;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}> = [
  // Homepage
  { path: '/', priority: 1.0, changeFrequency: 'daily' },

  // Main generation tools
  { path: '/image-generation', priority: 0.9, changeFrequency: 'daily' },
  { path: '/video-generation', priority: 0.9, changeFrequency: 'daily' },
  { path: '/batch-generation', priority: 0.9, changeFrequency: 'daily' },
  { path: '/batch-image-generation', priority: 0.9, changeFrequency: 'daily' },
  { path: '/batch-video-generation', priority: 0.9, changeFrequency: 'daily' },
  { path: '/brand-analysis', priority: 0.8, changeFrequency: 'weekly' },

  // Feature pages
  { path: '/image-to-video-ai', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/ai-video-generator-free', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/video-enhancer-ai', priority: 0.8, changeFrequency: 'weekly' },

  // Resources
  { path: '/assets', priority: 0.8, changeFrequency: 'daily' },
  { path: '/docs', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/pricing', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/showcase', priority: 0.8, changeFrequency: 'daily' },

  // Company pages
  { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },

  // Legal pages
  { path: '/terms', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/refund', priority: 0.5, changeFrequency: 'yearly' },

  // Auth pages
  { path: '/signup', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/login', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/reset-password', priority: 0.3, changeFrequency: 'monthly' },

  // User pages (publicly accessible but lower priority)
  { path: '/dashboard', priority: 0.6, changeFrequency: 'daily' },
];

const defaultLocale = routing.defaultLocale;
const lastModified = new Date();

/**
 * Build path with default locale prefix only.
 *
 * IMPORTANT: To avoid duplicate content issues in sitemap.xml, we only include
 * the default locale (English) URLs. Other language versions are still accessible
 * and will be discovered through:
 * 1. Internal links on the site
 * 2. Hreflang tags in page metadata (if implemented)
 * 3. User navigation
 *
 * This follows SEO best practices for multi-language sites:
 * - Include only canonical/default language URLs in sitemap
 * - Use hreflang tags in HTML to indicate alternate language versions
 * - Avoid duplicate content penalties
 */
function buildDefaultLocalePath(path: string): string {
  const normalizedPath = path === '/' ? '' : path;
  const prefix = `/${defaultLocale}`;
  return normalizedPath ? `${prefix}${normalizedPath}` : prefix;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getMetadataBase();
  const baseUrl = base.toString().replace(/\/$/, '');

  return PUBLIC_PATHS.map(({ path, priority, changeFrequency }) => {
    const fullPath = buildDefaultLocalePath(path);
    return {
      url: `${baseUrl}${fullPath}`,
      lastModified,
      changeFrequency,
      priority,
    };
  });
}
