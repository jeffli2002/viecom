'use client';

import { SignupForm } from '@/components/blocks/signup/signup-form';
import { useRouter } from '@/i18n/navigation';
import { useAuthInitialized, useIsAuthenticated, useRefreshSession } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useIsAuthenticated();
  const isInitialized = useAuthInitialized();
  const refreshSession = useRefreshSession();
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
        await new Promise((r) => setTimeout(r, 400));
        await refreshSession();
      } finally {
        if (!cancelled) setProcessingVerification(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [searchParams, refreshSession]);

  // Once authenticated (after verification), redirect to image generation immediately
  useEffect(() => {
    const isVerification =
      searchParams.get('verification') === '1' ||
      searchParams.get('verification') === 'true' ||
      Boolean(searchParams.get('code')) ||
      Boolean(searchParams.get('token'));

    if (isVerification && isInitialized && isAuthenticated) {
      router.replace('/image-generation');
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
