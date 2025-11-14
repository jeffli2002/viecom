import { buildCanonicalMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export function generateMetadata(): Metadata {
  return buildCanonicalMetadata('/admin/settings');
}

export default function AdminSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
