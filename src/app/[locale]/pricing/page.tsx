import { PricingPlans } from '@/components/pricing/PricingPlans';
import { creditsConfig } from '@/config/credits.config';
import { paymentConfig } from '@/config/payment.config';
import { Sparkles } from 'lucide-react';

export default async function PricingPage() {
  const plans = paymentConfig.plans.map((plan) => {
    const monthlyCredits = plan.credits.monthly;
    const creditsForCalculation = plan.credits.monthly || plan.credits.onSignup || 0;

    const imageCount = Math.floor(
      creditsForCalculation / creditsConfig.consumption.imageGeneration['nano-banana']
    );
    const videoCount = Math.floor(
      creditsForCalculation / creditsConfig.consumption.videoGeneration['sora-2-720p-10s']
    );

    const features = [...plan.features];

    if (monthlyCredits > 0 && features.length > 0 && features[0].includes('credits/month')) {
      features[0] = `${monthlyCredits} credits/month (up to ${imageCount} image generation or ${videoCount} video generation)`;
    }

    return {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      yearlyPrice: plan.yearlyPrice,
      monthlyCredits,
      description: plan.description,
      features,
      popular: plan.popular,
      cta: plan.id === 'free' ? 'Get Started' : `Upgrade to ${plan.name}`,
      highlighted: plan.popular,
      savings: plan.yearlyPrice ? 'Save 20% with yearly' : undefined,
      capacityInfo:
        creditsForCalculation > 0
          ? `up to ${imageCount} image generation or ${videoCount} video generation`
          : undefined,
      batchConcurrency: plan.limits?.batchSize,
      creemPriceIds: plan.creemPriceIds,
    };
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">Simple, Transparent Pricing</h1>
        <p className="text-lg text-gray-600 mb-6">
          Choose the plan that fits your business needs. Upgrade or downgrade anytime.
        </p>
        <div className="inline-flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full border border-purple-200">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-900">
            All plans include daily check-in rewards and referral bonuses
          </span>
        </div>
      </div>

      <PricingPlans plans={plans} creditPacks={paymentConfig.creditPacks} />
    </div>
  );
}
