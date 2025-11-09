'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToastMessages } from '@/hooks/use-toast-messages';
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
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export function SignupForm({ className, ...props }: React.ComponentProps<'div'>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toastMessages = useToastMessages();

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

  // Get callback URL
  const getRedirectUrl = useCallback(() => {
    const callbackUrl = searchParams.get('callbackUrl');
    return callbackUrl || '/';
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      const redirectUrl = getRedirectUrl();
      router.push(redirectUrl);
    }
  }, [isAuthenticated, router, getRedirectUrl]);

  const handleSocialLogin = async (provider: 'google') => {
    try {
      clearError();
      const redirectUrl = getRedirectUrl();
      await signInWithGoogle(redirectUrl);
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

    const result = await emailSignup(email, password, name);
    if (result.success) {
      const redirectUrl = getRedirectUrl();
      router.push(redirectUrl);
    } else {
      if (result.error) {
        setError(result.error);
      }
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create Account</CardTitle>
          <CardDescription>Sign up with your account</CardDescription>
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
                    Close
                  </button>
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
                  {isLoading ? 'Signing up...' : 'Sign up with Google'}
                </Button>
              </div>

              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-border after:border-t">
                <span className="relative z-10 bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>

              {/* Email password registration */}
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="name"
                    data-testid="name-input"
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                    data-testid="email-input"
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={6}
                    autoComplete="new-password"
                    data-testid="password-input"
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={6}
                    autoComplete="new-password"
                    data-testid="confirm-password-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !email || !password || !name || !confirmPassword}
                  data-testid="signup-button"
                >
                  {isLoading ? 'Signing up...' : 'Sign Up'}
                </Button>
              </div>

              <div className="text-center text-sm">
                Already have an account?{' '}
                <a href="/login" className="underline underline-offset-4">
                  Sign in
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


