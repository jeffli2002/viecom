import { buildLocaleCanonicalMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  const { locale } = params;
  return buildLocaleCanonicalMetadata(locale, '/batch-image-generation');
}

export default function BatchImageGenerationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
