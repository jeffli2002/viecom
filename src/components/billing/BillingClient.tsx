'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useCreemPayment } from '@/hooks/use-creem-payment';
import { useAuthStore } from '@/store/auth-store';
import { Check, CreditCard, Loader2, RefreshCcw } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type PlanId = 'pro' | 'proplus';

export interface BillingPlan {
  id: PlanId;
  name: string;
  description: string;
  price: number;
  yearlyPrice?: number;
  features: string[];
  popular?: boolean;
}

interface SubscriptionSummary {
  id: string;
  subscriptionId?: string | null;
  planId?: PlanId | 'free' | null;
  planName?: string | null;
  priceId?: string;
  status: string;
  interval: 'month' | 'year' | null;
  periodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
}

interface BillingClientProps {
  plans: BillingPlan[];
}

const statusLabels: Record<string, string> = {
  active: 'Active',
  trialing: 'Trialing',
  canceled: 'Canceled',
  past_due: 'Past Due',
  unpaid: 'Unpaid',
};

const intervalLabels: Record<'month' | 'year', string> = {
  month: 'Monthly',
  year: 'Yearly',
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const BillingClient = ({ plans }: BillingClientProps) => {
  const router = useRouter();
  const { createCheckoutSession, openCustomerPortal } = useCreemPayment();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [isSyncingCheckout, setIsSyncingCheckout] = useState(false);

  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/creem/subscription', {
        credentials: 'include',
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load subscription');
      }

      setSubscription(data.subscription || null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load subscription';
      toast.error(message);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    void fetchSubscription();
  }, [fetchSubscription, isAuthenticated, isInitialized, router]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) {
      return;
    }

    const successFlag = searchParams.get('success');
    const subscriptionId = searchParams.get('subscription_id');
    const productId = searchParams.get('product_id');
    const customerId = searchParams.get('customer_id');
    const checkoutId = searchParams.get('checkout_id');

    if (successFlag === 'true' && subscriptionId && !isSyncingCheckout) {
      setIsSyncingCheckout(true);
      fetch('/api/creem/sync-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subscriptionId,
          productId,
          customerId,
          checkoutId,
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to sync subscription');
          }
        })
        .then(async () => {
          toast.success('Subscription data synced');
          await fetchSubscription();
        })
        .catch((error) => {
          toast.error(
            error instanceof Error ? error.message : 'Failed to sync subscription. Please refresh.'
          );
        })
        .finally(() => {
          setIsSyncingCheckout(false);
          if (pathname) {
            router.replace(pathname);
          }
        });
    }
  }, [
    searchParams,
    isInitialized,
    isAuthenticated,
    isSyncingCheckout,
    fetchSubscription,
    router,
    pathname,
  ]);

  const handleUpgrade = async (planId: PlanId) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      setActionLoading(true);
      await createCheckoutSession({
        planId,
        interval,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start checkout';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCustomerPortal = async () => {
    try {
      setActionLoading(true);
      await openCustomerPortal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to open customer portal';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDowngradeToFree = async (scheduleAtPeriodEnd = true) => {
    if (!subscription?.subscriptionId) {
      toast.error('No active subscription to downgrade.');
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(
        `/api/creem/subscription/${subscription.subscriptionId}/downgrade`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            newPlanId: 'free',
            newInterval: subscription.interval || 'month',
            scheduleAtPeriodEnd,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subscription');
      }

      toast.success(data.message || 'Subscription updated');
      await fetchSubscription();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update subscription';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!subscription?.subscriptionId) {
      toast.error('No subscription to reactivate.');
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(
        `/api/creem/subscription/${subscription.subscriptionId}/reactivate`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate subscription');
      }

      toast.success('Subscription reactivated');
      await fetchSubscription();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reactivate subscription';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const normalizedPlanId = useMemo(() => {
    if (subscription?.planId === 'pro' || subscription?.planId === 'proplus') {
      return subscription.planId;
    }
    if (subscription?.planName?.toLowerCase().includes('pro+')) {
      return 'proplus';
    }
    if (subscription?.planName?.toLowerCase().includes('pro')) {
      return 'pro';
    }
    return null;
  }, [subscription]);

  const isCurrentPlan = (planId: PlanId) => normalizedPlanId === planId;

  const hasScheduledChange = Boolean(subscription?.cancelAtPeriodEnd);
  const nextRenewalDate = formatDate(subscription?.periodEnd);
  const currentStatusLabel = subscription?.status
    ? statusLabels[subscription.status] || subscription.status
    : 'No subscription';

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div>
        <p className="text-sm font-semibold text-purple-600">Billing & Subscription</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Manage your plan</h1>
        <p className="mt-1 text-gray-600">
          View your current subscription, manage payment methods, and upgrade or downgrade plans.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">Current subscription</CardTitle>
            <CardDescription>
              {subscription
                ? `You are on the ${subscription.planName || 'Creem'} plan`
                : 'No active Creem subscription found'}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSubscription()}
            disabled={loading || actionLoading}
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading subscription...
            </div>
          ) : subscription ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-gray-500">Plan</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {subscription.planName || 'Creem Subscription'}
                  </p>
                  {subscription.interval && (
                    <p className="text-xs text-gray-500">
                      {intervalLabels[subscription.interval] || subscription.interval}
                    </p>
                  )}
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="mt-1 font-semibold text-gray-900">{currentStatusLabel}</p>
                  {isDowngraded && (
                    <p className="text-xs text-orange-600">Scheduled to cancel at period end</p>
                  )}
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-gray-500">Next renewal</p>
                  {subscription.periodEnd ? (
                    <>
                      <p className="mt-1 font-semibold text-gray-900">{nextRenewalDate}</p>
                      {subscription.interval && (
                        <p className="text-xs text-gray-500">
                          {intervalLabels[subscription.interval] || subscription.interval}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">Not applicable</p>
                  )}
                </div>
              </div>

              {hasScheduledChange && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">Plan change scheduled</p>
                  <p className="mt-1">
                    Your current {subscription.planName || 'plan'} stays active until{' '}
                    <span className="font-medium">{nextRenewalDate}</span>. The new subscription
                    will take effect right after this billing period ends.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleCustomerPortal}
                  disabled={actionLoading}
                  className="flex items-center gap-2"
                  variant="secondary"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Manage payment method
                </Button>

                {!hasScheduledChange && (
                  <Button
                    variant="outline"
                    onClick={() => handleDowngradeToFree(true)}
                    disabled={actionLoading}
                  >
                    Schedule downgrade to Free
                  </Button>
                )}

                {hasScheduledChange && (
                  <Button variant="outline" onClick={handleReactivate} disabled={actionLoading}>
                    Keep current plan
                  </Button>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600">
              No active Creem subscription found. Choose a plan below to get started.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="items-start gap-4 md:flex md:items-center md:justify-between">
          <div>
            <CardTitle>Available plans</CardTitle>
            <CardDescription>
              Switch plans at any time. Changes apply at the start of your next billing period so
              you can finish the current cycle before moving.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 rounded-full border px-4 py-2">
            <span className="text-sm text-gray-600">Monthly</span>
            <Switch
              checked={interval === 'year'}
              onCheckedChange={(checked: boolean) => setInterval(checked ? 'year' : 'month')}
            />
            <span className="text-sm text-gray-600">Yearly</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {plans.map((plan) => {
              const isCurrent = isCurrentPlan(plan.id);
              const displayPrice = interval === 'year' ? plan.yearlyPrice : plan.price;
              const priceLabel =
                displayPrice && displayPrice > 0 ? `$${displayPrice.toFixed(2)}` : 'Contact us';

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-6 ${
                    plan.popular ? 'border-purple-500 shadow-lg' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase text-gray-500">{plan.name}</p>
                      <p className="text-xl font-bold text-gray-900">{plan.description}</p>
                    </div>
                    {plan.popular && (
                      <Badge className="bg-purple-600 text-white">Most Popular</Badge>
                    )}
                  </div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900">{priceLabel}</span>
                    {displayPrice && displayPrice > 0 && (
                      <span className="text-sm text-gray-500">
                        /{interval === 'year' ? 'year' : 'month'}
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-gray-500">
                    {interval === 'year' ? 'Billed annually' : 'Billed monthly'}
                  </p>

                  <Separator className="my-4" />

                  <ul className="space-y-2">
                    {plan.features.slice(0, 5).map((feature) => (
                      <li key={`${plan.id}-${feature}`} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="mt-6 w-full"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrent || actionLoading}
                  >
                    {isCurrent ? 'Current plan' : `Choose ${plan.name}`}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingClient;
