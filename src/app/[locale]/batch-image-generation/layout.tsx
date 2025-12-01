import { getSEOMetadata } from '@/lib/seo/metadata-translations';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return getSEOMetadata(locale, 'tool', '/batch-image-generation');
}

export default function BatchImageGenerationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
