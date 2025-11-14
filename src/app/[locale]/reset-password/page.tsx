import { buildLocaleCanonicalMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import ResetPasswordClientPage from './reset-password-client';

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  const { locale } = params;
  return buildLocaleCanonicalMetadata(locale, '/reset-password');
}

export default function ResetPasswordPage() {
  return <ResetPasswordClientPage />;
}
