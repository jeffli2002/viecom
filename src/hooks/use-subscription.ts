// @ts-nocheck
'use client';

import { useAuthStore } from '@/store/auth-store';
import { useEffect, useRef, useState } from 'react';

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
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [planId, setPlanId] = useState<NormalizedPlanId>('free');
  const [status, setStatus] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState<boolean>(false);
  const [interval, setInterval] = useState<'month' | 'year' | null>(null);
  const [upcomingPlan, setUpcomingPlan] =
    useState<SubscriptionResponse['subscription']['upcomingPlan']>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      // 未登录视为 free
      setPlanId('free');
      setStatus(null);
      setCancelAtPeriodEnd(false);
      setInterval(null);
      setUpcomingPlan(null);
      setLoading(false);
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/creem/subscription', { credentials: 'include' });
        if (!res.ok) {
          throw new Error('Failed to fetch subscription');
        }
        const data = (await res.json()) as SubscriptionResponse;

        // Debug logging
        console.log('[useSubscription] API Response:', data);

        if (!data.subscription) {
          console.log('[useSubscription] No subscription found, setting to free');
          setPlanId('free');
          setStatus(null);
          setCancelAtPeriodEnd(false);
          setInterval(null);
          setUpcomingPlan(null);
          return;
        }
        const apiStatus = data.subscription.status || null;
        const apiPlanId = data.subscription.planId;
        const apiPlanName = (data.subscription.planName || '').toLowerCase();

        console.log('[useSubscription] Raw values:', {
          apiStatus,
          apiPlanId,
          apiPlanName,
        });

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

        // 若订阅处于活跃/试用，但仍解析为 free，则兜底为 pro
        if ((apiStatus === 'active' || apiStatus === 'trialing') && normalized === 'free') {
          console.log(
            '[useSubscription] Active/trialing subscription but normalized to free, forcing to pro'
          );
          normalized = 'pro';
        }

        console.log('[useSubscription] Final normalized planId:', normalized);

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
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [isAuthenticated, authLoading]);

  return { loading, error, planId, status, cancelAtPeriodEnd, interval, upcomingPlan };
}
