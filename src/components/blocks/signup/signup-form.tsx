'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToastMessages } from '@/hooks/use-toast-messages';
import { useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { resolveRedirectTarget } from '@/lib/routing/redirect-target';
import { cn } from '@/lib/utils';
import {
  useAuthError,
  useAuthLoading,
  useClearError,
  useEmailSignup,
  useIsAuthenticated,
  useSetError,
  useSignInWithGoogle,
} from '@/store/auth-store';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const MIN_PASSWORD_LENGTH = 8;

export function SignupForm({ className, ...props }: React.ComponentProps<'div'>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toastMessages = useToastMessages();
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('auth');

  const isLoading = useAuthLoading();
  const error = useAuthError();
  const isAuthenticated = useIsAuthenticated();
  const emailSignup = useEmailSignup();
  const clearError = useClearError();
  const signInWithGoogle = useSignInWithGoogle();
  const setError = useSetError();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showVerificationNotice, setShowVerificationNotice] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [changeEmailStatus, setChangeEmailStatus] = useState<string | null>(null);

  const locale = router.locale ?? routing.defaultLocale;
  // After email verification, return to signup page where we refresh session
  // and immediately redirect to the intended destination.
  const verificationCallbackPath = `/${locale}/email-verified`;

  const getRedirectTarget = useCallback(() => {
    const callbackUrl = searchParams.get('callbackUrl');
    return resolveRedirectTarget(locale, callbackUrl);
  }, [locale, searchParams]);

  // Quick open common email providers (parity with AIedu)
  const handleOpenGmail = () => {
    if (typeof window !== 'undefined') window.open('https://mail.google.com', '_blank');
  };
  const handleOpenOutlook = () => {
    if (typeof window !== 'undefined') window.open('https://outlook.live.com', '_blank');
  };
  const handleOpenQQMail = () => {
    if (typeof window !== 'undefined') window.open('https://mail.qq.com', '_blank');
  };

  useEffect(() => {
    // If we're on signup due to verification callback, avoid racing with the page's own redirect.
    const params = typeof window !== 'undefined' ? new URL(window.location.href).searchParams : null;
    const comingFromVerification = params?.get('verification');

    if (isAuthenticated && !showVerificationNotice) {
      if (!comingFromVerification) {
        const { relative } = getRedirectTarget();
        router.replace(relative);
      }
      // If coming from verification, let the page-level effect handle redirect to /image-generation
    }
  }, [isAuthenticated, showVerificationNotice, router, getRedirectTarget]);

  const handleSocialLogin = async (_provider: 'google') => {
    try {
      clearError();
      const { localized } = getRedirectTarget();
      await signInWithGoogle(localized);
    } catch (error) {
      console.error('Social login error:', error);
      toastMessages.error.socialLoginFailed();
    }
  };

  // Email registration handling
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Preserve intended post-verification destination
    const { localized } = getRedirectTarget();
    const verificationCallbackUrl =
      typeof window !== 'undefined'
        ? new URL(
            `${verificationCallbackPath}?callbackUrl=${encodeURIComponent(localized)}`,
            window.location.origin
          ).toString()
        : `${verificationCallbackPath}?callbackUrl=${encodeURIComponent(localized)}`;

    const result = await emailSignup(email, password, name, verificationCallbackUrl);
    if (result.success) {
      // Clear form data
      setSignupEmail(email);
      setResendStatus(null);
      setChangeEmailStatus(null);
      setShowChangeEmail(false);
      setNewEmail('');
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      try {
        window.localStorage.setItem(
          'viecom:verification-email',
          JSON.stringify({ email, ts: Date.now() })
        );
      } catch (_storageError) {
        // Ignore storage failures (privacy mode, etc.)
      }
      setShowVerificationNotice(true);
    } else {
      if (result.error) {
        setError(result.error);
      }
    }
  };

  const handleResendVerification = async () => {
    if (!signupEmail || resendCooldown > 0) return;
    setResendStatus(null);

    try {
      const { localized } = getRedirectTarget();
      const callbackURL =
        typeof window !== 'undefined'
          ? new URL(
              `${verificationCallbackPath}?callbackUrl=${encodeURIComponent(localized)}`,
              window.location.origin
            ).toString()
          : `${verificationCallbackPath}?callbackUrl=${encodeURIComponent(localized)}`;

      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupEmail,
          callbackURL,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || 'Failed to resend verification email');
      }

      setResendStatus('Verification email sent. Please check your inbox.');
      setResendCooldown(30);
    } catch (error) {
      setResendStatus(
        error instanceof Error ? error.message : 'Failed to resend verification email'
      );
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail) {
      setChangeEmailStatus('Please enter a valid email address.');
      return;
    }

    setChangeEmailStatus(null);

    try {
      const { localized } = getRedirectTarget();
      const callbackURL =
        typeof window !== 'undefined'
          ? new URL(
              `${verificationCallbackPath}?callbackUrl=${encodeURIComponent(localized)}`,
              window.location.origin
            ).toString()
          : `${verificationCallbackPath}?callbackUrl=${encodeURIComponent(localized)}`;

      const response = await fetch('/api/auth/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newEmail,
          callbackURL,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || 'Failed to change email');
      }

      setSignupEmail(newEmail);
      setShowChangeEmail(false);
      setNewEmail('');
      setChangeEmailStatus('Email updated. Please check your inbox for confirmation.');
      setResendCooldown(30);
    } catch (error) {
      setChangeEmailStatus(error instanceof Error ? error.message : 'Failed to change email');
    }
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <AlertDialog
        open={showVerificationNotice}
        onOpenChange={(open) => {
          if (open) {
            setShowVerificationNotice(true);
          }
        }}
      >
        <AlertDialogContent className="bg-white max-w-md">
          <AlertDialogHeader className="text-center pb-2">
            <div className="flex justify-center mb-3">
              <div className="relative w-28 h-28">
                <div className="absolute top-1 left-2 w-20 h-20 bg-teal-300 rounded-tl-full rounded-bl-full rounded-tr-[60%] rounded-br-[40%] opacity-80" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center shadow">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex gap-1 mb-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-sm" />
                        <div className="w-1.5 h-1.5 bg-white rounded-sm" />
                      </div>
                      <div className="w-5 h-2 border border-white border-t-0 rounded-b-full" />
                    </div>
                  </div>
                </div>
                <div className="absolute top-1 left-1 w-2.5 h-2.5 bg-purple-500 rounded-sm" />
                <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-purple-500 rounded-sm" />
                <div className="absolute bottom-1 left-1 w-2.5 h-2.5 bg-purple-500 rounded-sm" />
                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-purple-500 rounded-sm" />
              </div>
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-gray-900">{tAuth('verification.title')}</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-700">
              {tAuth('verification.description', { email: signupEmail || tAuth('verification.yourEmail') })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {resendStatus && (
            <div className="rounded-md bg-slate-50 px-3 py-2 text-slate-700 text-sm">
              {resendStatus}
            </div>
          )}
          {/* Email client quick actions */}
          <div className="flex flex-col gap-3 mb-4">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-gray-300 bg-white text-gray-900"
              onClick={handleOpenGmail}
            >
              {tAuth('verification.openGmail')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-gray-300 bg-white text-gray-900"
              onClick={handleOpenOutlook}
            >
              {tAuth('verification.openOutlook')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-gray-300 bg-white text-gray-900"
              onClick={handleOpenQQMail}
            >
              {tAuth('verification.openQQMail')}
            </Button>
          </div>
          {showChangeEmail && (
            <div className="mt-4 grid gap-3">
              <Label htmlFor="new-email" className="text-xs font-medium text-gray-700 uppercase tracking-wide">{tAuth('verification.newEmail')}</Label>
              <Input
                id="new-email"
                type="email"
                placeholder={tAuth('emailPlaceholder')}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                autoComplete="email"
              />
              {changeEmailStatus && (
                <div className="text-slate-600 text-sm">{changeEmailStatus}</div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowChangeEmail(false)}>
                  {tCommon('cancel')}
                </Button>
                <Button type="button" onClick={handleChangeEmail}>
                  {tAuth('verification.updateEmail')}
                </Button>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleResendVerification}
                disabled={!signupEmail || resendCooldown > 0}
              >
                {resendCooldown > 0
                  ? tAuth('verification.resendIn', { seconds: resendCooldown })
                  : tAuth('verification.resend')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowChangeEmail(true)}
                disabled={showChangeEmail}
              >
                {tAuth('verification.changeEmail')}
              </Button>
              <AlertDialogAction onClick={() => setShowVerificationNotice(false)}>
                {tCommon('close')}
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      {!showVerificationNotice && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{tAuth('signup.title')}</CardTitle>
            <CardDescription>{tAuth('signup.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSignup} data-testid="signup-form">
              <div className="grid gap-6">
                {/* Error message display */}
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm">
                    {error}
                    <button
                      type="button"
                      onClick={clearError}
                      className="ml-2 underline hover:no-underline"
                    >
                      {tCommon('close')}
                    </button>
                  </div>
                )}

                {/* Social login buttons */}
                <div className="flex flex-col gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 border-gray-300 bg-white text-gray-900 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
                    onClick={() => handleSocialLogin('google')}
                    disabled={isLoading}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      className="mr-2 h-5 w-5"
                      role="img"
                      aria-label="Google"
                    >
                      <path
                        fill="#FFC107"
                        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                      />
                      <path
                        fill="#FF3D00"
                        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                      />
                      <path
                        fill="#4CAF50"
                        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                      />
                      <path
                        fill="#1976D2"
                        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                      />
                    </svg>
                    {isLoading ? tAuth('signup.signingUp') : tAuth('signup.withGoogle')}
                  </Button>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-gray-500">{tAuth('orContinueWith')}</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>

                {/* Email password registration */}
                <div className="grid gap-5">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-xs font-medium text-gray-700 uppercase tracking-wide">{tAuth('name')}</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder={tAuth('namePlaceholder')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={isLoading}
                      autoComplete="name"
                      data-testid="name-input"
                      className="h-11 bg-gray-50 border-gray-300"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-xs font-medium text-gray-700 uppercase tracking-wide">{tAuth('email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={tAuth('emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      autoComplete="email"
                      data-testid="email-input"
                      className="h-11 bg-gray-50 border-gray-300"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-xs font-medium text-gray-700 uppercase tracking-wide">{tAuth('password')}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={MIN_PASSWORD_LENGTH}
                      placeholder={tAuth('passwordAtLeast', { count: MIN_PASSWORD_LENGTH })}
                      autoComplete="new-password"
                      data-testid="password-input"
                      className="h-11 bg-gray-50 border-gray-300"
                    />
                    <p className="text-gray-500 text-xs">
                      {tAuth('passwordHint', { count: MIN_PASSWORD_LENGTH })}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword" className="text-xs font-medium text-gray-700 uppercase tracking-wide">{tAuth('confirmPassword')}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={MIN_PASSWORD_LENGTH}
                      placeholder={tAuth('passwordAtLeast', { count: MIN_PASSWORD_LENGTH })}
                      autoComplete="new-password"
                      data-testid="confirm-password-input"
                      className="h-11 bg-gray-50 border-gray-300"
                    />
                  </div>
                  <Button
                    type="submit"
                    className={cn(
                      'w-full h-11',
                      password.length >= MIN_PASSWORD_LENGTH &&
                        password === confirmPassword &&
                        email &&
                        name &&
                        !isLoading
                        ? 'btn-primary'
                        : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed hover:bg-slate-300 dark:hover:bg-slate-600'
                    )}
                    disabled={
                      isLoading ||
                      !email ||
                      !name ||
                      !password ||
                      !confirmPassword ||
                      password.length < MIN_PASSWORD_LENGTH ||
                      password !== confirmPassword
                    }
                    data-testid="signup-button"
                  >
                    {isLoading ? tAuth('signup.signingUp') : tAuth('signup.submit')}
                  </Button>
                </div>

                <div className="text-center text-sm">
                  {tAuth('signup.haveAccount')}{' '}
                  <a href="/signin" className="underline underline-offset-4">
                    {tAuth('signin.linkText')}
                  </a>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
