'use client';

import { LoginForm } from '@/components/blocks/login/login-form';
import { useLogin } from '@/hooks/use-login';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function LoginPageContent() {
  const loginData = useLogin();
  const refreshSession = useAuthStore((state) => state.refreshSession);
  const searchParams = useSearchParams();

  // Check if we're returning from OAuth callback and refresh session
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code || state) {
      // OAuth callback detected, refresh session after a short delay
      const timer = setTimeout(() => {
        refreshSession();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, refreshSession]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <LoginForm
          formData={loginData.formData}
          setFormData={loginData.setFormData}
          isLoading={loginData.isLoading}
          error={loginData.error}
          onEmailLogin={loginData.handleEmailLogin}
          onSocialLogin={loginData.handleSocialLogin}
          onClearError={loginData.handleClearError}
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
          <div className="flex w-full max-w-sm flex-col items-center gap-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
