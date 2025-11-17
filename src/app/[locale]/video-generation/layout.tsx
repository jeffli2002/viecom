import { buildLocaleCanonicalMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLocaleCanonicalMetadata(locale, '/video-generation');
}

export default function VideoGenerationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
