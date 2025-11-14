import { buildCanonicalMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export function generateMetadata(): Metadata {
  return buildCanonicalMetadata('/admin/login');
}

export default function AdminLoginLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Login page should not have sidebar or topbar
  return <>{children}</>;
}
