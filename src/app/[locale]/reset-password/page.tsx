import { buildLocaleCanonicalMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import ResetPasswordClientPage from './reset-password-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLocaleCanonicalMetadata(locale, '/reset-password');
}

export default function ResetPasswordPage() {
  return <ResetPasswordClientPage />;
}
