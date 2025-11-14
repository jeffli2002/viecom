import { buildCanonicalMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export function generateMetadata(): Metadata {
  return buildCanonicalMetadata('/admin/payments');
}

export default function AdminPaymentsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
