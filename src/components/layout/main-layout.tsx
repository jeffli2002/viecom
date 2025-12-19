import { AuthProvider } from '@/components/auth/auth-provider';
import { Footer } from './footer';
import { Header } from './header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export async function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AuthProvider />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
