import { AuthProvider } from '@/components/auth/auth-provider';
import { ChristmasPromoBanner } from '@/components/blocks/christmas-promo-banner';
import { Footer } from './footer';
import { Header } from './header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AuthProvider />
      <ChristmasPromoBanner />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
