'use client';

import { useAuthStore } from '@/store/auth-store';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function AuthProviderContent() {
  const initialize = useAuthStore((state) => state.initialize);
  const refreshSession = useAuthStore((state) => state.refreshSession);
  const searchParams = useSearchParams();

  useEffect(() => {
    const schedule = (cb: () => void) => {
      if (typeof window === 'undefined') return;
      if ('requestIdleCallback' in window) {
        // @ts-expect-error - requestIdleCallback is not in the TS lib by default
        return window.requestIdleCallback(cb, { timeout: 2000 });
      }
      return window.setTimeout(cb, 250);
    };

    const cancel = (handle: number | undefined) => {
      if (!handle) return;
      // @ts-expect-error - cancelIdleCallback is not in the TS lib by default
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };

    const handle = schedule(() => {
      void initialize(true);
    });

    return () => cancel(handle);
  }, [initialize]);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const authCallback = searchParams.get('authCallback');

    if (code || state || authCallback) {
      const timer = setTimeout(async () => {
        await refreshSession();
        if (window.history.replaceState) {
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          url.searchParams.delete('state');
          url.searchParams.delete('authCallback');
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
