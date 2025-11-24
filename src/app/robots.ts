import { getMetadataBase } from '@/lib/seo/metadata';
import type { MetadataRoute } from 'next';

// Paths that should not be indexed by search engines
const DISALLOWED_PATHS = [
  '/admin',
  '/api',
  '/api/admin',
  '/api/creem',
  '/api/rewards',
  '/api/v1/generate-image',
  '/api/v1/generate-video',
  '/api/v1/videos',
  '/api/v1/showcase',
  '/api/v1/media',
  '/api/auth',
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
      // Allow Googlebot to access more pages for better indexing
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
