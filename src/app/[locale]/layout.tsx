import '@/styles/globals.css';
import { MainLayout } from '@/components/layout/main-layout';
import { Toaster } from '@/components/ui/sonner';
import { routing } from '@/i18n/routing';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  const themeScript = `
    (function() {
      try {
        var t = localStorage.getItem('theme');
        if (t === 'dark') document.documentElement.classList.add('dark');
        if (t === 'light') document.documentElement.classList.remove('dark');
      } catch (e) {}
    })();
  `;

  return (
    <NextIntlClientProvider messages={messages as Record<string, unknown>} locale={locale}>
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: tiny inline bootstrap for theme
        dangerouslySetInnerHTML={{ __html: themeScript }}
      />
      <MainLayout>{children}</MainLayout>
      <Toaster />
    </NextIntlClientProvider>
  );
}
