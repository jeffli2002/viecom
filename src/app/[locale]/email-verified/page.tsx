"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { resolveRedirectTarget } from "@/lib/routing/redirect-target";
import {
  useAuthInitialized,
  useIsAuthenticated,
  useRefreshSession,
} from "@/store/auth-store";
import { CheckCircle2 } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

// Ensure this route is rendered dynamically to avoid prerendering issues
export const dynamic = "force-dynamic";

function EmailVerifiedInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useIsAuthenticated();
  const isInitialized = useAuthInitialized();
  const refreshSession = useRefreshSession();
  const [redirecting, setRedirecting] = useState(false);

  const locale = router.locale ?? routing.defaultLocale;

  const target = useMemo(() => {
    const raw = searchParams.get("callbackUrl") || searchParams.get("redirect");
    return resolveRedirectTarget(locale, raw);
  }, [searchParams, locale]);

  useEffect(() => {
    const run = async () => {
      try {
        await refreshSession();
      } catch {
        // ignore
      }
    };
    run();
    const t = setTimeout(run, 600);
    return () => clearTimeout(t);
  }, [refreshSession]);

  useEffect(() => {
    if (!redirecting && isInitialized && isAuthenticated) {
      setRedirecting(true);
      const next = target.relative === "/" ? "/dashboard" : target.relative;
      router.replace(next);
    }
  }, [isInitialized, isAuthenticated, router, target, redirecting]);

  return (
    <div className="container-base py-24">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="h2-section mb-2">Email verified</h1>
        <p className="text-body mb-6">
          Your email has been confirmed. We’re signing you in automatically.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={() =>
              router.replace(target.relative === "/" ? "/dashboard" : target.relative)
            }
          >
            Continue
          </Button>
          <a href="/login" className="text-sm text-muted-foreground underline">
            Go to login
          </a>
        </div>
      </div>
    </div>
  );
}

export default function EmailVerifiedPage() {
  return (
    <Suspense
      fallback={
        <div className="container-base py-24">
          <div className="mx-auto max-w-xl text-center">
            <h1 className="h2-section mb-2">Email verified</h1>
            <p className="text-body">Finalizing sign-in...</p>
          </div>
        </div>
      }
    >
      <EmailVerifiedInner />
    </Suspense>
  );
}
