import { useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import {
  useAuthError,
  useAuthLoading,
  useClearError,
  useEmailLogin,
  useIsAuthenticated,
  useSignInWithGoogle,
} from '@/store/auth-store';
import type { UseLoginReturn } from '@/types/login';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export function useLogin(): UseLoginReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isLoading = useAuthLoading();
  const error = useAuthError();
  const isAuthenticated = useIsAuthenticated();
  const emailLogin = useEmailLogin();
  const clearError = useClearError();
  const signInWithGoogle = useSignInWithGoogle();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Get callback URL
  const locale = router.locale ?? routing.defaultLocale;

  const withLocalePrefix = useCallback(
    (url?: string | null) => {
      if (!url || url === '' || url === '/') {
        return `/${locale}`;
      }
      // Leave absolute URLs untouched
      if (/^https?:\/\//.test(url)) {
        return url;
      }
      if (!url.startsWith('/')) {
        return `/${locale}/${url}`;
      }
      const hasLocalePrefix = routing.locales.some(
        (loc) => url === `/${loc}` || url.startsWith(`/${loc}/`)
      );
      if (hasLocalePrefix) {
        return url;
      }
      return `/${locale}${url}`;
    },
    [locale]
  );

  const getRedirectUrl = useCallback(() => {
    const callbackUrl = searchParams.get('callbackUrl');
    return withLocalePrefix(callbackUrl);
  }, [searchParams, withLocalePrefix]);

  // Auto redirect after successful login
  useEffect(() => {
    if (isAuthenticated) {
      const redirectUrl = getRedirectUrl();
      router.push(redirectUrl);
    }
  }, [isAuthenticated, router, getRedirectUrl]);

  // Handle social login
  const handleSocialLogin = async (_provider: 'google') => {
    try {
      clearError();
      const redirectUrl = getRedirectUrl();
      await signInWithGoogle(redirectUrl);
    } catch (error) {
      console.error('Social login error:', error);
    }
  };

  // Handle email login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const result = await emailLogin(formData.email, formData.password);
    if (result.success) {
      const redirectUrl = getRedirectUrl();
      router.push(redirectUrl);
    }
  };

  // Clear error
  const handleClearError = () => {
    clearError();
  };

  return {
    formData,
    setFormData,
    isLoading,
    error,
    isAuthenticated,
    handleEmailLogin,
    handleSocialLogin,
    handleClearError,
    getRedirectUrl,
  };
}
