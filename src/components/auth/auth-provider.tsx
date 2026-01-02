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
      const timer = setTimeout(async () => {
        await refreshSession();

        // If verification or OAuth callback completes, redirect to the intended target
        if (authCallback) {
          const { isAuthenticated } = useAuthStore.getState();
          const locale = (router as any)?.locale ?? routing.defaultLocale;
          // default to image-generation if no target provided
          const target = resolveRedirectTarget(locale, cbParam || '/image-generation');
          if (isAuthenticated) {
            router.replace(target.relative);
            return;
          }
        }

        // Clean URL params if staying on the same page
        if (window.history.replaceState) {
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          url.searchParams.delete('state');
          url.searchParams.delete('authCallback');
          // Keep callbackUrl in case the page uses it later
          window.history.replaceState({}, '', url.toString());
        }
      }, 800);

      return () => clearTimeout(timer);
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
