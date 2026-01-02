import { AuthProvider } from '@/components/auth/auth-provider';
import { Footer } from './footer';
import { Header } from './header';
import { Suspense } from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={null}>
        <AuthProvider />
      </Suspense>
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
