import {
  useAuthError,
  useAuthLoading,
  useClearError,
  useEmailLogin,
  useIsAuthenticated,
  useSignInWithGoogle,
} from '@/store/auth-store';
import type { UseLoginReturn } from '@/types/login';
import { useRouter } from '@/i18n/navigation';
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
  const getRedirectUrl = useCallback(() => {
    const callbackUrl = searchParams.get('callbackUrl');
    return callbackUrl || '/';
  }, [searchParams]);

  // Auto redirect after successful login
  useEffect(() => {
    if (isAuthenticated) {
      const redirectUrl = getRedirectUrl();
      router.push(redirectUrl);
    }
  }, [isAuthenticated, router, getRedirectUrl]);

  // Handle social login
  const handleSocialLogin = async (provider: 'google') => {
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
