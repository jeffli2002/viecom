'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useCreemPayment } from '@/hooks/use-creem-payment';
import { useAuthStore } from '@/store/auth-store';
import { Calendar, Check, CreditCard, Loader2, RefreshCcw, TrendingUp } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type PlanId = 'pro' | 'proplus';

interface ScheduledPlanChange {
  planId: PlanId;
  interval: 'month' | 'year';
  takesEffectAt?: string | null;
  changeType?: 'upgrade' | 'downgrade';
}

export interface BillingPlan {
  id: PlanId;
  name: string;
  description: string;
  price: number;
  yearlyPrice?: number;
  features: string[];
  popular?: boolean;
  creditsPerInterval: {
    month: number;
    year: number;
  };
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
  upcomingPlan?: ScheduledPlanChange | null;
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
  const [planChangeNotice, setPlanChangeNotice] = useState<{
    type: 'upgrade' | 'downgrade';
    planId?: PlanId | null;
  } | null>(null);

  const fetchSubscription = useCallback(async () => {
    console.log('[Billing] Fetching subscription...');
    setLoading(true);
    try {
      const response = await fetch('/api/creem/subscription', {
        credentials: 'include',
      });
      if (response.status === 401) {
        if (isAuthenticated) {
          toast.error('Session expired. Please sign in again.');
          router.push('/login');
        }
        setSubscription(null);
        return;
      }
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.warn('[Billing] Failed to load subscription', data);
        setSubscription(null);
        return;
      }

      setSubscription(data.subscription || null);

      // Debug: Log subscription data to help diagnose notification display issues
      if (data.subscription) {
        console.log('[Billing] Subscription data received:', {
          id: data.subscription.id,
          subscriptionId: data.subscription.subscriptionId,
          planName: data.subscription.planName,
          planId: data.subscription.planId,
          status: data.subscription.status,
          upcomingPlan: data.subscription.upcomingPlan,
          hasUpcomingPlan: Boolean(data.subscription.upcomingPlan),
        });

        // Warn if subscriptionId is missing
        if (!data.subscription.subscriptionId) {
          console.warn(
            '[Billing] WARNING: subscriptionId is missing! This will cause upgrade/downgrade to fail.'
          );
        }
      }
    } catch (error) {
      console.error('[Billing] Error fetching subscription', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, router]);

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

  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !subscription) {
      return;
    }

    const planChangeParam = searchParams.get('planChange') as PlanId | null;
    const planChangeTypeParam = searchParams.get('planChangeType');
    const sourceParam = searchParams.get('source');

    if (planChangeParam && sourceParam === 'pricing') {
      const normalizedType: 'upgrade' | 'downgrade' =
        planChangeTypeParam === 'downgrade' ? 'downgrade' : 'upgrade';

      // Auto-trigger upgrade/downgrade when coming from pricing page
      const currentPlanId = (subscription?.planId ?? 'free') as 'free' | PlanId;
      const targetPlanId = planChangeParam;

      // Only auto-trigger if it's a different plan
      if (currentPlanId !== targetPlanId && subscription?.subscriptionId) {
        // Small delay to ensure UI is ready
        const timer = setTimeout(async () => {
          try {
            setActionLoading(true);
            const currentRank = planPriority[currentPlanId];
            const targetRank = planPriority[targetPlanId];
            const isUpgradeFlow = targetRank >= currentRank;
            const endpoint = isUpgradeFlow ? 'upgrade' : 'downgrade';
            const payload = isUpgradeFlow
              ? {
                  newPlanId: targetPlanId,
                  newInterval: interval,
                  useProration: false,
                }
              : {
                  newPlanId: targetPlanId === 'proplus' ? 'pro' : targetPlanId,
                  newInterval: interval,
                  scheduleAtPeriodEnd: true,
                };

            if (!subscription.subscriptionId) {
              throw new Error('Subscription ID is missing');
            }

            console.log('[Billing] Sending upgrade/downgrade request:', {
              subscriptionId: subscription.subscriptionId,
              endpoint,
              payload,
            });

            const response = await fetch(
              `/api/creem/subscription/${subscription.subscriptionId}/${endpoint}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(payload),
              }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok || data.success === false) {
              console.error('[Billing] Upgrade/downgrade failed:', {
                status: response.status,
                statusText: response.statusText,
                error: data.error,
                data,
              });

              // Provide more specific error messages
              let errorMessage =
                data.error ||
                (isUpgradeFlow ? 'Failed to schedule upgrade' : 'Failed to schedule downgrade');

              if (response.status === 403) {
                errorMessage =
                  'Forbidden: You do not have permission to modify this subscription. Please contact support.';
              } else if (response.status === 404) {
                errorMessage = 'Subscription not found. Please refresh the page and try again.';
              } else if (response.status === 401) {
                errorMessage = 'Unauthorized: Please log in again.';
              }

              throw new Error(errorMessage);
            }

            toast.success(
              data.message ||
                (isUpgradeFlow
                  ? 'Your plan will upgrade at the end of the current period'
                  : 'Your plan will downgrade at the end of the current period')
            );

            // Set plan change notice immediately
            setPlanChangeNotice({ type: normalizedType, planId: targetPlanId });

            // Refresh subscription data to get updated scheduled fields
            // Add a small delay to ensure database update is complete
            setTimeout(async () => {
              console.log('[Billing] Refreshing subscription after upgrade...');
              await fetchSubscription();
              console.log('[Billing] Subscription refreshed, checking for upcomingPlan...');
            }, 1000);
          } catch (error) {
            console.error('[Billing] Auto-upgrade failed:', error);
            const message =
              error instanceof Error ? error.message : 'Failed to update subscription';
            toast.error(message);
            // Still show the notice even if auto-upgrade fails
            setPlanChangeNotice({ type: normalizedType, planId: targetPlanId });
          } finally {
            setActionLoading(false);
          }
        }, 500);

        // Clean up URL params
        if (pathname) {
          const params = new URLSearchParams(searchParams);
          params.delete('planChange');
          params.delete('planChangeType');
          params.delete('source');
          const query = params.toString();
          router.replace(query ? `${pathname}?${query}` : pathname);
        }

        return () => clearTimeout(timer);
      }
      // Just show notice if already on the same plan
      setPlanChangeNotice({ type: normalizedType, planId: targetPlanId });

      if (pathname) {
        const params = new URLSearchParams(searchParams);
        params.delete('planChange');
        params.delete('planChangeType');
        params.delete('source');
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname);
      }
    }
  }, [
    searchParams,
    isInitialized,
    isAuthenticated,
    subscription,
    pathname,
    router,
    interval,
    fetchSubscription,
  ]);

  const planPriority: Record<'free' | PlanId, number> = {
    free: 0,
    pro: 1,
    proplus: 2,
  };
  const activeStatuses = new Set(['active', 'trialing', 'past_due']);

  const handleUpgrade = async (planId: PlanId) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const currentPlanId = (subscription?.planId ?? 'free') as 'free' | PlanId;
    const hasManagedSubscription =
      !!subscription?.subscriptionId &&
      !!subscription.planId &&
      subscription.planId !== 'free' &&
      subscription.status &&
      activeStatuses.has(subscription.status);

    try {
      setActionLoading(true);

      if (hasManagedSubscription && subscription?.subscriptionId) {
        const currentRank = planPriority[currentPlanId];
        const targetRank = planPriority[planId];
        const isUpgradeFlow = targetRank >= currentRank;
        const endpoint = isUpgradeFlow ? 'upgrade' : 'downgrade';
        const payload = isUpgradeFlow
          ? {
              newPlanId: planId,
              newInterval: interval,
              useProration: false,
            }
          : {
              newPlanId: planId === 'proplus' ? 'pro' : planId,
              newInterval: interval,
              scheduleAtPeriodEnd: true,
            };

        console.log('[Billing] Sending upgrade/downgrade request (manual):', {
          subscriptionId: subscription.subscriptionId,
          endpoint,
          payload,
        });

        const response = await fetch(
          `/api/creem/subscription/${subscription.subscriptionId}/${endpoint}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(payload),
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.success === false) {
          console.error('[Billing] Upgrade/downgrade failed (manual):', {
            status: response.status,
            statusText: response.statusText,
            error: data.error,
            data,
          });

          // Provide more specific error messages
          let errorMessage =
            data.error ||
            (isUpgradeFlow ? 'Failed to schedule upgrade' : 'Failed to schedule downgrade');

          if (response.status === 403) {
            errorMessage =
              'Forbidden: You do not have permission to modify this subscription. Please contact support.';
          } else if (response.status === 404) {
            errorMessage = 'Subscription not found. Please refresh the page and try again.';
          } else if (response.status === 401) {
            errorMessage = 'Unauthorized: Please log in again.';
          }

          throw new Error(errorMessage);
        }

        toast.success(
          data.message ||
            (isUpgradeFlow
              ? 'Your plan will upgrade at the end of the current period'
              : 'Your plan will downgrade at the end of the current period')
        );
        await fetchSubscription();
        return;
      }

      await createCheckoutSession({
        planId,
        interval,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update subscription';
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
  const scheduledPlanChange = subscription?.upcomingPlan ?? null;
  const scheduledPlanDetails = useMemo(() => {
    if (!scheduledPlanChange) {
      console.log('[Billing] No scheduled plan change found');
      return null;
    }
    console.log('[Billing] Scheduled plan change found:', scheduledPlanChange);
    const plan = plans.find((p) => p.id === scheduledPlanChange.planId);
    if (!plan) {
      console.warn('[Billing] Plan not found for scheduled change:', scheduledPlanChange.planId);
      return null;
    }
    const price =
      scheduledPlanChange.interval === 'year' ? (plan.yearlyPrice ?? null) : (plan.price ?? null);
    const credits =
      scheduledPlanChange.interval === 'year'
        ? plan.creditsPerInterval.year
        : plan.creditsPerInterval.month;
    const takesEffectAt = scheduledPlanChange.takesEffectAt || subscription?.periodEnd || undefined;
    const details = {
      plan,
      price,
      credits,
      takesEffectAt,
      interval: scheduledPlanChange.interval,
    };
    console.log('[Billing] Scheduled plan details:', details);
    return details;
  }, [scheduledPlanChange, plans, subscription?.periodEnd]);

  const planChangeAlert = useMemo(() => {
    if (!planChangeNotice) {
      return null;
    }

    const fallbackPlan = planChangeNotice.planId
      ? plans.find((p) => p.id === planChangeNotice.planId)
      : null;
    const matchesScheduled =
      scheduledPlanChange?.planId && planChangeNotice.planId
        ? scheduledPlanChange.planId === planChangeNotice.planId
        : false;
    const effectiveDate = matchesScheduled
      ? scheduledPlanDetails?.takesEffectAt || subscription?.periodEnd || null
      : subscription?.periodEnd || null;
    const price = matchesScheduled
      ? scheduledPlanDetails?.price
      : fallbackPlan
        ? fallbackPlan.price
        : null;
    const credits = matchesScheduled
      ? scheduledPlanDetails?.credits
      : fallbackPlan
        ? fallbackPlan.creditsPerInterval.month
        : null;
    const intervalLabel = matchesScheduled
      ? scheduledPlanDetails?.interval === 'year'
        ? 'year'
        : 'month'
      : 'billing cycle';

    return {
      planName: fallbackPlan?.name || planChangeNotice.planId?.toUpperCase(),
      price,
      credits,
      effectiveDate,
      intervalLabel,
    };
  }, [planChangeNotice, scheduledPlanDetails, scheduledPlanChange, plans, subscription?.periodEnd]);

  const hasScheduledChange = Boolean(scheduledPlanDetails);
  const hasScheduledCancellation = Boolean(subscription?.cancelAtPeriodEnd);
  const nextRenewalDate = formatDate(subscription?.periodEnd);
  const scheduledIntervalLabel =
    scheduledPlanChange?.interval && intervalLabels[scheduledPlanChange.interval]
      ? intervalLabels[scheduledPlanChange.interval]
      : scheduledPlanChange?.interval || '';
  const currentStatusLabel = subscription?.status
    ? statusLabels[subscription.status] || subscription.status
    : 'No subscription';

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div>
        <p className="text-sm font-semibold text-teal-500">Billing & Subscription</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Manage your plan</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          View your current subscription, manage payment methods, and upgrade or downgrade plans.
        </p>
      </div>

      {/* Show upgrade notice at the top if there's a scheduled plan change */}
      {hasScheduledChange && scheduledPlanDetails && (
        <Alert className="border-teal-400 dark:border-teal-600 bg-gradient-to-r from-purple-50 to-violet-50 shadow-lg">
          <AlertTitle className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <TrendingUp className="h-5 w-5 text-teal-500" />
            Plan Upgrade Scheduled: {scheduledPlanDetails.plan.name}
          </AlertTitle>
          <AlertDescription className="mt-2 text-base text-purple-800">
            <p className="font-semibold mb-2">
              Your subscription will upgrade to{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {scheduledPlanDetails.plan.name}
              </span>{' '}
              on:
            </p>
            <p className="mb-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-teal-100 dark:bg-teal-900/30 text-slate-900 dark:text-white font-bold text-lg">
                <Calendar className="h-4 w-4" />
                {formatDate(scheduledPlanDetails.takesEffectAt || subscription?.periodEnd)}
              </span>
            </p>
            <div className="space-y-1 text-sm">
              <p>
                • Billing cycle:{' '}
                <span className="font-medium">{scheduledIntervalLabel || 'Custom billing'}</span>
              </p>
              <p>
                • Price:{' '}
                <span className="font-medium">
                  {scheduledPlanDetails.price
                    ? `$${scheduledPlanDetails.price.toFixed(2)}`
                    : 'Standard rate'}
                </span>
              </p>
              <p>
                • Credits per cycle:{' '}
                <span className="font-medium">{scheduledPlanDetails.credits}</span>
              </p>
            </div>
            <p className="mt-3 pt-3 border-t border-teal-200 dark:border-teal-800 text-sm">
              Your current <span className="font-medium">{subscription?.planName || 'plan'}</span>{' '}
              remains active until then.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Show temporary notice if plan change was just requested */}
      {planChangeNotice && !hasScheduledChange && (
        <Alert className="border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 text-slate-900 dark:text-white">
          <AlertTitle>
            {planChangeNotice.type === 'upgrade'
              ? `Upgrade scheduled${planChangeAlert?.planName ? `: ${planChangeAlert.planName}` : ''}`
              : `Downgrade scheduled${planChangeAlert?.planName ? `: ${planChangeAlert.planName}` : ''}`}
          </AlertTitle>
          <AlertDescription>
            {planChangeAlert ? (
              <>
                {planChangeNotice.type === 'upgrade' ? 'Your upgrade to ' : 'Your downgrade to '}
                <span className="font-medium">{planChangeAlert.planName || 'the new plan'}</span>{' '}
                will take effect{' '}
                {planChangeAlert.effectiveDate ? (
                  <>
                    on{' '}
                    <span className="font-medium">{formatDate(planChangeAlert.effectiveDate)}</span>
                  </>
                ) : (
                  'at the start of your next billing cycle'
                )}
                . We'll automatically charge{' '}
                {planChangeAlert.price
                  ? `$${planChangeAlert.price.toFixed(2)}`
                  : 'the standard rate'}{' '}
                and add{' '}
                {planChangeAlert.credits ? (
                  <span className="font-medium">{planChangeAlert.credits}</span>
                ) : (
                  "the plan's allotted"
                )}{' '}
                credits for that {planChangeAlert.intervalLabel || 'cycle'}. Your current plan stays
                active until then.
              </>
            ) : (
              <>
                Your plan change request was received. Please refresh in a moment to see the
                schedule.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

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
            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading subscription...
            </div>
          ) : subscription ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Plan</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {subscription.planName || 'Creem Subscription'}
                  </p>
                  {subscription.interval && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {intervalLabels[subscription.interval] || subscription.interval}
                    </p>
                  )}
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {currentStatusLabel}
                  </p>
                  {hasScheduledCancellation && (
                    <p className="text-xs text-orange-600">Scheduled to cancel at period end</p>
                  )}
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Next renewal</p>
                  {subscription.periodEnd ? (
                    <>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                        {nextRenewalDate}
                      </p>
                      {subscription.interval && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {intervalLabels[subscription.interval] || subscription.interval}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Not applicable
                    </p>
                  )}
                </div>
              </div>

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
                    onClick={() => router.push('/pricing')}
                    disabled={actionLoading}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Change Plan
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
            <p className="text-sm text-slate-600 dark:text-slate-400">
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
            <span className="text-sm text-slate-600 dark:text-slate-400">Monthly</span>
            <Switch
              checked={interval === 'year'}
              onCheckedChange={(checked: boolean) => setInterval(checked ? 'year' : 'month')}
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">Yearly</span>
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
                    plan.popular
                      ? 'border-teal-500 shadow-lg'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">
                        {plan.name}
                      </p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">
                        {plan.description}
                      </p>
                    </div>
                    {plan.popular && <Badge className="bg-teal-500 text-white">Most Popular</Badge>}
                  </div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-slate-900 dark:text-white">
                      {priceLabel}
                    </span>
                    {displayPrice && displayPrice > 0 && (
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        /{interval === 'year' ? 'year' : 'month'}
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
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
