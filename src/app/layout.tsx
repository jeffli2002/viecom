import type { Metadata } from 'next';
import '@/styles/globals.css';
import { DEFAULT_SEO_KEYWORDS, getMetadataBase } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: 'Viecom - AI E-commerce Content Studio',
  description: 'Generate high-quality product images and videos at scale',
  keywords: DEFAULT_SEO_KEYWORDS,
  icons: {
    icon: '/thumbnailV1.png',
    shortcut: '/thumbnailV1.png',
    apple: '/thumbnailV1.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
