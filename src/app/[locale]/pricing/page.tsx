import { PricingPlans } from '@/components/pricing/PricingPlans';
import { creditsConfig } from '@/config/credits.config';
import { paymentConfig } from '@/config/payment.config';
import { getSEOMetadata } from '@/lib/seo/metadata-translations';
import { getPricingFAQSchema } from '@/lib/utils/faq-generator';
import { calculateGenerationCapacity, formatCapacityRange } from '@/lib/utils/pricing-calculator';
import { Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return getSEOMetadata(locale, 'pricing', '/pricing');
}

export default async function PricingPage() {
  const t = await getTranslations('pricingPage');

  const freePlan = paymentConfig.plans.find((p) => p.id === 'free');
  const proPlan = paymentConfig.plans.find((p) => p.id === 'pro');
  const proplusPlan = paymentConfig.plans.find((p) => p.id === 'proplus');

  const faqParams = {
    signupCredits: freePlan?.credits.onSignup || 15,
    proCredits: proPlan?.credits.monthly || 500,
    proPrice: proPlan?.price || 19.9,
    proplusCredits: proplusPlan?.credits.monthly || 900,
    proplusPrice: proplusPlan?.price || 34.9,
    minCost: creditsConfig.consumption.imageGeneration['nano-banana'],
    maxCost: creditsConfig.consumption.videoGeneration['sora-2-pro-1080p-15s'],
  };

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
    } else if (plan.id === 'free' && plan.credits.onSignup) {
      // For free plan, show signup credits capacity (images only, no videos since 15 < 25)
      const signupCapacity = calculateGenerationCapacity(plan.credits.onSignup);
      const maxImages = signupCapacity.images.nanoBanana;
      // Don't show videos since signup credits (15) < minimum video cost (25)
      if (features.length > 0 && features[0].includes('credits')) {
        features[0] = `${plan.credits.onSignup} credits sign-up bonus (one-time) - up to ${maxImages} images`;
      }
    }

    return {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      originalPrice: plan.originalPrice,
      yearlyPrice: plan.yearlyPrice,
      originalYearlyPrice: plan.originalYearlyPrice,
      monthlyCredits,
      yearlyCredits,
      description: plan.description,
      features,
      popular: plan.popular,
      cta: plan.id === 'free' ? t('getStarted') : t('upgradeTo', { plan: plan.name }),
      highlighted: plan.popular,
      capacityInfo: monthlyCapacityInfo,
      yearlyCapacityInfo,
      batchConcurrency: plan.limits?.batchSize,
      creemPriceIds: plan.creemPriceIds,
    };
  });

  const faqSchema = getPricingFAQSchema();

  return (
    <div>
      <div className="relative w-screen left-1/2 right-1/2 -mx-[50vw] overflow-hidden">
        <div className="relative aspect-[16/5] w-full">
          <Image
            src="/xmashero.png"
            alt="Christmas pricing hero"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>
      </div>
      <div className="container-base py-24">
        <script
          type="application/ld+json"
          suppressHydrationWarning
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema is safe
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <div className="mb-12 text-center">
          <h1 className="h2-section mb-4">{t('title')}</h1>
          <p className="text-body text-lg mb-6">{t('subtitle')}</p>
          <div className="inline-flex items-center gap-2 bg-teal-50 dark:bg-teal-900/20 px-4 py-2 rounded-full border border-teal-200 dark:border-teal-800">
            <Sparkles className="h-4 w-4 text-teal-500" />
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              {t('rewardsBadge')}
            </span>
          </div>
        </div>

        <PricingPlans plans={plans} creditPacks={paymentConfig.creditPacks} />

        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 text-slate-900 dark:text-white">
            {t('faqTitle')}
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
                {t('faqQ1')}
              </h3>
              <p className="text-body">{t('faqA1')}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
                {t('faqQ2')}
              </h3>
              <p className="text-body">{t('faqA2', faqParams)}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
                {t('faqQ3')}
              </h3>
              <p className="text-body">{t('faqA3')}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
                {t('faqQ4')}
              </h3>
              <p className="text-body">{t('faqA4')}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
                {t('faqQ5')}
              </h3>
              <p className="text-body">{t('faqA5')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
