import { PricingPlans } from '@/components/pricing/PricingPlans';
import { creditsConfig } from '@/config/credits.config';
import { paymentConfig } from '@/config/payment.config';
import { calculateGenerationCapacity, formatCapacityRange } from '@/lib/utils/pricing-calculator';
import { Sparkles } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | AI Video Generator from $14.9/mo - Free Trial Available',
  description:
    'Simple, transparent pricing for AI video and image generation. Free plan with 30 credits sign-up bonus (one-time). Pro plans from $14.9/month. No credit card required for trial.',
  keywords: [
    'ai video generator pricing',
    'free ai video credits',
    'video generation pricing',
    'image to video pricing',
    'ai video subscription',
  ],
};

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

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is there a free plan?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, get 30 free credits on signup. No credit card required. Perfect for trying out our AI video and image generation.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much do credits cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Free plan: 30 credits sign-up bonus (one-time). Pro: 500 credits/month ($14.9). Pro+: 900 credits/month ($24.9). Credits cost 5-130 per generation depending on model and settings.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I upgrade or downgrade anytime?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, you can upgrade, downgrade, or cancel your subscription at any time. Changes take effect on your next billing cycle.',
        },
      },
      {
        '@type': 'Question',
        name: 'What payment methods do you accept?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We accept all major credit cards, debit cards, and support secure payment processing through Creem.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do unused credits roll over?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Monthly subscription credits reset each billing cycle. Credit packs purchased separately never expire.',
        },
      },
    ],
  };

  return (
    <div className="container-base py-24">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema is safe
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
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

      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8 text-slate-900 dark:text-white">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
              Is there a free plan?
            </h3>
            <p className="text-body">
              Yes, get 30 free credits on signup. No credit card required. Perfect for trying out
              our AI video and image generation.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
              How much do credits cost?
            </h3>
            <p className="text-body">
              Free plan: 30 credits sign-up bonus (one-time). Pro: 500 credits/month ($14.9). Pro+:
              900 credits/month ($24.9). Credits cost 5-130 per generation depending on model and
              settings.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
              Can I upgrade or downgrade anytime?
            </h3>
            <p className="text-body">
              Yes, you can upgrade, downgrade, or cancel your subscription at any time. Changes take
              effect on your next billing cycle.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
              What payment methods do you accept?
            </h3>
            <p className="text-body">
              We accept all major credit cards, debit cards, and support secure payment processing
              through Creem.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
              Do unused credits roll over?
            </h3>
            <p className="text-body">
              Monthly subscription credits reset each billing cycle. Credit packs purchased
              separately never expire.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
