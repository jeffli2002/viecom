'use client';

import { CreditPackPurchaseButton } from '@/components/pricing/CreditPackPurchaseButton';
import { PlanPurchaseButton } from '@/components/pricing/PlanPurchaseButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription } from '@/hooks/use-subscription';
import { calculateGenerationCapacity } from '@/lib/utils/pricing-calculator';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  yearlyPrice?: number;
  monthlyCredits: number;
  yearlyCredits?: number;
  description: string;
  features: string[];
  popular: boolean;
  cta: string;
  highlighted: boolean;
  capacityInfo?: string;
  yearlyCapacityInfo?: string;
  batchConcurrency?: number;
  creemPriceIds?: {
    monthly?: string;
    yearly?: string;
  };
}

interface PricingPlansProps {
  plans: PricingPlan[];
  creditPacks: {
    id: string;
    name: string;
    credits: number;
    price: number;
    originalPrice?: number;
    discount?: string;
    popular?: boolean;
    badge?: string;
    creemProductKey?: string;
  }[];
}

export function PricingPlans({ plans, creditPacks }: PricingPlansProps) {
  const t = useTranslations('pricingPage');
  const { planId, interval, loading: loadingSubscription, cancelAtPeriodEnd } = useSubscription();

  const resolvedPlans = useMemo(() => plans, [plans]);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('year');

  const calculateSavings = (monthlyPrice: number, yearlyPrice: number) => {
    const annualMonthly = monthlyPrice * 12;
    const savings = annualMonthly - yearlyPrice;
    const percentage = Math.round((savings / annualMonthly) * 100);
    return { amount: savings, percentage };
  };

  return (
    <>
      <div className="flex justify-center mb-12">
        <div className="inline-flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full px-6 ${
              billingInterval === 'month'
                ? 'bg-white dark:bg-slate-900 shadow-sm text-teal-500 hover:bg-white dark:hover:bg-slate-900 hover:text-teal-500'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-transparent'
            }`}
            onClick={() => setBillingInterval('month')}
          >
            {t('monthly')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full px-6 ${
              billingInterval === 'year'
                ? 'bg-white dark:bg-slate-900 shadow-sm text-teal-500 hover:bg-white dark:hover:bg-slate-900 hover:text-teal-500'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-transparent'
            }`}
            onClick={() => setBillingInterval('year')}
          >
            {t('yearly')}
            {resolvedPlans.some((p) => p.yearlyPrice) && (
              <Badge className="ml-2 bg-teal-500 text-white border-0 text-xs px-2">
                {t('savePercentage')}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {resolvedPlans.map((plan) => {
          const isCurrent =
            !loadingSubscription &&
            planId === plan.id &&
            (interval || 'month') === billingInterval &&
            !cancelAtPeriodEnd;

          const displayPrice =
            billingInterval === 'year' && plan.yearlyPrice ? plan.yearlyPrice : plan.price;
          const displayCredits =
            billingInterval === 'year' && plan.yearlyCredits
              ? plan.yearlyCredits
              : plan.monthlyCredits;
          const _displayCapacity =
            billingInterval === 'year' && plan.yearlyCapacityInfo
              ? plan.yearlyCapacityInfo
              : plan.capacityInfo;

          const savings =
            billingInterval === 'year' && plan.yearlyPrice && plan.price > 0
              ? calculateSavings(plan.price, plan.yearlyPrice)
              : null;

          const buttonText = isCurrent && !loadingSubscription ? t('currentPlan') : plan.cta;

          return (
            <Card
              key={plan.id}
              className={`relative ${
                plan.highlighted
                  ? 'border-teal-500 border-2 shadow-xl scale-105'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-teal-500 text-white px-4 py-1">{t('mostPopular')}</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <div className="mb-2 flex items-center justify-center gap-3">
                  {displayPrice === 0 ? (
                    <span className="text-4xl font-bold text-slate-900 dark:text-white">$0</span>
                  ) : (
                    <>
                      <div className="flex flex-col items-center">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold text-slate-900 dark:text-white">
                            $
                            {billingInterval === 'year'
                              ? (displayPrice / 12).toFixed(2)
                              : displayPrice}
                          </span>
                          {billingInterval === 'year' && (
                            <span className="text-xl text-slate-400 dark:text-slate-500 line-through">
                              ${plan.price}
                            </span>
                          )}
                        </div>
                        <span className="text-slate-600 dark:text-slate-400 text-sm">
                          {t('perMonth')}
                        </span>
                        {billingInterval === 'year' && (
                          <>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              ${displayPrice}
                              {t('perYear')}
                            </p>
                            <Badge className="mt-2 bg-teal-500 text-white border-0 text-xs px-2">
                              {t('save', { percentage: savings?.percentage || 0 })}
                            </Badge>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {displayCredits > 0 && (
                  <p className="text-sm text-teal-500 font-medium mt-2">
                    {displayCredits.toLocaleString()} {t('credits')}
                    {billingInterval === 'year' ? t('perYear') : t('perMonth')}
                  </p>
                )}

                <p className="text-sm text-body mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent className="flex flex-col h-full pt-0">
                <ul className="space-y-3 flex-grow">
                  {plan.features.map((feature, idx) => {
                    let displayFeature = feature;

                    if (idx === 0 && feature.includes('credits')) {
                      if (
                        billingInterval === 'year' &&
                        plan.yearlyCredits &&
                        plan.yearlyCapacityInfo
                      ) {
                        const yearlyCapacity = calculateGenerationCapacity(plan.yearlyCredits);
                        const maxImages = yearlyCapacity.images.nanoBanana;
                        const maxVideos = yearlyCapacity.videos.sora2_720p_10s;
                        displayFeature = `${plan.yearlyCredits.toLocaleString()} credits/year (up to ${maxImages} images or ${maxVideos} videos)`;
                      }
                    }

                    return (
                      <li key={`${plan.id}-${feature}-${idx}`} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-teal-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-body">{displayFeature}</span>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-auto pt-6">
                  <PlanPurchaseButton
                    planId={plan.id as 'free' | 'pro' | 'proplus'}
                    buttonText={buttonText}
                    highlighted={plan.highlighted}
                    interval={billingInterval}
                    isCurrentPlan={isCurrent}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {t('creditPacksTitle')}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">{t('creditPacksSubtitle')}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {creditPacks.map((pack) => (
            <Card
              key={pack.id}
              className={`relative ${
                pack.popular
                  ? 'border-2 border-teal-500 shadow-lg'
                  : 'border border-slate-200 dark:border-slate-700'
              } lg:flex-1`}
            >
              {pack.badge && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-teal-500 to-pink-600 text-white border-0">
                  {pack.badge}
                </Badge>
              )}

              {pack.discount && (
                <Badge className="absolute -top-3 right-4 bg-red-500 text-white border-0">
                  {pack.discount}
                </Badge>
              )}

              <CardHeader className="text-center">
                <div className="mb-2">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">
                    ${pack.price}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {pack.credits.toLocaleString()} {t('credits')}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                <CreditPackPurchaseButton
                  packId={pack.id}
                  credits={pack.credits}
                  price={pack.price}
                  creemProductKey={pack.creemProductKey}
                  popular={pack.popular}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
