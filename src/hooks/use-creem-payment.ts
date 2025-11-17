'use client';

import { env } from '@/env';
import { useState } from 'react';

type PlanId = 'pro' | 'proplus';
type BillingInterval = 'month' | 'year';

interface CheckoutParams {
  planId?: PlanId;
  interval?: BillingInterval;
  successUrl?: string;
  cancelUrl?: string;
}

export function useCreemPayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckoutSession = async ({
    planId,
    interval = 'month',
    successUrl,
    cancelUrl,
  }: CheckoutParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const fallbackOrigin =
        typeof window !== 'undefined' ? window.location.origin : env.NEXT_PUBLIC_APP_URL;
      const response = await fetch('/api/payment/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          planId,
          interval,
          successUrl: successUrl || `${fallbackOrigin}/settings/billing?success=true`,
          cancelUrl: cancelUrl || `${fallbackOrigin}/settings/billing?canceled=true`,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (typeof window !== 'undefined' && data.url) {
        window.location.href = data.url as string;
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create checkout session';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const openCustomerPortal = async (returnUrl?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/creem/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(
          returnUrl
            ? { returnUrl }
            : typeof window !== 'undefined'
              ? { returnUrl: `${window.location.origin}/settings/billing` }
              : {}
        ),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Failed to open customer portal');
      }

      if (typeof window !== 'undefined') {
        window.location.href = data.url as string;
      }

      return data.url as string;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open customer portal';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCheckoutSession,
    openCustomerPortal,
    isLoading,
    error,
  };
}
