import { PricingPlans } from '@/components/pricing/PricingPlans';
import { creditsConfig } from '@/config/credits.config';
import { paymentConfig } from '@/config/payment.config';
import { calculateGenerationCapacity, formatCapacityRange } from '@/lib/utils/pricing-calculator';
import { Sparkles } from 'lucide-react';

export default async function PricingPage() {
  const plans = paymentConfig.plans.map((plan) => {
    const monthlyCredits = plan.credits.monthly;
    const yearlyCredits = plan.credits.yearly || 0;

    const monthlyCapacity = calculateGenerationCapacity(monthlyCredits);
    const yearlyCapacity = calculateGenerationCapacity(yearlyCredits);

    const monthlyCapacityInfo =
      monthlyCredits > 0 ? formatCapacityRange(monthlyCapacity) : undefined;
    const yearlyCapacityInfo = yearlyCredits > 0 ? formatCapacityRange(yearlyCapacity) : undefined;

    const features = [...plan.features];

    if (monthlyCredits > 0 && features.length > 0 && features[0].includes('credits')) {
      const maxImages = monthlyCapacity.images.nanoBanana;
      const maxVideos = monthlyCapacity.videos.sora2_720p_10s;

      features[0] = `${monthlyCredits.toLocaleString()} credits/month (up to ${maxImages} images or ${maxVideos} videos)`;
    }

    return {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      yearlyPrice: plan.yearlyPrice,
      monthlyCredits,
      yearlyCredits,
      description: plan.description,
      features,
      popular: plan.popular,
      cta: plan.id === 'free' ? 'Get Started' : `Upgrade to ${plan.name}`,
      highlighted: plan.popular,
      capacityInfo: monthlyCapacityInfo,
      yearlyCapacityInfo,
      batchConcurrency: plan.limits?.batchSize,
      creemPriceIds: plan.creemPriceIds,
    };
  });

  return (
    <div className="container-base py-24">
      <div className="mb-12 text-center">
        <h1 className="h2-section mb-4">Simple, Transparent Pricing</h1>
        <p className="text-body text-lg mb-6">
          Choose the plan that fits your business needs. Upgrade or downgrade anytime.
        </p>
        <div className="inline-flex items-center gap-2 bg-teal-50 dark:bg-teal-900/20 px-4 py-2 rounded-full border border-teal-200 dark:border-teal-800">
          <Sparkles className="h-4 w-4 text-teal-500" />
          <span className="text-sm font-medium text-slate-900 dark:text-white">
            All plans include daily check-in rewards and referral bonuses
          </span>
        </div>
      </div>

      <PricingPlans plans={plans} creditPacks={paymentConfig.creditPacks} />
    </div>
  );
}
