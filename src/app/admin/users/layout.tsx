import { buildCanonicalMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export function generateMetadata(): Metadata {
  return buildCanonicalMetadata('/admin/users');
}

export default function AdminUsersLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
