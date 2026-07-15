import {
  calculateSeedanceFastCreditsFromTokenUsage,
  calculateSeedanceFastVideoCredits,
  estimateSeedanceFastProviderCostCny,
  getVideoModelInfo,
} from '@/config/credits.config';

describe('Seedance 2.0 Fast video-input pricing', () => {
  it('matches the official 10s input plus 10s output examples', () => {
    expect(
      estimateSeedanceFastProviderCostCny({
        resolution: '480p',
        outputDuration: 10,
        referenceVideoDuration: 10,
      })
    ).toBeCloseTo(4.42, 2);
    expect(
      estimateSeedanceFastProviderCostCny({
        resolution: '720p',
        outputDuration: 10,
        referenceVideoDuration: 10,
      })
    ).toBeCloseTo(9.5, 2);
  });

  it.each([
    ['480p 10s without video', '480p', 10, undefined, 50],
    ['480p 10s with 10s video', '480p', 10, 10, 60],
    ['720p 10s with 10s video', '720p', 10, 10, 120],
    ['480p 15s with 15s video', '480p', 15, 15, 90],
    ['720p 15s with 15s video', '720p', 15, 15, 180],
  ] as const)('calculates %s', (_label, resolution, outputDuration, inputDuration, credits) => {
    expect(
      calculateSeedanceFastVideoCredits({
        resolution,
        outputDuration,
        referenceVideoDuration: inputDuration,
      })
    ).toBe(credits);
  });

  it('returns a video-input-specific model key and credits to the backend', () => {
    expect(
      getVideoModelInfo({
        model: 'seedance-2-fast',
        resolution: '720p',
        duration: 10,
        referenceVideoDuration: 15,
      })
    ).toMatchObject({
      modelKey: 'seedance-2-fast-720p-10s-video-input-15s',
      credits: 150,
    });
  });

  it('reconciles the final charge from Ark token usage', () => {
    expect(
      calculateSeedanceFastCreditsFromTokenUsage({
        resolution: '720p',
        outputDuration: 10,
        totalTokens: 432000,
        hasVideoInput: true,
      })
    ).toBe(120);
  });
});
