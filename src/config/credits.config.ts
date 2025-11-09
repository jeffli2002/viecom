export interface CreditsConfig {
  enabled: boolean;
  currency: string;

  // Credit consumption rules
  consumption: {
    imageToPrompt: {
      general: number;
      midjourney: number;
      nanoBanana: number;
      flux: number;
      sora2: number;
    };
    imageGeneration: {
      'nano-banana': number;
      'flux-1.1': number;
      'flux-1.1-pro': number;
      'flux-1.1-ultra': number;
      'flux-kontext-pro': number;
      'flux-kontext-max': number;
      'flux-kontext-dev': number;
      'stable-diffusion': number;
    };
    videoGeneration: {
      'sora-2': number;
    };
    storage: {
      costPerGBPerMonth: number;
      freeQuotaGB: number;
    };
  };

  // Free user quotas (credit-based)
  freeUser: {
    imageToText: {
      freeQuotaPerDay: number;
      freeQuotaPerMonth: number;
    };
    textToPrompt: {
      unlimited: boolean;
    };
    imageGeneration: {
      freeQuotaPerDay: number;
      freeQuotaPerMonth: number;
    };
    videoGeneration: {
      freeQuotaPerDay: number;
      freeQuotaPerMonth: number;
    };
    storage: {
      freeQuotaGB: number;
    };
  };
}

export const creditsConfig: CreditsConfig = {
  enabled: true,
  currency: 'credits',

  // Consumption rules
  consumption: {
    imageToPrompt: {
      general: 2,
      midjourney: 2,
      nanoBanana: 2,
      flux: 2,
      sora2: 2,
    },
    imageGeneration: {
      'nano-banana': 5,
      'flux-1.1': 5,
      'flux-1.1-pro': 5,
      'flux-1.1-ultra': 8,
      'flux-kontext-pro': 5,
      'flux-kontext-max': 10,
      'flux-kontext-dev': 5,
      'stable-diffusion': 5,
    },
    videoGeneration: {
      'sora-2': 15,
    },
    storage: {
      costPerGBPerMonth: 10,
      freeQuotaGB: 0,
    },
  },

  // Free user quotas
  freeUser: {
    imageToText: {
      freeQuotaPerDay: 3, // Free users get 3 Image-to-Prompt calls per day
      freeQuotaPerMonth: 10, // Free users get 10 Image-to-Prompt calls per month
    },
    textToPrompt: {
      unlimited: true, // Free users get unlimited Text-to-Prompt generation
    },
    imageGeneration: {
      freeQuotaPerDay: 0, // Free users can only use credits for image generation
      freeQuotaPerMonth: 0, // Free users can only use credits for image generation
    },
    videoGeneration: {
      freeQuotaPerDay: 0, // Free users can only use credits for video generation
      freeQuotaPerMonth: 0, // Free users can only use credits for video generation
    },
    storage: {
      freeQuotaGB: 1,
    },
  },
};

export function getModelCost(
  feature: 'imageToPrompt' | 'imageGeneration' | 'videoGeneration',
  model: string
): number {
  const consumption = creditsConfig.consumption[feature];
  if (!consumption) {
    console.warn(`Unknown feature: ${feature}`);
    return 0;
  }

  const cost = (consumption as any)[model];
  if (cost === undefined) {
    console.warn(
      `Unknown model "${model}" for feature "${feature}". Available models:`,
      Object.keys(consumption)
    );
    return 0;
  }

  return cost;
}

