import { creditsConfig } from '@/config/credits.config';

export interface GenerationCapacity {
  images: {
    nanoBanana: number;
    flux11: number;
    flux11Pro: number;
    flux11Ultra: number;
  };
  videos: {
    sora2_720p_10s: number;
    sora2_720p_15s: number;
    sora2Pro_720p_10s: number;
    sora2Pro_720p_15s: number;
    sora2Pro_1080p_10s: number;
    sora2Pro_1080p_15s: number;
  };
}

export function calculateGenerationCapacity(credits: number): GenerationCapacity {
  const { consumption } = creditsConfig;

  return {
    images: {
      nanoBanana: Math.floor(credits / consumption.imageGeneration['nano-banana']),
      flux11: Math.floor(credits / consumption.imageGeneration['flux-1.1']),
      flux11Pro: Math.floor(credits / consumption.imageGeneration['flux-1.1-pro']),
      flux11Ultra: Math.floor(credits / consumption.imageGeneration['flux-1.1-ultra']),
    },
    videos: {
      sora2_720p_10s: Math.floor(credits / consumption.videoGeneration['sora-2-720p-10s']),
      sora2_720p_15s: Math.floor(credits / consumption.videoGeneration['sora-2-720p-15s']),
      sora2Pro_720p_10s: Math.floor(
        credits / consumption.videoGeneration['sora-2-pro-720p-10s']
      ),
      sora2Pro_720p_15s: Math.floor(
        credits / consumption.videoGeneration['sora-2-pro-720p-15s']
      ),
      sora2Pro_1080p_10s: Math.floor(
        credits / consumption.videoGeneration['sora-2-pro-1080p-10s']
      ),
      sora2Pro_1080p_15s: Math.floor(
        credits / consumption.videoGeneration['sora-2-pro-1080p-15s']
      ),
    },
  };
}

export function formatCapacityRange(capacity: GenerationCapacity): string {
  const maxImages = capacity.images.nanoBanana;
  const maxVideos = capacity.videos.sora2_720p_10s;

  return `up to ${maxImages} images or ${maxVideos} videos`;
}

export function getYearlySavings(monthlyPrice: number, yearlyPrice: number): {
  amount: number;
  percentage: number;
} {
  const annualMonthlyTotal = monthlyPrice * 12;
  const savings = annualMonthlyTotal - yearlyPrice;
  const percentage = Math.round((savings / annualMonthlyTotal) * 100);

  return {
    amount: savings,
    percentage,
  };
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}
