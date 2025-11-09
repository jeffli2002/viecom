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
        '3 Image-to-Prompt per day (10/month)',
        'Unlimited Text-to-Prompt',
        '30 credits on signup (one-time)',
        'Use credits for image/video generation',
        'No watermark for image',
        'Personal use',
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
        '300 Image-to-Text per month',
        '500 credits/month for generation',
        'Commercial license',
        'No watermark for images',
        'No watermark for Sora 2 video',
        'No Ads',
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
        '600 Image-to-Text per month',
        '900 credits/month for generation',
        'Commercial License',
        'No watermark for images',
        'No watermark for Sora 2 video',
        'No Ads',
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



