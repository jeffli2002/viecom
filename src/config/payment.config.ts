export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
  originalPrice?: number; // Original price before discount
  discount?: string; // Discount label (e.g., "10% OFF")
  stripePriceId?: string;
  creemProductKey?: string;
  popular?: boolean;
  badge?: string;
}

export interface PaymentConfig {
  provider: 'stripe' | 'creem';
  currency: string;
  stripe: {
    secretKey: string;
    webhookSecret: string;
    apiVersion: string;
  };
  creem: {
    apiKey: string;
    webhookSecret: string;
    proProductKeyMonthly: string;
    proplusProductKeyMonthly: string;
    proProductKeyYearly: string;
    proplusProductKeyYearly: string;
  };
  plans: Plan[];
  creditPacks: CreditPack[];
  trial: {
    enabled: boolean;
    days: number;
    plans: string[];
  };
  invoice: {
    footer: string;
    logo: string;
    supportEmail: string;
  };
  billing: {
    collectTaxId: boolean;
    allowPromotionCodes: boolean;
    automaticTax: boolean;
  };
  features: {
    subscriptions: boolean;
    oneTimePayments: boolean;
    invoices: boolean;
    customerPortal: boolean;
    webhooks: boolean;
  };
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  yearlyPrice?: number;
  interval: 'month' | 'year' | null;
  stripePriceIds?: {
    monthly?: string;
    yearly?: string;
  };
  creemPriceIds?: {
    monthly?: string;
    yearly?: string;
  };
  credits: {
    monthly: number;
    onSignup?: number;
    onSubscribe?: number;
  };
  features: string[];
  popular: boolean;
  limits: {
    extractions?: number;
    images?: number;
    videos?: number;
    dailyImages?: number;
    dailyVideos?: number;
    batchSize?: number;
    quality?: string;
    apiCalls?: number;
  };
}

export const paymentConfig: PaymentConfig = {
  provider: 'stripe',

  currency: 'usd',

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    apiVersion: '2025-08-27.basil',
  },

  creem: {
    apiKey: process.env.CREEM_API_KEY || '',
    webhookSecret: process.env.CREEM_WEBHOOK_SECRET || '',
    proProductKeyMonthly: process.env.CREEM_PRO_PLAN_PRODUCT_KEY_MONTHLY || '',
    proplusProductKeyMonthly: process.env.CREEM_PROPLUS_PLAN_PRODUCT_KEY_MONTHLY || '',
    proProductKeyYearly: process.env.CREEM_PRO_PLAN_PRODUCT_KEY_YEARLY || '',
    proplusProductKeyYearly: process.env.CREEM_PROPLUS_PLAN_PRODUCT_KEY_YEARLY || '',
  },

  plans: [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for trying out the platform',
      price: 0,
      interval: null,
      credits: {
        monthly: 0,
        onSignup: 30,
      },
      features: [
        '30 credits sign-up bonus (one-time)',
        'Daily check-in rewards (2 credits/day)',
        'Referral rewards (10 credits per referral)',
        'Social share rewards (5 credits per share)',
        'Text-to-image generation',
        'Image-to-image generation',
        'Text-to-video generation',
        'Image-to-video generation',
        'Batch generation (1 concurrent)',
        'Basic image styles',
        '7 days asset display',
        'Standard quality',
      ],
      popular: false,
      limits: {
        extractions: 5,
        images: 0,
        videos: 0,
        dailyImages: 0,
        dailyVideos: 0,
        batchSize: 1,
        quality: 'standard',
      },
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Great for individual creators',
      price: 14.9,
      yearlyPrice: 143.04,
      interval: 'month',
      stripePriceIds: {
        monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
        yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
      },
      creemPriceIds: {
        monthly: process.env.NEXT_PUBLIC_CREEM_PRICE_PRO_MONTHLY || '',
        yearly: process.env.NEXT_PUBLIC_CREEM_PRICE_PRO_YEARLY || '',
      },
      credits: {
        monthly: 500,
        onSubscribe: 0,
      },
      features: [
        '500 credits/month',
        'Everything in Free plan',
        'All image generation features',
        'Sora 2 & Sora 2 Pro video models',
        'Brand analysis',
        'Batch generation (3 concurrent)',
        'No watermarks',
        'Commercial license',
        '30 days asset display',
        'HD quality exports',
        'Priority support',
      ],
      popular: true,
      limits: {
        extractions: 300,
        dailyImages: -1,
        dailyVideos: -1,
        batchSize: 5,
        quality: 'hd',
      },
    },
    {
      id: 'proplus',
      name: 'Pro+',
      description: 'For professional creators and businesses',
      price: 24.9,
      yearlyPrice: 239.04,
      interval: 'month',
      stripePriceIds: {
        monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROPLUS_MONTHLY || 'price_proplus_monthly',
        yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROPLUS_YEARLY || 'price_proplus_yearly',
      },
      creemPriceIds: {
        monthly: process.env.NEXT_PUBLIC_CREEM_PRICE_PROPLUS_MONTHLY || '',
        yearly: process.env.NEXT_PUBLIC_CREEM_PRICE_PROPLUS_YEARLY || '',
      },
      credits: {
        monthly: 900,
        onSubscribe: 0,
      },
      features: [
        '900 credits/month',
        'Everything in Pro',
        'Advanced AI models (Sora 2 Pro)',
        'Priority queue processing (10 concurrent)',
        '30 days asset display',
        '4K quality exports',
        'Dedicated account manager',
        '24/7 priority support',
      ],
      popular: false,
      limits: {
        extractions: 600,
        dailyImages: -1,
        dailyVideos: -1,
        batchSize: 10,
        quality: 'fullhd',
        apiCalls: 10000,
      },
    },
  ],

  creditPacks: [
    {
      id: 'pack-1000',
      name: '1,000 Credits',
      credits: 1000,
      price: 30,
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PACK_1000 || 'price_pack_1000',
      creemProductKey: process.env.NEXT_PUBLIC_CREEM_PRICE_PACK_1000 || '',
    },
    {
      id: 'pack-2000',
      name: '2,000 Credits',
      credits: 2000,
      price: 60,
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PACK_2000 || 'price_pack_2000',
      creemProductKey: process.env.NEXT_PUBLIC_CREEM_PRICE_PACK_2000 || '',
      popular: true,
      badge: 'Most Popular',
    },
    {
      id: 'pack-5000',
      name: '5,000 Credits',
      credits: 5000,
      price: 135,
      originalPrice: 150,
      discount: '10% OFF',
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PACK_5000 || 'price_pack_5000',
      creemProductKey: process.env.NEXT_PUBLIC_CREEM_PRICE_PACK_5000 || '',
    },
    {
      id: 'pack-10000',
      name: '10,000 Credits',
      credits: 10000,
      price: 270,
      originalPrice: 300,
      discount: '20% OFF',
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PACK_10000 || 'price_pack_10000',
      creemProductKey: process.env.NEXT_PUBLIC_CREEM_PRICE_PACK_10000 || '',
      badge: 'Best Value',
    },
  ],

  trial: {
    enabled: true,
    days: 14,
    plans: ['pro', 'proplus'],
  },

  invoice: {
    footer:
      'Thank you for your business! If you have any questions, please contact our support team.',
    logo: '/images/logo3.png',
    supportEmail: 'support@example.com',
  },

  billing: {
    collectTaxId: true,
    allowPromotionCodes: true,
    automaticTax: true,
  },

  features: {
    subscriptions: true,
    oneTimePayments: true,
    invoices: true,
    customerPortal: true,
    webhooks: true,
  },
};



