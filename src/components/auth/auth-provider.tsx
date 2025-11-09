'use client';

import { useAuthStore } from '@/store/auth-store';
import { usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

/**
 * AuthProvider - Initializes authentication state on app load
 * and refreshes session after OAuth callbacks
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const refreshSession = useAuthStore((state) => state.refreshSession);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize auth state on mount
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  useEffect(() => {
    // Check if we're returning from OAuth callback
    // Better Auth redirects to callbackURL with code/state params
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code || state) {
      // OAuth callback detected, wait for session cookie then refresh
      const timer = setTimeout(async () => {
        await refreshSession();
        // After refreshing, clean up URL params
        if (window.history.replaceState) {
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          url.searchParams.delete('state');
          window.history.replaceState({}, '', url.toString());
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, refreshSession, pathname]);

  return <>{children}</>;
}

