'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { cn, isMobile, isWebView } from '@/lib/utils';
import type { LoginFormProps } from '@/types/login';
import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function LoginForm({
  className,
  formData,
  setFormData,
  isLoading,
  error,
  onEmailLogin,
  onSocialLogin,
  onClearError,
  ...props
}: LoginFormProps & React.ComponentProps<'div'>) {
  const router = useRouter();
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('auth');
  const [isInWebView, setIsInWebView] = useState(false);
  const [showWebViewWarning, setShowWebViewWarning] = useState(false);
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const searchParams = useSearchParams();

  const isEmailNotVerified =
    error?.toLowerCase().includes('email not verified') ||
    error?.toLowerCase().includes('email_not_verified');

  useEffect(() => {
    const inWebView = isWebView() && isMobile();
    setIsInWebView(inWebView);
  }, []);

  useEffect(() => {
    const verifyParam = searchParams.get('verification');
    try {
      const stored = window.localStorage.getItem('viecom:verification-email');
      if (!stored && !verifyParam) return;
      const parsed = stored ? JSON.parse(stored) : null;
      if (parsed?.email) {
        setVerificationEmail(parsed.email);
      }
      setShowVerificationBanner(true);
    } catch (_storageError) {
      if (verifyParam) {
        setShowVerificationBanner(true);
      }
    }
  }, [searchParams]);

  const handleResendVerification = async () => {
    const targetEmail = formData.email || verificationEmail;
    if (!targetEmail) {
      setResendStatus(tAuth('signin.enterEmailToResend'));
      return;
    }
    setIsResending(true);
    setResendStatus(null);
    try {
      const [_, maybeLocale] = window.location.pathname.split('/');
      const locale = routing.locales.includes(maybeLocale) ? maybeLocale : routing.defaultLocale;
      // Preserve intended post-verification destination
      const rawTarget = searchParams.get('callbackUrl');
      const target = rawTarget && rawTarget.trim().length > 0 ? rawTarget : '/';
      // After verification, return to signup (AIedu pattern) so AuthProvider refreshes session and redirects
      const base = `/${locale}/signup?authCallback=verified&callbackUrl=${encodeURIComponent(target)}`;
      const callbackURL = new URL(base, window.location.origin).toString();
      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, callbackURL }),
        credentials: 'include',
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || tAuth('signin.failedToResendVerificationEmail'));
      }
      setResendStatus(tAuth('signin.verificationEmailSent'));
    } catch (err) {
      setResendStatus(
        err instanceof Error ? err.message : tAuth('signin.failedToResendVerificationEmail')
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleSocialLogin = (provider: 'google') => {
    if (isInWebView) {
      setShowWebViewWarning(true);
      setTimeout(() => setShowWebViewWarning(false), 8000);
      return;
    }
    onSocialLogin(provider);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, email: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, password: e.target.value });
  };

  const locale = router.locale ?? routing.defaultLocale;

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="relative border border-gray-200 shadow-lg bg-white w-full max-w-md mx-auto rounded-2xl">
        {/* Close button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={tCommon('close')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <CardHeader className="text-center pb-4 px-8 pt-8">
          <CardTitle className="text-3xl font-bold mb-2 text-gray-900">
            {tAuth('signin.title')}
          </CardTitle>
          <CardDescription className="text-xs text-gray-500 mb-2">
            {tAuth('signin.subtitle')}
          </CardDescription>
          {/* Terms and Privacy Notice */}
          <p className="text-[10px] text-gray-400 leading-relaxed">
            {tAuth.rich('signup.termsNotice', {
              terms: (chunks) => (
                <a
                  href={`/${locale}/terms`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {chunks}
                </a>
              ),
              privacy: (chunks) => (
                <a
                  href={`/${locale}/privacy`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={onEmailLogin} data-testid="login-form">
            <div className="grid gap-6">
              {showVerificationBanner && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm">
                  <p className="font-semibold">{tAuth('verification.bannerTitle')}</p>
                  <p className="mt-1">
                    {tAuth('verification.bannerBody', {
                      email: verificationEmail || tAuth('verification.yourInbox'),
                    })}
                  </p>
                </div>
              )}
              {/* Error message display */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm">
                  {error}
                  <button
                    type="button"
                    onClick={onClearError}
                    className="ml-2 underline hover:no-underline"
                  >
                    {tCommon('close')}
                  </button>
                </div>
              )}
              {isEmailNotVerified && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 text-sm">
                  <p className="font-semibold">{tAuth('verification.needNew')}</p>
                  <p className="mt-1">{tAuth('verification.resendHelp')}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResendVerification}
                      disabled={isResending}
                    >
                      {isResending ? tAuth('verification.sending') : tAuth('verification.resend')}
                    </Button>
                    {resendStatus && <span className="text-slate-600">{resendStatus}</span>}
                  </div>
                </div>
              )}

              {/* WebView warning */}
              {showWebViewWarning && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold">{tAuth('signin.unableToSignInBrowser')}</p>
                    <p className="mt-1">{tAuth('signin.googleSignInNotSupported')}</p>
                    <ul className="mt-1 list-inside list-disc space-y-1">
                      <li>{tAuth('signin.openInBrowserOption')}</li>
                      <li>{tAuth('signin.signInWithEmailBelow')}</li>
                    </ul>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 bg-white"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert(tAuth('signin.urlCopied'));
                      }}
                    >
                      {tAuth('signin.copyUrlToOpen')}
                    </Button>
                  </div>
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
                  data-testid="google-login-button"
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
                  {isLoading ? tAuth('signin.signingIn') : tAuth('signup.continueWithGoogle')}
                </Button>
              </div>

              <div className="relative flex items-center">
                <div className="flex-1 border-t border-gray-300" />
                <span className="px-4 text-xs text-gray-400 bg-white">or</span>
                <div className="flex-1 border-t border-gray-300" />
              </div>

              {/* Email password login */}
              <div className="grid gap-5">
                <div className="grid gap-2">
                  <Label
                    htmlFor="email"
                    className="text-[10px] font-medium text-gray-600 uppercase tracking-wide"
                  >
                    {tAuth('email')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={tAuth('emailPlaceholder')}
                    value={formData.email}
                    onChange={handleEmailChange}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                    data-testid="email-input"
                    className="h-14 bg-white border-gray-300 text-base"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label
                      htmlFor="password"
                      className="text-[10px] font-medium text-gray-600 uppercase tracking-wide"
                    >
                      {tAuth('password')}
                    </Label>
                    <a
                      href={`/${locale}/reset-password`}
                      className="ml-auto text-xs text-blue-500 hover:underline"
                    >
                      {tAuth('forgotPassword')}
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={handlePasswordChange}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                    data-testid="password-input"
                    className="h-14 bg-white border-gray-300 text-base"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-14 font-bold text-lg btn-primary"
                  disabled={isLoading || !formData.email || !formData.password}
                  data-testid="login-button"
                >
                  {isLoading ? tAuth('signin.signingIn') : tAuth('signin.submit')}
                </Button>
              </div>

              <div className="text-center text-sm">
                {tAuth('signin.noAccount')}{' '}
                <a href={`/${locale}/signup`} className="underline underline-offset-4">
                  {tAuth('signup.linkText')}
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
