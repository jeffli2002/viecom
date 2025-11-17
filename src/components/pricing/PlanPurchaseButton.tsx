'use client';

import { Button } from '@/components/ui/button';
import { useCreemPayment } from '@/hooks/use-creem-payment';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

type BillingInterval = 'month' | 'year';

interface PlanPurchaseButtonProps {
  planId: string;
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
  const locale = pathSegments[0] || 'en';

  const hasActiveSubscription = async () => {
    try {
      const response = await fetch('/api/creem/subscription', { credentials: 'include' });
      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const subscription = data.subscription;
      if (!subscription) {
        return false;
      }

      const normalizedPlanName = subscription.planName?.toLowerCase();
      const normalizedPlanId =
        subscription.planId ||
        (normalizedPlanName?.includes('proplus')
          ? 'proplus'
          : normalizedPlanName?.includes('pro')
            ? 'pro'
            : undefined);

      const normalizedInterval = subscription.interval === 'year' ? 'year' : 'month';

      const isSubscriptionActive =
        subscription.status === 'active' || subscription.status === 'trialing';

      if (isSubscriptionActive && normalizedPlanId === planId && normalizedInterval === interval) {
        toast.info('You already have this subscription. Manage it in Billing.');
        return true;
      }
    } catch (error) {
      console.error('[Pricing] Failed to check subscription status', error);
    }
    return false;
  };

  const handleClick = async () => {
    if (planId === 'free') {
      router.push(`/${locale}/signup`);
      return;
    }

    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }

    if (planId !== 'pro' && planId !== 'proplus') {
      toast.error('Selected plan is not available at the moment.');
      return;
    }

    try {
      setIsProcessing(true);
      const alreadyActive = await hasActiveSubscription();
      if (alreadyActive) {
        setIsProcessing(false);
        return;
      }

      await createCheckoutSession({
        planId,
        interval,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start checkout';
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
