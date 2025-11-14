import { buildCanonicalMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export function generateMetadata(): Metadata {
  return buildCanonicalMetadata('/admin/subscriptions');
}

export default function AdminSubscriptionsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
