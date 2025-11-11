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
      // Sora 2 (仅720P)
      'sora-2-720p-10s': number;
      'sora-2-720p-15s': number;
      
      // Sora 2 Pro (支持720P和1080P)
      'sora-2-pro-720p-10s': number;
      'sora-2-pro-720p-15s': number;
      'sora-2-pro-1080p-10s': number;
      'sora-2-pro-1080p-15s': number;
      
      // 向后兼容
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

  // Reward system configuration
  rewards: {
    checkin: {
      dailyCredits: number; // Credits per day
      weeklyBonusCredits: number; // Extra credits for 7 consecutive days
      consecutiveDaysRequired: number; // Days required for weekly bonus
    };
    referral: {
      creditsPerReferral: number; // Credits when referred user completes first generation
    };
    socialShare: {
      creditsPerShare: number; // Credits per social media share
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
      // Sora 2 (仅720P, 2-3分钟生成)
      'sora-2-720p-10s': 15,
      'sora-2-720p-15s': 20,
      
      // Sora 2 Pro (支持720P和1080P，更高质量更高消耗)
      'sora-2-pro-720p-10s': 45,    // Sora 2 的 3倍
      'sora-2-pro-720p-15s': 60,    // Sora 2 的 3倍
      'sora-2-pro-1080p-10s': 100,  // 1080P高分辨率
      'sora-2-pro-1080p-15s': 130,  // 1080P高分辨率
      
      // 向后兼容（默认 Sora 2 720P 15s）
      'sora-2': 20,
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

  // Reward system configuration
  rewards: {
    checkin: {
      dailyCredits: 2, // Daily checkin reward
      weeklyBonusCredits: 5, // Extra credits for 7 consecutive days
      consecutiveDaysRequired: 7, // Days required for weekly bonus
    },
    referral: {
      creditsPerReferral: 10, // Credits when referred user completes first generation
    },
    socialShare: {
      creditsPerShare: 5, // Credits per social media share
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

/**
 * 根据视频参数获取模型key和积分消耗
 */
export function getVideoModelInfo(params: {
  model: 'sora-2' | 'sora-2-pro';
  resolution: '720p' | '1080p';
  duration: 10 | 15;
}): { modelKey: string; credits: number; apiModel: string } {
  const { model, resolution, duration } = params;
  
  // Sora 2 只支持720P
  if (model === 'sora-2') {
    const key = `sora-2-720p-${duration}s` as const;
    return {
      modelKey: key,
      credits: creditsConfig.consumption.videoGeneration[key] || 20,
      apiModel: duration === 10 ? 'sora-2-text-to-video' : 'sora-2-text-to-video',
    };
  }
  
  // Sora 2 Pro 支持720P和1080P
  const key = `sora-2-pro-${resolution}-${duration}s` as const;
  return {
    modelKey: key,
    credits: creditsConfig.consumption.videoGeneration[key] || 25,
    apiModel: 'sora-2-pro-text-to-video', // 或 sora-2-pro-image-to-video
  };
}

