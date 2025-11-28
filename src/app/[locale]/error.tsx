'use client';

import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

// biome-ignore lint/suspicious/noShadowRestrictedNames: Next.js requires this component name
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Locale layout error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Something went wrong!
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          {error.message || 'An unexpected error occurred'}
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button
            onClick={() => {
              window.location.href = '/';
            }}
            variant="outline"
          >
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}
