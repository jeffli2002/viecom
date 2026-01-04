'use client';

import { Hero } from '@/components/blocks/hero';
import { SignupForm } from '@/components/blocks/signup/signup-form';
import {
  useAuthInitialized,
  useInitialize,
  useIsAuthenticated,
  useRefreshSession,
} from '@/store/auth-store';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

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
              if (!cancelled && typeof window !== 'undefined') {
                // Get locale from current path or use default
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
  }, [searchParams, refreshSession, initialize]);

  // Once authenticated (after verification), redirect to image generation immediately
  useEffect(() => {
    const isVerification =
      searchParams.get('verification') === '1' ||
      searchParams.get('verification') === 'true' ||
      Boolean(searchParams.get('code')) ||
      Boolean(searchParams.get('token'));

    if (isVerification && isInitialized && isAuthenticated && typeof window !== 'undefined') {
      // Get locale from current path or use default
      const parts = window.location.pathname.split('/').filter(Boolean);
      const currentLocale = parts[0] || 'en';
      const target = `/${currentLocale}/image-generation`;
      window.location.replace(target);
    }
  }, [isAuthenticated, isInitialized, searchParams]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Homepage background - Hero section */}
      <div className="absolute inset-0 z-0">
        <Hero />
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm" />

      {/* Signup form modal */}
      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center p-6 md:p-10 w-full">
        <div className="w-full max-w-md">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen w-full overflow-hidden">
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" />
          <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-20 flex min-h-screen flex-col items-center justify-center gap-6 p-6 md:p-10 w-full">
            <div className="flex w-full max-w-md flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
              <p className="text-white/70 text-sm">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}
export const dynamic = 'force-dynamic';
