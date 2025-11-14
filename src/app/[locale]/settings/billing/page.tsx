import BillingClient, { type BillingPlan } from '@/components/billing/BillingClient';
import { paymentConfig } from '@/config/payment.config';

export default function BillingPage() {
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
