'use client';

import { PlanPurchaseButton } from '@/components/pricing/PlanPurchaseButton';
import { CreditPackPurchaseButton } from '@/components/pricing/CreditPackPurchaseButton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription } from '@/hooks/use-subscription';
import { Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  yearlyPrice?: number;
  monthlyCredits: number;
  description: string;
  features: string[];
  popular: boolean;
  cta: string;
  highlighted: boolean;
  savings?: string;
  capacityInfo?: string;
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
  const { planId, interval, loading: loadingSubscription, cancelAtPeriodEnd } = useSubscription();

  const resolvedPlans = useMemo(() => plans, [plans]);
  const [billingInterval] = useState<'month' | 'year'>('month');

  return (
    <>
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {resolvedPlans.map((plan) => {
          // Only mark as current if BOTH plan ID AND billing interval match
          // Pro monthly user CAN upgrade to Pro yearly (different interval)
          const isCurrent =
            !loadingSubscription &&
            planId === plan.id &&
            (interval || 'month') === billingInterval &&
            !cancelAtPeriodEnd;
          const buttonText = isCurrent && !loadingSubscription ? 'Current Plan' : plan.cta;

          return (
            <Card
              key={plan.id}
              className={`relative ${
                plan.highlighted
                  ? 'border-purple-500 border-2 shadow-xl scale-105'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white px-4 py-1">Most Popular</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && <span className="text-gray-600">/month</span>}
                </div>
                {plan.monthlyCredits > 0 && (
                  <>
                    <p className="text-sm text-purple-600 font-medium">
                      {plan.monthlyCredits} credits/month
                    </p>
                    {plan.capacityInfo && (
                      <p className="text-xs text-gray-500 mt-1">{plan.capacityInfo}</p>
                    )}
                  </>
                )}
                {plan.savings && (
                  <Badge variant="outline" className="mt-2 border-purple-300 text-purple-700">
                    {plan.savings}
                  </Badge>
                )}
                <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={`${plan.id}-${feature}`} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <PlanPurchaseButton
                  planId={plan.id as 'free' | 'pro' | 'proplus'}
                  buttonText={buttonText}
                  highlighted={plan.highlighted}
                  interval="month"
                  isCurrentPlan={isCurrent}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">One-Time Credit Packs</h2>
          <p className="text-gray-600">
            Need extra credits? Purchase credit packs without a subscription
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {creditPacks.map((pack) => (
            <Card
              key={pack.id}
              className={`relative ${
                pack.popular ? 'border-2 border-purple-500 shadow-lg' : 'border border-gray-200'
              }`}
            >
              {pack.badge && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
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
                  <span className="text-4xl font-bold text-gray-900">${pack.price}</span>
                </div>
                <p className="text-sm text-gray-600">{pack.credits} credits</p>
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
