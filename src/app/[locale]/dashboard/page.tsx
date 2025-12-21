// @ts-nocheck
'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { creditsConfig } from '@/config/credits.config';
import { paymentConfig } from '@/config/payment.config';
import { useSubscription } from '@/hooks/use-subscription';
import { Link, useRouter } from '@/i18n/navigation';
import { resolvePlanByIdentifier, resolvePlanByProductId } from '@/lib/creem/plan-utils';
import { useAuthStore } from '@/store/auth-store';
import { formatDistance } from 'date-fns';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Coins,
  CreditCard,
  History,
  ImageIcon,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Video,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

export const dynamic = 'force-dynamic';

interface CreditBalance {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  frozenBalance: number;
  availableBalance: number;
}

interface QuotaUsage {
  storage: {
    used: number;
    limit: number;
    isUnlimited: boolean;
  };
  imageGeneration?: {
    daily: {
      used: number;
      limit: number;
      isUnlimited: boolean;
    };
    monthly: {
      used: number;
      limit: number;
      isUnlimited: boolean;
    };
  };
  videoGeneration?: {
    daily: {
      used: number;
      limit: number;
      isUnlimited: boolean;
    };
    monthly: {
      used: number;
      limit: number;
      isUnlimited: boolean;
    };
  };
  imageExtraction?: {
    daily: {
      used: number;
      limit: number;
      isUnlimited: boolean;
    };
    monthly: {
      used: number;
      limit: number;
      isUnlimited: boolean;
    };
  };
}

interface CreditTransaction {
  id: string;
  type: 'earn' | 'spend' | 'refund' | 'admin_adjust' | 'freeze' | 'unfreeze';
  amount: number;
  source: 'subscription' | 'api_call' | 'admin' | 'storage' | 'bonus';
  description?: string;
  balanceAfter: number;
  createdAt: Date;
}

const formatDateDisplay = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

function DashboardPageContent() {
  const t = useTranslations('dashboard');
  const {
    isAuthenticated,
    user,
    isInitialized: authInitialized,
    isLoading: authLoading,
  } = useAuthStore();
  const router = useRouter();
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [quotaUsage, setQuotaUsage] = useState<QuotaUsage | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { planId, loading: subLoading, upcomingPlan } = useSubscription();
  const scheduledPlanDetails = useMemo(() => {
    if (!upcomingPlan || !upcomingPlan.planId || !upcomingPlan.interval) {
      return null;
    }
    const plan = paymentConfig.plans.find((p) => p.id === upcomingPlan.planId);
    if (!plan) {
      return null;
    }
    const price =
      upcomingPlan.interval === 'year' ? (plan.yearlyPrice ?? null) : (plan.price ?? null);
    const credits =
      upcomingPlan.interval === 'year'
        ? (plan.credits.monthly ?? 0) * 12
        : (plan.credits.monthly ?? 0);
    return {
      planName: plan.name,
      interval: upcomingPlan.interval,
      price,
      credits,
      takesEffectAt: upcomingPlan.takesEffectAt || null,
    };
  }, [upcomingPlan]);

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch credit balance
      const balanceResponse = await fetch('/api/credits/balance', {
        credentials: 'include',
      });
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        if (balanceData.success && balanceData.data) {
          setCreditBalance(balanceData.data);
        }
      }

      // Fetch quota usage
      const quotaResponse = await fetch('/api/credits/quota', {
        credentials: 'include',
      });
      if (quotaResponse.ok) {
        const quotaData = await quotaResponse.json();
        if (quotaData.success && quotaData.data) {
          setQuotaUsage(quotaData.data);
        }
      }

      // Fetch credit history
      const historyResponse = await fetch('/api/credits/history?limit=10', {
        credentials: 'include',
      });
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        if (historyData.success && historyData.data) {
          setTransactions(historyData.data);
        }
      }

      // Subscription info is provided by useSubscription hook
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authInitialized) {
      return;
    }

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchDashboardData();
  }, [authInitialized, isAuthenticated, router, fetchDashboardData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earn':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'spend':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      case 'refund':
        return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-slate-500 dark:text-slate-400" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earn':
        return 'text-green-600';
      case 'spend':
        return 'text-red-600';
      case 'refund':
        return 'text-blue-600';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const shouldShowQuota = (quota?: { used: number; limit: number; isUnlimited: boolean }) => {
    if (!quota) return false;
    if (quota.isUnlimited) return true;
    const limit = quota.limit ?? 0;
    const used = quota.used ?? 0;
    return limit > 0 || used > 0;
  };

  const calculateUsagePercent = (quota?: { used: number; limit: number }) => {
    if (!quota || !quota.limit || quota.limit <= 0) return 0;
    return Math.min(100, ((quota.used || 0) / quota.limit) * 100);
  };

  const imageCredits = creditsConfig.consumption.imageGeneration['nano-banana'];
  const videoCredits = creditsConfig.consumption.videoGeneration['sora-2-720p-15s'];

  if (authLoading || isLoading || subLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container-base space-y-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="h2-section mb-2">{t('title')}</h1>
          <p className="text-body">
            {t('welcome')}, {user?.name || user?.email}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </Button>
      </div>

      {scheduledPlanDetails && (
        <Alert className="border-teal-300 dark:border-teal-800 bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 shadow-lg">
          <AlertTitle className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <TrendingUp className="h-5 w-5 text-teal-500" />
            {t('planUpgradeScheduled', { planName: scheduledPlanDetails.planName })}
          </AlertTitle>
          <AlertDescription className="mt-2 text-base text-slate-800 dark:text-slate-200">
            <p className="font-semibold mb-2">
              {t('upgradeScheduledDesc', { planName: scheduledPlanDetails.planName })}
            </p>
            <p className="mb-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-teal-100 dark:bg-teal-900/30 text-slate-900 dark:text-white font-bold text-lg">
                <Calendar className="h-4 w-4" />
                {formatDateDisplay(scheduledPlanDetails.takesEffectAt)}
              </span>
            </p>
            <div className="space-y-1 text-sm">
              <p>
                • {t('billingCycle')}
                <span className="font-medium">
                  {scheduledPlanDetails.interval === 'year' ? t('yearly') : t('monthly')}
                </span>
              </p>
              <p>
                • {t('price')}
                <span className="font-medium">
                  {scheduledPlanDetails.price
                    ? `$${scheduledPlanDetails.price.toFixed(2)}`
                    : t('standardRate')}
                </span>
              </p>
              <p>
                • {t('creditsPerCycle')}
                <span className="font-medium">{scheduledPlanDetails.credits}</span>
              </p>
            </div>
            <p className="mt-3 pt-3 border-t border-teal-200 dark:border-teal-800 text-sm">
              {t('currentPlanRemains', {
                planName: planId === 'proplus' ? 'Pro+' : planId === 'pro' ? 'Pro' : 'Free',
              })}
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Credit Balance Cards + Subscription */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="font-medium text-sm">{t('subscriptionPlan')}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {planId === 'free' ? t('free') : t('paid')}
              </CardDescription>
            </div>
            <div className="rounded-full bg-primary/10 p-2">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold capitalize">
                {planId === 'proplus' ? 'Pro Plus' : planId === 'pro' ? 'Pro' : 'Free'}
              </p>
              <Badge variant={planId === 'free' ? 'secondary' : 'default'}>
                {planId === 'free' ? t('free') : t('paid')}
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/settings/billing">{t('manageSubscription')}</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/pricing">{t('upgradeNow', { defaultValue: 'Upgrade Plan' })}</Link>
              </Button>
              <Button variant="secondary" className="w-full sm:col-span-2" asChild>
                <Link href="/pricing#credit-packs">
                  {t('buyCredits', { defaultValue: 'Buy Credits' })}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">{t('availableCredits')}</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{creditBalance?.availableBalance ?? 0}</div>
            <p className="text-muted-foreground text-xs">
              {t('creditsEstimate', {
                images: Math.floor((creditBalance?.availableBalance ?? 0) / imageCredits),
                videos: Math.floor((creditBalance?.availableBalance ?? 0) / videoCredits),
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">{t('totalEarned')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{creditBalance?.totalEarned ?? 0}</div>
            <p className="text-muted-foreground text-xs">{t('cumulativeEarned')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">{t('totalSpent')}</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{creditBalance?.totalSpent ?? 0}</div>
            <p className="text-muted-foreground text-xs">{t('cumulativeSpent')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quota Usage Section - Removed (no daily/monthly quotas) */}
      {false && quotaUsage && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Image Generation - Daily */}
          {quotaUsage.imageGeneration && shouldShowQuota(quotaUsage.imageGeneration.daily) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ImageIcon className="h-5 w-5 text-teal-500" />
                  {t('imageGenerationDaily')}
                </CardTitle>
                <CardDescription>{t('dailyLimit')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">{t('used')}</span>
                  <span className="font-medium text-sm">
                    {quotaUsage.imageGeneration.daily.used || 0} /{' '}
                    {quotaUsage.imageGeneration.daily.isUnlimited
                      ? '∞'
                      : quotaUsage.imageGeneration.daily.limit || 0}
                  </span>
                </div>
                {!quotaUsage.imageGeneration.daily.isUnlimited &&
                  (quotaUsage.imageGeneration.daily.limit || 0) > 0 && (
                    <Progress
                      value={calculateUsagePercent(quotaUsage.imageGeneration.daily)}
                      className="h-2"
                    />
                  )}
              </CardContent>
            </Card>
          )}

          {/* Video Generation - Daily */}
          {quotaUsage.videoGeneration && shouldShowQuota(quotaUsage.videoGeneration.daily) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Video className="h-5 w-5 text-blue-500" />
                  {t('videoGenerationDaily')}
                </CardTitle>
                <CardDescription>{t('dailyLimit')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">{t('used')}</span>
                  <span className="font-medium text-sm">
                    {quotaUsage.videoGeneration.daily.used || 0} /{' '}
                    {quotaUsage.videoGeneration.daily.isUnlimited
                      ? '∞'
                      : quotaUsage.videoGeneration.daily.limit || 0}
                  </span>
                </div>
                {!quotaUsage.videoGeneration.daily.isUnlimited &&
                  (quotaUsage.videoGeneration.daily.limit || 0) > 0 && (
                    <Progress
                      value={calculateUsagePercent(quotaUsage.videoGeneration.daily)}
                      className="h-2"
                    />
                  )}
              </CardContent>
            </Card>
          )}

          {/* Video Generation - Monthly */}
          {quotaUsage.videoGeneration && shouldShowQuota(quotaUsage.videoGeneration.monthly) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Video className="h-5 w-5 text-teal-500" />
                  {t('videoGenerationMonthly')}
                </CardTitle>
                <CardDescription>{t('monthlyLimit')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">{t('used')}</span>
                  <span className="font-medium text-sm">
                    {quotaUsage.videoGeneration.monthly.used || 0} /{' '}
                    {quotaUsage.videoGeneration.monthly.isUnlimited
                      ? '∞'
                      : quotaUsage.videoGeneration.monthly.limit || 0}
                  </span>
                </div>
                {!quotaUsage.videoGeneration.monthly.isUnlimited &&
                  (quotaUsage.videoGeneration.monthly.limit || 0) > 0 && (
                    <Progress
                      value={calculateUsagePercent(quotaUsage.videoGeneration.monthly)}
                      className="h-2"
                    />
                  )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Credit Transaction History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('transactionHistory')}
            </CardTitle>
            <CardDescription>{t('recentActivityDesc')}</CardDescription>
          </div>
          <Link href="/credits/history">
            <Button variant="outline" size="sm">
              {t('viewAll')}
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <History className="mx-auto mb-2 h-8 w-8" />
              <p>{t('noTransactions')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="font-medium text-sm">
                        {transaction.description || `${transaction.type} - ${transaction.source}`}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDistance(new Date(transaction.createdAt), new Date(), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === 'spend' ? '-' : '+'}
                      {transaction.amount}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {t('balance', { balance: transaction.balanceAfter })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t('quickActions')}</p>
              <p className="text-lg font-semibold">{t('generateImage')}</p>
            </div>
            <div className="rounded-full bg-primary/10 p-3">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/image-generation">
              <Button className="w-full btn-primary" size="sm">
                {t('generateImage')}
              </Button>
            </Link>
            <Link href="/video-generation">
              <Button variant="outline" className="w-full" size="sm">
                {t('generateVideo')}
              </Button>
            </Link>
            <Link href="/batch-image-generation">
              <Button variant="outline" className="w-full" size="sm">
                {t('batchImageGeneration')}
              </Button>
            </Link>
            <Link href="/batch-video-generation">
              <Button variant="outline" className="w-full" size="sm">
                {t('batchVideoGeneration')}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}
