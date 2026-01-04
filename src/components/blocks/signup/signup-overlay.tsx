'use client';

import { SignupForm } from '@/components/blocks/signup/signup-form';
import { useAuthStore } from '@/store/auth-store';
import {
  useAuthInitialized,
  useInitialize,
  useIsAuthenticated,
  useRefreshSession,
} from '@/store/auth-store';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function SignupOverlay() {
  const searchParams = useSearchParams();
  const isAuthenticated = useIsAuthenticated();
  const isInitialized = useAuthInitialized();
  const refreshSession = useRefreshSession();
  const initialize = useInitialize();
  const [processingVerification, setProcessingVerification] = useState(false);

  // If returning from email verification, refresh the session then redirect to image generation
  useEffect(() => {
    const isVerification =
      searchParams.get('verification') === '1' ||
      searchParams.get('verification') === 'true' ||
      Boolean(searchParams.get('code')) ||
      Boolean(searchParams.get('token'));

    if (!isVerification) return;

    let cancelled = false;
    const run = async () => {
      try {
        setProcessingVerification(true);
        await new Promise((r) => setTimeout(r, 700));

        try {
          const sessionResponse = await fetch('/api/auth/get-session', {
            credentials: 'include',
            cache: 'no-store',
          });
          if (sessionResponse.ok) {
            const data = await sessionResponse.json();
            const sessionUser = (data?.session?.user ?? data?.user ?? null) as any;
            if (sessionUser?.id && sessionUser?.emailVerified) {
              useAuthStore.getState().setUser(sessionUser);
              await new Promise((r) => setTimeout(r, 250));
              if (!cancelled && typeof window !== 'undefined') {
                const parts = window.location.pathname.split('/').filter(Boolean);
                const currentLocale = parts[0] || 'en';
                const target = `/${currentLocale}/image-generation`;
                window.location.replace(target);
              }
              return;
            }
          }
        } catch (_e) {
          // ignore and fall back to refresh
        }

        if (!cancelled) {
          await refreshSession();
          await initialize(true);
        }
      } catch (error) {
        console.error('[Signup] Error processing verification:', error);
      } finally {
        if (!cancelled) setProcessingVerification(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [searchParams, refreshSession, initialize]);

  // Once authenticated (after verification), redirect to image generation immediately
  useEffect(() => {
    const isVerification =
      searchParams.get('verification') === '1' ||
      searchParams.get('verification') === 'true' ||
      Boolean(searchParams.get('code')) ||
      Boolean(searchParams.get('token'));

    if (isVerification && isInitialized && isAuthenticated && typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const currentLocale = parts[0] || 'en';
      const target = `/${currentLocale}/image-generation`;
      window.location.replace(target);
    }
  }, [isAuthenticated, isInitialized, searchParams]);

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />

      {/* Signup form modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <SignupForm />
        </div>
      </div>
    </>
  );
}

export function SignupOverlayLoading() {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-10">
        <div className="flex w-full max-w-md flex-col items-center bg-white rounded-2xl p-8 shadow-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm mt-2">Loading...</p>
        </div>
      </div>
    </>
  );
}
