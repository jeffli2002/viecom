'use client';

import { Suspense, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LoginForm } from '@/components/blocks/login/login-form';
import { useLogin } from '@/hooks/use-login';
import { useAuthStore } from '@/store/auth-store';
import { useSearchParams } from 'next/navigation';

function SigninPageContent() {
  const loginData = useLogin();
  const refreshSession = useAuthStore((state) => state.refreshSession);
  const searchParams = useSearchParams();

  // Handle OAuth callback similarly to /login
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white p-6 md:p-10">
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

export default function SigninPage() {
  const t = useTranslations('common');
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white p-6 md:p-10">
          <div className="flex w-full max-w-sm flex-col items-center gap-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-gray-500 text-sm">{t('loading')}</p>
          </div>
        </div>
      }
    >
      <SigninPageContent />
    </Suspense>
  );
}
export const dynamic = 'force-dynamic';
