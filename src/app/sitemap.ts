import { routing } from '@/i18n/routing';
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

  // Learn Pages (Educational/Guide content)
  { path: '/docs', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/image-to-video-ai', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/ai-video-generator-free', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/video-enhancer-ai', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/models/nano-banana', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/enhancing-product-photos', priority: 0.8, changeFrequency: 'monthly' },

  // Solution Pages (Platform-specific optimization)
  { path: '/solutions/amazon', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/solutions/tiktok', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/solutions/shopify', priority: 0.9, changeFrequency: 'weekly' },

  // Resources (public tools; showcase temporarily excluded from sitemap)
  { path: '/assets', priority: 0.8, changeFrequency: 'daily' },
  { path: '/pricing', priority: 0.9, changeFrequency: 'weekly' },

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

const lastModified = new Date();

/**
 * Build path with a locale prefix.
 */
function buildLocalePath(locale: string, path: string): string {
  const normalizedPath = path === '/' ? '' : path;
  const prefix = `/${locale}`;
  return normalizedPath ? `${prefix}${normalizedPath}` : prefix;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getMetadataBase();
  const baseUrl = base.toString().replace(/\/$/, '');

  return PUBLIC_PATHS.flatMap(({ path, priority, changeFrequency }) => {
    return routing.locales.map((locale) => {
      const fullPath = buildLocalePath(locale, path);
      return {
        url: `${baseUrl}${fullPath}`,
        lastModified,
        changeFrequency,
        priority,
      };
    });
  });
}
