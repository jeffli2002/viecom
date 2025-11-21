'use client';

import { Button } from '@/components/ui/button';
import { useCreemPayment } from '@/hooks/use-creem-payment';
import { routing } from '@/i18n/routing';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

type BillingInterval = 'month' | 'year';

interface PlanPurchaseButtonProps {
  planId: 'free' | 'pro' | 'proplus';
  buttonText: string;
  highlighted?: boolean;
  interval?: BillingInterval;
  isCurrentPlan?: boolean;
}

export function PlanPurchaseButton({
  planId,
  buttonText,
  highlighted,
  interval = 'month',
  isCurrentPlan = false,
}: PlanPurchaseButtonProps) {
  const router = useRouter();
  const pathname = (usePathname() as string | null) ?? '';
  const { isAuthenticated } = useAuthStore();
  const { createCheckoutSession } = useCreemPayment();
  const [isProcessing, setIsProcessing] = useState(false);

  const pathSegments = pathname.split('/').filter(Boolean);
  const localeSegment = useMemo(() => {
    const candidate = pathSegments[0];
    if (!candidate) return null;
    const supportedLocales = routing.locales as readonly string[];
    return supportedLocales.includes(candidate) ? candidate : null;
  }, [pathSegments]);
  const localePrefix = localeSegment ? `/${localeSegment}` : '';

  const buildLocalizedPath = (target: string) => {
    if (!target.startsWith('/')) {
      target = `/${target}`;
    }
    return `${localePrefix}${target}`.replace('//', '/');
  };

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/creem/subscription', {
        credentials: 'include',
        cache: 'no-store', // Always fetch fresh data
      });

      if (!response.ok) {
        // If 401, user is not authenticated (shouldn't happen here, but handle it)
        if (response.status === 401) {
          return null;
        }
        // For other errors, log but don't fail - let checkout handle it
        console.warn('[Pricing] Subscription API returned non-OK status:', response.status);
        return null;
      }

      const data = await response.json();
      const subscription = data.subscription || null;

      // Log for debugging
      if (subscription) {
        console.log('[Pricing] Found subscription:', {
          planId: subscription.planId,
          status: subscription.status,
          subscriptionId: subscription.subscriptionId,
        });
      } else {
        console.log('[Pricing] No subscription found');
      }

      return subscription;
    } catch (error) {
      console.error('[Pricing] Failed to check subscription status', error);
      return null;
    }
  };

  const handleClick = async () => {
    if (planId === 'free') {
      router.push(buildLocalizedPath('/signup'));
      return;
    }

    if (!isAuthenticated) {
      router.push(buildLocalizedPath('/login'));
      return;
    }

    try {
      setIsProcessing(true);

      // Always check subscription status first
      const subscription = await fetchSubscription();
      const activeStatuses = new Set(['active', 'trialing', 'past_due']);
      const normalizedPlanName = subscription?.planName?.toLowerCase() || '';
      const normalizedPlan =
        subscription?.planId ||
        (normalizedPlanName.includes('proplus')
          ? 'proplus'
          : normalizedPlanName.includes('pro')
            ? 'pro'
            : 'free');
      const normalizedInterval = subscription?.interval === 'year' ? 'year' : 'month';
      const subscriptionActive =
        subscription?.subscriptionId &&
        normalizedPlan !== 'free' &&
        activeStatuses.has(subscription.status);

      // If user has an active subscription, ALWAYS redirect to billing page
      // NEVER try to create a new checkout
      if (subscriptionActive) {
        if (normalizedPlan === planId && normalizedInterval === interval) {
          toast.info('You already have this subscription. Manage it in Billing.');
          router.push(buildLocalizedPath('/settings/billing'));
          setIsProcessing(false);
          return;
        }

        const planPriority: Record<'free' | 'pro' | 'proplus', number> = {
          free: 0,
          pro: 1,
          proplus: 2,
        };
        const targetRank = planPriority[planId];
        const currentRank = planPriority[normalizedPlan as 'free' | 'pro' | 'proplus'];
        const planChangeType = targetRank > currentRank ? 'upgrade' : 'downgrade';

        const params = new URLSearchParams({
          source: 'pricing',
          planChange: planId,
          planChangeType,
        });

        // Redirect to billing page where the upgrade will be handled
        router.push(buildLocalizedPath(`/settings/billing?${params.toString()}`));
        setIsProcessing(false);
        return;
      }

      // Only create checkout if user doesn't have an active subscription
      // This should only happen for new users or users with canceled subscriptions
      try {
        await createCheckoutSession({
          planId,
          interval,
        });
      } catch (checkoutError) {
        const message =
          checkoutError instanceof Error ? checkoutError.message : 'Failed to start checkout';

        // If error is about active subscription, redirect to billing page
        if (
          message.includes('already have an active subscription') ||
          message.includes('ACTIVE_SUBSCRIPTION_EXISTS')
        ) {
          const _planPriority: Record<'free' | 'pro' | 'proplus', number> = {
            free: 0,
            pro: 1,
            proplus: 2,
          };
          const params = new URLSearchParams({
            source: 'pricing',
            planChange: planId,
            planChangeType: 'upgrade',
          });
          router.push(buildLocalizedPath(`/settings/billing?${params.toString()}`));
          setIsProcessing(false);
          return;
        }

        throw checkoutError; // Re-throw if it's a different error
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start checkout';

      // Final fallback: if error is about active subscription, redirect to billing page
      if (
        message.includes('already have an active subscription') ||
        message.includes('ACTIVE_SUBSCRIPTION_EXISTS')
      ) {
        const params = new URLSearchParams({
          source: 'pricing',
          planChange: planId,
          planChangeType: 'upgrade',
        });
        router.push(buildLocalizedPath(`/settings/billing?${params.toString()}`));
        setIsProcessing(false);
        return;
      }

      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const highlightedClass = highlighted
    ? 'bg-purple-600 hover:bg-purple-700 text-white'
    : 'bg-gray-800 hover:bg-gray-900 text-white';

  return (
    <Button
      className={`w-full ${isProcessing ? 'opacity-90' : ''} ${highlightedClass}`}
      size="lg"
      onClick={handleClick}
      disabled={isProcessing || isCurrentPlan}
    >
      {isProcessing ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing...
        </span>
      ) : isCurrentPlan ? (
        'Current plan'
      ) : (
        buttonText
      )}
    </Button>
  );
}
