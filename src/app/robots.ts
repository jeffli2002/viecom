import { getMetadataBase } from '@/lib/seo/metadata';
import type { MetadataRoute } from 'next';

/**
 * Paths that should not be indexed by search engines.
 *
 * IMPORTANT: With localePrefix: 'always', user-facing pages are under /en/ and /zh/
 * API and admin routes are NOT localized and remain at root level.
 */
const DISALLOWED_PATHS = [
  // Admin panel (no locale prefix)
  '/admin',
  '/admin/*',

  // API routes (no locale prefix)
  '/api',
  '/api/*',

  // Private user pages (localized)
  '/*/settings',
  '/*/settings/*',
  '/*/billing',

  // Auth pages (publicly accessible but no SEO value)
  '/*/reset-password',
];

export default function robots(): MetadataRoute.Robots {
  const base = getMetadataBase();
  const baseUrl = base.toString().replace(/\/$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      // Allow Googlebot to access public pages for better indexing
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/api',
          '/api/*',
          '/*/settings',
          '/*/settings/*',
          '/*/billing',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
