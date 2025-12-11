'use client';

import { useAuthStore } from '@/store/auth-store';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function AuthProviderContent() {
  const initialize = useAuthStore((state) => state.initialize);
  const refreshSession = useAuthStore((state) => state.refreshSession);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code || state) {
      const timer = setTimeout(async () => {
        await refreshSession();
        if (window.history.replaceState) {
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          url.searchParams.delete('state');
          window.history.replaceState({}, '', url.toString());
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, refreshSession]);

  return null;
}

/**
 * Hydrates auth state from the client without forcing the full layout to be a client component.
 */
export function AuthProvider() {
  return (
    <Suspense fallback={null}>
      <AuthProviderContent />
    </Suspense>
  );
}
