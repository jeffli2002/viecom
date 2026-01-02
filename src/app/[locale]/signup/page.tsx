'use client';

import { SignupForm } from '@/components/blocks/signup/signup-form';
import { useAuthInitialized, useInitialize, useIsAuthenticated, useRefreshSession } from '@/store/auth-store';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function SignupPageContent() {
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
      // Some providers append code/token on verification callback
      Boolean(searchParams.get('code')) ||
      Boolean(searchParams.get('token'));

    if (!isVerification) return;

    let cancelled = false;
    const run = async () => {
      try {
        setProcessingVerification(true);
        // Give Better Auth a brief moment to set cookies, then refresh
        await new Promise((r) => setTimeout(r, 700));

        // First, try direct session fetch to catch updated auth quickly
        try {
          const sessionResponse = await fetch('/api/auth/get-session', {
            credentials: 'include',
            cache: 'no-store',
          });
          if (sessionResponse.ok) {
            const data = await sessionResponse.json();
            const sessionUser = (data?.session?.user ?? data?.user ?? null) as any;
            if (sessionUser?.id && sessionUser?.emailVerified) {
              // Use setUser which already handles isAuthenticated and lastUpdated
              useAuthStore.getState().setUser(sessionUser);
              // small delay then redirect
              await new Promise((r) => setTimeout(r, 250));
              if (!cancelled) {
                const parts = window.location.pathname.split('/');
                const currentLocale = parts[1] || '';
                const target = currentLocale ? `/${currentLocale}/image-generation` : '/image-generation';
                window.location.replace(target);
              }
              return;
            }
          }
        } catch (_e) {
          // ignore and fall back to refresh
        }

        // Fallback: refresh session and force initialize to sync store flags
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
  }, [searchParams, refreshSession, initialize, router]);

  // Once authenticated (after verification), redirect to image generation immediately
  useEffect(() => {
    const isVerification =
      searchParams.get('verification') === '1' ||
      searchParams.get('verification') === 'true' ||
      Boolean(searchParams.get('code')) ||
      Boolean(searchParams.get('token'));

    if (isVerification && isInitialized && isAuthenticated) {
      const parts = window.location.pathname.split('/');
      const currentLocale = parts[1] || '';
      const target = currentLocale ? `/${currentLocale}/image-generation` : '/image-generation';
      window.location.replace(target);
    }
  }, [isAuthenticated, isInitialized, router, searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 p-6 md:p-10">
      <div className="flex w-full max-w-lg flex-col items-center gap-6">
        <SignupForm />
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 p-6 md:p-10">
          <div className="flex w-full max-w-lg flex-col items-center gap-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        </div>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}
export const dynamic = 'force-dynamic';
