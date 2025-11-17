import BillingClient, { type BillingPlan } from '@/components/billing/BillingClient';
import { paymentConfig } from '@/config/payment.config';
import { Suspense } from 'react';

function BillingContent() {
  const plans: BillingPlan[] = paymentConfig.plans
    .filter((plan) => plan.id === 'pro' || plan.id === 'proplus')
    .map((plan) => ({
      id: plan.id as 'pro' | 'proplus',
      name: plan.name,
      description: plan.description,
      price: plan.price,
      yearlyPrice: plan.yearlyPrice,
      features: plan.features,
      popular: plan.popular,
    }));

  return <BillingClient plans={plans} />;
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="container mx-auto max-w-5xl px-4 py-10">Loading...</div>}>
      <BillingContent />
    </Suspense>
  );
}
