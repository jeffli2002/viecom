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
  // After email verification, return to signup with authCallback (AIedu pattern)
  const verificationCallbackPath = `/${locale}/signup`;

  // Clear email input on mount to prevent browser autofill
  useEffect(() => {
    // Clear email state
    setEmail('');
    // Also clear any browser autofill by resetting input value
    const emailInput = document.getElementById('signup-email-input') as HTMLInputElement;
    if (emailInput) {
      emailInput.value = '';
      // Force clear by setting and clearing again
      setTimeout(() => {
        emailInput.value = '';
        emailInput.setAttribute('value', '');
      }, 100);
    }
  }, []);

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
    const params =
      typeof window !== 'undefined' ? new URL(window.location.href).searchParams : null;
    const comingFromVerification = params?.get('authCallback');

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
      setError(tAuth('signin.passwordsDoNotMatch'));
      return;
    }

    // Preserve intended post-verification destination
    const { localized } = getRedirectTarget();
    const verificationCallbackUrl =
      typeof window !== 'undefined'
        ? new URL(
            `${verificationCallbackPath}?authCallback=verified&callbackUrl=${encodeURIComponent(localized)}`,
            window.location.origin
          ).toString()
        : `${verificationCallbackPath}?authCallback=verified&callbackUrl=${encodeURIComponent(localized)}`;

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
              `${verificationCallbackPath}?authCallback=verified&callbackUrl=${encodeURIComponent(localized)}`,
              window.location.origin
            ).toString()
          : `${verificationCallbackPath}?authCallback=verified&callbackUrl=${encodeURIComponent(localized)}`;

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
        throw new Error(detail || tAuth('signin.failedToResendVerificationEmail'));
      }

      setResendStatus(tAuth('signin.verificationEmailSent'));
      setResendCooldown(30);
    } catch (error) {
      setResendStatus(
        error instanceof Error ? error.message : tAuth('signin.failedToResendVerificationEmail')
      );
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail) {
      setChangeEmailStatus(tAuth('signin.enterValidEmail'));
      return;
    }

    setChangeEmailStatus(null);

    try {
      const { localized } = getRedirectTarget();
      const callbackURL =
        typeof window !== 'undefined'
          ? new URL(
              `${verificationCallbackPath}?authCallback=verified&callbackUrl=${encodeURIComponent(localized)}`,
              window.location.origin
            ).toString()
          : `${verificationCallbackPath}?authCallback=verified&callbackUrl=${encodeURIComponent(localized)}`;

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
        throw new Error(detail || tAuth('signin.failedToChangeEmail'));
      }

      setSignupEmail(newEmail);
      setShowChangeEmail(false);
      setNewEmail('');
      setChangeEmailStatus(tAuth('signin.emailUpdated'));
      setResendCooldown(30);
    } catch (error) {
      setChangeEmailStatus(
        error instanceof Error ? error.message : tAuth('signin.failedToChangeEmail')
      );
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
            <AlertDialogTitle className="text-2xl font-bold text-gray-900">
              {tAuth('verification.title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-700">
              {tAuth('verification.description', {
                email: signupEmail || tAuth('verification.yourEmail'),
              })}
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
              className="w-full h-11 border-gray-300 bg-white text-gray-900 flex items-center justify-start gap-3 px-4"
              onClick={handleOpenGmail}
            >
              {/* Google G Logo */}
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {tAuth('verification.openGmail')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-gray-300 bg-white text-gray-900 flex items-center justify-start gap-3 px-4"
              onClick={handleOpenOutlook}
            >
              {/* Outlook Logo - Simple blue envelope */}
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2" fill="#0078D4" />
                <path
                  d="M2 6l10 6 10-6"
                  stroke="#fff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
              {tAuth('verification.openOutlook')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-gray-300 bg-white text-gray-900 flex items-center justify-start gap-3 px-4"
              onClick={handleOpenQQMail}
            >
              {/* QQ Mail Logo - Simple orange envelope */}
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2" fill="#FF6A00" />
                <path
                  d="M2 6l10 6 10-6"
                  stroke="#fff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
              {tAuth('verification.openQQMail')}
            </Button>
          </div>
          {showChangeEmail && (
            <div className="mt-4 grid gap-3">
              <Label
                htmlFor="new-email"
                className="text-xs font-medium text-gray-700 uppercase tracking-wide"
              >
                {tAuth('verification.newEmail')}
              </Label>
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
        <Card className="border-0 shadow-none bg-transparent w-full">
          <CardHeader className="text-center pb-5 px-0">
            <CardTitle className="text-4xl font-bold mb-3 text-gray-900">
              {tAuth('signup.title')}
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 mb-3">
              {tAuth('signup.subtitle')}
            </CardDescription>
            {/* Terms and Privacy Notice */}
            <p className="text-[10px] text-gray-500 leading-relaxed px-2 mb-2">
              {tAuth.rich('signup.termsNotice', {
                terms: (chunks) => (
                  <a
                    href={`/${locale}/terms`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {chunks}
                  </a>
                ),
                privacy: (chunks) => (
                  <a
                    href={`/${locale}/privacy`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </CardHeader>
          <CardContent className="px-0">
            <form onSubmit={handleEmailSignup} data-testid="signup-form" autoComplete="off">
              <div className="grid gap-4">
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
                    className="w-full h-14 border-gray-300 bg-white text-gray-900 hover:bg-gray-50 transition-colors shadow-sm text-base font-medium"
                    onClick={() => handleSocialLogin('google')}
                    disabled={isLoading}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      className="mr-3 h-6 w-6"
                      role="img"
                      aria-label="Google"
                    >
                      <path
                        fill="#4285F4"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#34A853"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#EA4335"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                    {isLoading ? tAuth('signup.signingUp') : tAuth('signup.continueWithGoogle')}
                  </Button>
                </div>

                <div className="relative flex items-center">
                  <div className="flex-1 border-t border-gray-300" />
                  <span className="px-4 text-xs text-gray-400 bg-white">or</span>
                  <div className="flex-1 border-t border-gray-300" />
                </div>

                {/* Email password registration */}
                <div className="grid gap-5">
                  <div className="grid gap-2">
                    <Label
                      htmlFor="name"
                      className="text-[10px] font-medium text-gray-600 uppercase tracking-wide"
                    >
                      {tAuth('name')}
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder={tAuth('namePlaceholder')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={isLoading}
                      autoComplete="off"
                      data-testid="name-input"
                      className="h-14 bg-white border-gray-300 text-base"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="signup-email-input"
                      className="text-[10px] font-medium text-gray-600 uppercase tracking-wide"
                    >
                      {tAuth('email')}
                    </Label>
                    {/* Hidden fake input to trick browser autofill */}
                    <input
                      type="email"
                      name="fake-email"
                      autoComplete="off"
                      style={{
                        position: 'absolute',
                        left: '-9999px',
                        opacity: 0,
                        pointerEvents: 'none',
                      }}
                      tabIndex={-1}
                      readOnly
                    />
                    <Input
                      id="signup-email-input"
                      name="signup-email"
                      type="email"
                      placeholder={tAuth('emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      autoComplete="off"
                      autoFocus={false}
                      data-testid="email-input"
                      className="h-14 bg-white border-gray-300 text-base"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="password"
                      className="text-[10px] font-medium text-gray-600 uppercase tracking-wide"
                    >
                      {tAuth('password')}
                    </Label>
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
                      className="h-14 bg-white border-gray-300 text-base"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-[10px] font-medium text-gray-600 uppercase tracking-wide"
                    >
                      {tAuth('confirmPassword')}
                    </Label>
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
                      className="h-14 bg-white border-gray-300 text-base"
                    />
                  </div>
                  <Button
                    type="submit"
                    className={cn(
                      'w-full h-14 font-bold text-lg',
                      password.length >= MIN_PASSWORD_LENGTH &&
                        password === confirmPassword &&
                        email &&
                        name &&
                        !isLoading
                        ? 'btn-primary'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-400'
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
                    {isLoading ? tAuth('signup.signingUp') : tAuth('signup.createAccount')}
                  </Button>
                </div>

                <div className="text-center text-xs text-gray-500">
                  {tAuth('signup.haveAccount')}{' '}
                  <a
                    href={`/${locale}/signin`}
                    className="text-blue-600 hover:underline font-medium"
                  >
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
