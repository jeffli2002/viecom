'use client';

import { ResetPasswordForm } from '@/components/blocks/reset-password/reset-password-form';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function ResetPasswordPageContent() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <ResetPasswordForm className="w-full" />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
          <div className="flex w-full max-w-sm flex-col items-center gap-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordPageContent />
    </Suspense>
  );
}
