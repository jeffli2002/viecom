'use client';

import { resolveRedirectTarget } from '@/lib/routing/redirect-target';
import { routing } from '@/i18n/routing';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function AuthProviderContent() {
  const initialize = useAuthStore((state) => state.initialize);
  const refreshSession = useAuthStore((state) => state.refreshSession);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    initialize(true);
  }, [initialize]);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const authCallback = searchParams.get('authCallback');
    const cbParam = searchParams.get('callbackUrl');

    if (code || state || authCallback) {
      let cancelled = false;
      const run = async () => {
        const locale = (router as any)?.locale ?? routing.defaultLocale;
        const target = resolveRedirectTarget(locale, cbParam || '/image-generation');

        // Try up to 3 times to allow cookies to propagate on prod
        for (let attempt = 1; attempt <= 3 && !cancelled; attempt++) {
          try {
            await refreshSession();

            if (authCallback) {
              const { isAuthenticated } = useAuthStore.getState();
              if (isAuthenticated) {
                router.replace(target.relative);
                return;
              }

              // Also try direct REST session as a fallback
              try {
                const resp = await fetch('/api/auth/get-session', {
                  credentials: 'include',
                  cache: 'no-store',
                });
                if (resp.ok) {
                  const data = await resp.json();
                  const sessionUser = (data?.session?.user ?? data?.user ?? null) as any;
                  if (sessionUser?.id && sessionUser?.emailVerified) {
                    const s = useAuthStore.getState();
                    s.setUser(sessionUser);
                    useAuthStore.setState({ isAuthenticated: true, lastUpdated: Date.now() });
                    router.replace(target.relative);
                    return;
                  }
                }
              } catch {
                // ignore and retry
              }
            }
          } catch {
            // ignore and retry
          }
          // wait before next attempt
          await new Promise((r) => setTimeout(r, 1200));
        }

        // If not redirected yet and authCallback is present, try one last time to refresh
        if (authCallback) {
          try {
            await refreshSession();
            const { isAuthenticated } = useAuthStore.getState();
            if (isAuthenticated) {
              const locale = (router as any)?.locale ?? routing.defaultLocale;
              const target = resolveRedirectTarget(locale, cbParam || '/image-generation');
              router.replace(target.relative);
              return;
            }
          } catch {}
        }

        // Clean URL params if staying on the same page (ensure a clean signup URL)
        if (!cancelled && window.history.replaceState) {
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          url.searchParams.delete('state');
          url.searchParams.delete('authCallback');
          // keep callbackUrl if present; some flows may use it later
          window.history.replaceState({}, '', url.toString());
        }
      };

      run();
      return () => {
        cancelled = true;
      };
    }
  }, [searchParams, refreshSession, router]);

  return null;
}

export function AuthProvider() {
  return (
    <Suspense fallback={null}>
      <AuthProviderContent />
    </Suspense>
  );
}
