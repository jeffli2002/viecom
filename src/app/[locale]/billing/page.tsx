import { redirect } from 'next/navigation';

export default function BillingRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/settings/billing`);
}

