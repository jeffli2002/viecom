import { creditsConfig } from '@/config/credits.config';
import { paymentConfig } from '@/config/payment.config';

export function getPricingFAQSchema() {
  const freePlan = paymentConfig.plans.find((p) => p.id === 'free');
  const proPlan = paymentConfig.plans.find((p) => p.id === 'pro');
  const proplusPlan = paymentConfig.plans.find((p) => p.id === 'proplus');

  const signupCredits = freePlan?.credits.onSignup || 15;
  const proCredits = proPlan?.credits.monthly || 500;
  const proPrice = proPlan?.price || 19.9;
  const proplusCredits = proplusPlan?.credits.monthly || 900;
  const proplusPrice = proplusPlan?.price || 34.9;

  const minCreditCost = creditsConfig.consumption.imageGeneration['nano-banana'];
  const maxCreditCost = creditsConfig.consumption.videoGeneration['sora-2-pro-1080p-15s'];

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is there a free plan?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes, get ${signupCredits} free credits on signup. No credit card required. Perfect for trying out our AI video and image generation.`,
        },
      },
      {
        '@type': 'Question',
        name: 'How much do credits cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Free plan: ${signupCredits} credits sign-up bonus (one-time). Pro: ${proCredits} credits/month ($${proPrice}). Pro+: ${proplusCredits} credits/month ($${proplusPrice}). Credits cost ${minCreditCost}-${maxCreditCost} per generation depending on model and settings.`,
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
}

export function getImageToVideoFAQSchema() {
  const freePlan = paymentConfig.plans.find((p) => p.id === 'free');
  const proPlan = paymentConfig.plans.find((p) => p.id === 'pro');

  const signupCredits = freePlan?.credits.onSignup || 15;
  const proPrice = proPlan?.price || 19.9;
  const proCredits = proPlan?.credits.monthly || 500;

  const sora2Cost = creditsConfig.consumption.videoGeneration['sora-2-720p-10s'];
  const sora2ProMinCost = creditsConfig.consumption.videoGeneration['sora-2-pro-720p-10s'];
  const sora2ProMaxCost = creditsConfig.consumption.videoGeneration['sora-2-pro-1080p-15s'];

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How long does it take to convert an image to video?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '720p videos take 2-3 minutes. 1080p videos take 5-7 minutes. We use a priority queue system to process 720p videos first for faster results.',
        },
      },
      {
        '@type': 'Question',
        name: 'What image formats are supported?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We support PNG, JPG, JPEG, and WebP formats. Images up to 10MB and 4K resolution work best.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is there a free trial?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes! Get ${signupCredits} free credits on signup (no credit card required). This allows you to generate 1 Sora 2 video (or up to ${Math.floor(signupCredits / creditsConfig.consumption.imageGeneration['nano-banana'])} images) to test our platform. Pro plan costs $${proPrice}/month with ${proCredits} credits.`,
        },
      },
      {
        '@type': 'Question',
        name: 'How many credits does image-to-video cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Sora 2 (720p): ${sora2Cost}-${creditsConfig.consumption.videoGeneration['sora-2-720p-15s']} credits per video. Sora 2 Pro (1080p): ${sora2ProMinCost}-${sora2ProMaxCost} credits per video depending on duration.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Can I generate multiple videos at once?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes! Free users can generate ${freePlan?.limits.batchSize || 1} video at a time. Pro users: ${proPlan?.limits.batchSize || 3} videos simultaneously. Pro+ users: ${paymentConfig.plans.find((p) => p.id === 'proplus')?.limits.batchSize || 5} videos simultaneously.`,
        },
      },
    ],
  };
}

export function getPricingData() {
  const freePlan = paymentConfig.plans.find((p) => p.id === 'free');
  const proPlan = paymentConfig.plans.find((p) => p.id === 'pro');
  const proplusPlan = paymentConfig.plans.find((p) => p.id === 'proplus');

  return {
    free: {
      signupCredits: freePlan?.credits.onSignup || 30,
      batchSize: freePlan?.limits.batchSize || 1,
    },
    pro: {
      price: proPlan?.price || 19.9,
      monthlyCredits: proPlan?.credits.monthly || 500,
      yearlyCredits: proPlan?.credits.yearly || 6000,
      yearlyPrice: proPlan?.yearlyPrice || 191.04,
      batchSize: proPlan?.limits.batchSize || 3,
    },
    proplus: {
      price: proplusPlan?.price || 34.9,
      monthlyCredits: proplusPlan?.credits.monthly || 900,
      yearlyCredits: proplusPlan?.credits.yearly || 10800,
      yearlyPrice: proplusPlan?.yearlyPrice || 335.04,
      batchSize: proplusPlan?.limits.batchSize || 5,
    },
    credits: {
      imageCostMin: creditsConfig.consumption.imageGeneration['nano-banana'],
      imageCostMax: creditsConfig.consumption.imageGeneration['nano-banana-pro'],
      videoCostMin: creditsConfig.consumption.videoGeneration['sora-2-720p-10s'],
      videoCostMax: creditsConfig.consumption.videoGeneration['sora-2-pro-1080p-15s'],
      sora2_720p_10s: creditsConfig.consumption.videoGeneration['sora-2-720p-10s'],
      sora2_720p_15s: creditsConfig.consumption.videoGeneration['sora-2-720p-15s'],
      sora2Pro_720p_10s: creditsConfig.consumption.videoGeneration['sora-2-pro-720p-10s'],
      sora2Pro_1080p_15s: creditsConfig.consumption.videoGeneration['sora-2-pro-1080p-15s'],
    },
    rewards: {
      dailyCheckin: creditsConfig.rewards.checkin.dailyCredits,
      referral: creditsConfig.rewards.referral.creditsPerReferral,
      socialShare: creditsConfig.rewards.socialShare.creditsPerShare,
    },
  };
}
