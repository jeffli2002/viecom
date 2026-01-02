import type { Metadata } from 'next';
import '@/styles/globals.css';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import { AuthProvider } from '@/components/auth/auth-provider';
import { DEFAULT_SEO_KEYWORDS, getMetadataBase } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: 'Viecom - AI E-commerce Content Studio',
  description: 'Generate high-quality product images and videos at scale',
  keywords: DEFAULT_SEO_KEYWORDS,
  icons: {
    icon: '/ViecomFav.png',
    shortcut: '/ViecomFav.png',
    apple: '/ViecomFav.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <GoogleAnalytics />
        <AuthProvider />
        {children}
      </body>
    </html>
  );
}
