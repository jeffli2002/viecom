// @ts-nocheck
'use client';

import { useAuthStore } from '@/store/auth-store';
import { useEffect, useState } from 'react';

export type NormalizedPlanId = 'free' | 'pro' | 'proplus';

interface SubscriptionResponse {
  subscription: {
    planId?: 'pro' | 'proplus';
    planName?: string;
    status?: string;
    cancelAtPeriodEnd?: boolean;
    interval?: 'month' | 'year';
    upcomingPlan?: {
      planId?: 'pro' | 'proplus';
      interval?: 'month' | 'year';
      takesEffectAt?: string | null;
      changeType?: 'upgrade' | 'downgrade';
    } | null;
  } | null;
}

export interface UseSubscriptionResult {
  loading: boolean;
  error: string | null;
  planId: NormalizedPlanId;
  status: string | null;
  cancelAtPeriodEnd: boolean;
  interval: 'month' | 'year' | null;
  upcomingPlan: SubscriptionResponse['subscription']['upcomingPlan'];
}

export function useSubscription(): UseSubscriptionResult {
  const { isLoading: authLoading } = useAuthStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [planId, setPlanId] = useState<NormalizedPlanId>('free');
  const [status, setStatus] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState<boolean>(false);
  const [interval, setInterval] = useState<'month' | 'year' | null>(null);
  const [upcomingPlan, setUpcomingPlan] =
    useState<SubscriptionResponse['subscription']['upcomingPlan']>(null);
  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    const resetToFree = () => {
      if (cancelled) return;
      setPlanId('free');
      setStatus(null);
      setCancelAtPeriodEnd(false);
      setInterval(null);
      setUpcomingPlan(null);
    };

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/creem/subscription', { credentials: 'include' });
        if (res.status === 401) {
          resetToFree();
          return;
        }
        if (!res.ok) {
          throw new Error('Failed to fetch subscription');
        }
        const data = (await res.json()) as SubscriptionResponse;

        if (!data.subscription) {
          resetToFree();
          return;
        }

        const apiStatus = data.subscription.status || null;
        const apiPlanId = data.subscription.planId;
        const apiPlanName = (data.subscription.planName || '').toLowerCase();

        let normalized: NormalizedPlanId =
          apiPlanId === 'proplus'
            ? 'proplus'
            : apiPlanId === 'pro'
              ? 'pro'
              : apiPlanName.includes('proplus')
                ? 'proplus'
                : apiPlanName.includes('pro')
                  ? 'pro'
                  : 'free';

        if ((apiStatus === 'active' || apiStatus === 'trialing') && normalized === 'free') {
          normalized = 'pro';
        }

        if (cancelled) {
          return;
        }

        setPlanId(normalized);
        setStatus(apiStatus);
        setCancelAtPeriodEnd(Boolean(data.subscription.cancelAtPeriodEnd));
        setInterval((data.subscription.interval as 'month' | 'year') || null);
        setUpcomingPlan(
          data.subscription.upcomingPlan
            ? {
                ...data.subscription.upcomingPlan,
              }
            : null
        );
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Unknown error');
          resetToFree();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [authLoading]);

  return { loading, error, planId, status, cancelAtPeriodEnd, interval, upcomingPlan };
}
