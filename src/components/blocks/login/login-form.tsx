'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      setResendStatus('Please enter your email address to resend the confirmation.');
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
      // After verification, return to signup so we can refresh session and redirect to the intended page
      const base = `/${locale}/signup?verification=1&callbackUrl=${encodeURIComponent(target)}`;
      const callbackURL = new URL(base, window.location.origin).toString();
      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, callbackURL }),
        credentials: 'include',
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || 'Failed to resend verification email');
      }
      setResendStatus('Verification email sent. Please check your inbox.');
    } catch (err) {
      setResendStatus(err instanceof Error ? err.message : 'Failed to resend verification email');
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

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome Back</CardTitle>
          <CardDescription>Sign in with your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onEmailLogin} data-testid="login-form">
            <div className="grid gap-6">
              {showVerificationBanner && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm">
                  <p className="font-semibold">{tAuth('verification.bannerTitle')}</p>
                  <p className="mt-1">
                    {tAuth('verification.bannerBody', { email: verificationEmail || tAuth('verification.yourInbox') })}
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
                    <p className="font-semibold">Unable to sign in from this browser</p>
                    <p className="mt-1">
                      Google sign-in is not supported in embedded browsers. Please:
                    </p>
                    <ul className="mt-1 list-inside list-disc space-y-1">
                      <li>Use the "Open in Browser" option from your app's menu</li>
                      <li>Or sign in with email and password below</li>
                    </ul>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 bg-white"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert('URL copied! Open it in Safari (iOS) or Chrome (Android)');
                      }}
                    >
                      Copy URL to Open in Browser
                    </Button>
                  </div>
                </div>
              )}

              {/* Social login buttons */}
              <div className="flex flex-col gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
                  onClick={() => handleSocialLogin('google')}
                  disabled={isLoading}
                  data-testid="google-login-button"
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
                  {isLoading ? 'Signing in...' : 'Sign in with Google'}
                </Button>
              </div>

              <div className="relative py-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500 font-medium">{tAuth('orUseEmail')}</span>
                </div>
              </div>

              {/* Email password login */}
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleEmailChange}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                    data-testid="email-input"
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <a href="/reset-password" className="ml-auto text-sm underline-offset-4 hover:underline">
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
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full btn-primary"
                  disabled={isLoading || !formData.email || !formData.password}
                  data-testid="login-button"
                >
                  {isLoading ? tAuth('signin.signingIn') : tAuth('signin.submit')}
                </Button>
              </div>

              <div className="text-center text-sm">
                {tAuth('signin.noAccount')}{' '}
                <a href="/signup" className="underline underline-offset-4">
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
