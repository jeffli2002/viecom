import { buildLocaleCanonicalMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import AssetsPageClient from './assets-client';

export const dynamic = 'force-dynamic';

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  const { locale } = params;
  return buildLocaleCanonicalMetadata(locale, '/assets');
}

export default function AssetsPage() {
  return <AssetsPageClient />;
}
