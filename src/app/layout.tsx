import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Viecom - AI E-commerce Content Studio',
  description: 'Generate high-quality product images and videos at scale',
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
