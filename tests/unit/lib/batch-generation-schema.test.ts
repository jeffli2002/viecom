import { applyGenerationStyle } from '@/config/styles.config';
import { batchGenerateRequestSchema } from '@/lib/workflow/batch-generation-schema';

const validVideoRequest = {
  rows: [
    {
      rowIndex: 1,
      prompt: 'Rotate the product on a clean studio table',
      enhancedPrompt: 'Rotate the product on a clean studio table',
    },
  ],
  generationType: 'video',
  mode: 'i2v',
  aspectRatio: 'adaptive',
  style: 'product-demo',
  defaultModel: 'seedance-2-fast',
  defaultResolution: '720p',
  defaultDuration: 15,
  generateAudio: false,
} as const;

describe('batchGenerateRequestSchema', () => {
  it('accepts supported Seedance batch parameters', () => {
    expect(batchGenerateRequestSchema.parse(validVideoRequest)).toMatchObject({
      aspectRatio: 'adaptive',
      defaultResolution: '720p',
      defaultDuration: 15,
      generateAudio: false,
    });
  });

  it('defaults Seedance audio generation to enabled', () => {
    const { generateAudio } = batchGenerateRequestSchema.parse({
      ...validVideoRequest,
      generateAudio: undefined,
    });
    expect(generateAudio).toBe(true);
  });

  it('accepts a complete reference video input', () => {
    const result = batchGenerateRequestSchema.parse({
      ...validVideoRequest,
      videoInputEnabled: true,
      rows: [
        {
          ...validVideoRequest.rows[0],
          referenceVideoUrl: 'https://cdn.example.com/reference.mp4',
          referenceVideoDuration: 10,
        },
      ],
    });

    expect(result.rows[0]).toMatchObject({
      referenceVideoUrl: 'https://cdn.example.com/reference.mp4',
      referenceVideoDuration: 10,
    });
  });

  it.each([
    ['missing video URL', { referenceVideoDuration: 10 }],
    ['missing video duration', { referenceVideoUrl: 'https://cdn.example.com/reference.mp4' }],
    [
      'non-HTTPS video URL',
      { referenceVideoUrl: 'http://cdn.example.com/reference.mp4', referenceVideoDuration: 10 },
    ],
    [
      'video duration over 15 seconds',
      { referenceVideoUrl: 'https://cdn.example.com/reference.mp4', referenceVideoDuration: 16 },
    ],
  ])('rejects %s when video input is enabled', (_label, rowOverride) => {
    expect(
      batchGenerateRequestSchema.safeParse({
        ...validVideoRequest,
        videoInputEnabled: true,
        rows: [{ ...validVideoRequest.rows[0], ...rowOverride }],
      }).success
    ).toBe(false);
  });

  it.each([
    ['unsupported resolution', { defaultResolution: '1080p' }],
    ['unsupported duration', { defaultDuration: 16 }],
    ['image mode for video generation', { mode: 'i2i' }],
    ['image-only ratio for video generation', { aspectRatio: '4:3' }],
  ])('rejects %s', (_label, override) => {
    expect(
      batchGenerateRequestSchema.safeParse({ ...validVideoRequest, ...override }).success
    ).toBe(false);
  });
});

describe('applyGenerationStyle', () => {
  it('applies a selected video style to a prompt', () => {
    expect(applyGenerationStyle('Show the product features', 'product-demo', 'video')).toContain(
      'product demonstration, feature highlights'
    );
  });

  it('does not append the same style twice', () => {
    const once = applyGenerationStyle('Show the product features', 'product-demo', 'video');
    expect(applyGenerationStyle(once, 'product-demo', 'video')).toBe(once);
  });
});
