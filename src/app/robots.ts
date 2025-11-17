import { getMetadataBase } from '@/lib/seo/metadata';
import type { MetadataRoute } from 'next';

const DISALLOWED_PATHS = ['/admin', '/api/admin', '/api/creem', '/api/rewards'];

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
    ],
    sitemap: [`${baseUrl}/sitemap.xml`],
  };
}
