import { buildCanonicalMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export function generateMetadata(): Metadata {
  return buildCanonicalMetadata('/admin/credits');
}

export default function AdminCreditsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
