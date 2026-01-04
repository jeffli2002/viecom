'use client';

import { LoginForm } from '@/components/blocks/login/login-form';
import { useLogin } from '@/hooks/use-login';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function LoginOverlay() {
  const loginData = useLogin();
  const refreshSession = useAuthStore((state) => state.refreshSession);
  const searchParams = useSearchParams();

  // Handle OAuth callback similarly to /signin
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code || state) {
      const timer = setTimeout(() => {
        refreshSession();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [searchParams, refreshSession]);

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />

      {/* Login form modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
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
    </>
  );
}

export function LoginOverlayLoading() {
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
