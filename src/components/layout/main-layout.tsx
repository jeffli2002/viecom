'use client';

import { AuthProvider } from '@/components/auth/auth-provider';
import { usePathname } from '@/i18n/navigation';
import { Footer } from './footer';
import { Header } from './header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  // Check if we're on the landing page (home page)
  // Pathname could be '/', '/en', '/zh', or locale-prefixed '/'
  const isLandingPage =
    pathname === '/' || pathname === '/en' || pathname === '/zh' || pathname.match(/^\/[a-z]{2}$/);

  // If it's the landing page, don't render default header/footer (landing page has its own)
  if (isLandingPage) {
    return (
      <AuthProvider>
        {children}
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
