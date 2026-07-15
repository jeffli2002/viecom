import { z } from 'zod';

export const videoAspectRatios = ['adaptive', '16:9', '9:16'] as const;
export const imageAspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'] as const;

const batchRowSchema = z.object({
  rowIndex: z.number().int().positive(),
  productName: z.string().max(500).optional(),
  productDescription: z.string().max(5000).optional(),
  prompt: z.string().trim().min(1).max(12000),
  enhancedPrompt: z.string().trim().min(1).max(16000),
  baseImageUrl: z.string().trim().min(1).optional(),
  referenceVideoUrl: z
    .string()
    .trim()
    .url()
    .refine((url) => url.startsWith('https://'), 'Reference video URL must use HTTPS')
    .optional(),
  referenceVideoDuration: z.number().int().min(2).max(15).optional(),
  productSellingPoints: z.string().max(5000).optional(),
  model: z.literal('seedance-2-fast').optional(),
  resolution: z.enum(['480p', '720p']).optional(),
  duration: z.union([z.literal(10), z.literal(15)]).optional(),
});

export const batchGenerateRequestSchema = z
  .object({
    rows: z.array(batchRowSchema).min(1).max(25),
    generationType: z.enum(['image', 'video']),
    mode: z.enum(['t2i', 'i2i', 't2v', 'i2v']),
    aspectRatio: z.enum(['adaptive', '1:1', '16:9', '9:16', '4:3', '3:4']),
    style: z.string().trim().min(1).max(64).optional(),
    outputFormat: z.enum(['png', 'jpeg']).optional(),
    model: z.literal('nano-banana').optional(),
    defaultModel: z.literal('seedance-2-fast').optional(),
    defaultResolution: z.enum(['480p', '720p']).optional(),
    defaultDuration: z.union([z.literal(10), z.literal(15)]).optional(),
    generateAudio: z.boolean().default(true),
    videoInputEnabled: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    const isVideo = value.generationType === 'video';
    const validModes = isVideo ? ['t2v', 'i2v'] : ['t2i', 'i2i'];
    const validRatios: readonly string[] = isVideo ? videoAspectRatios : imageAspectRatios;

    if (!validModes.includes(value.mode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mode'],
        message: `Mode ${value.mode} is not valid for ${value.generationType} generation`,
      });
    }

    if (!validRatios.includes(value.aspectRatio)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['aspectRatio'],
        message: `Aspect ratio ${value.aspectRatio} is not supported for ${value.generationType} generation`,
      });
    }

    if (isVideo && !value.defaultModel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['defaultModel'],
        message: 'A supported video model is required',
      });
    }

    if (!isVideo && value.videoInputEnabled) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['videoInputEnabled'],
        message: 'Reference video input is only available for video generation',
      });
    }

    value.rows.forEach((row, index) => {
      const hasVideoFields =
        row.referenceVideoUrl !== undefined || row.referenceVideoDuration !== undefined;

      if (value.videoInputEnabled) {
        if (!row.referenceVideoUrl) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['rows', index, 'referenceVideoUrl'],
            message: 'Reference video URL is required when video input is enabled',
          });
        }
        if (row.referenceVideoDuration === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['rows', index, 'referenceVideoDuration'],
            message: 'Reference video duration is required when video input is enabled',
          });
        }
      } else if (hasVideoFields) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rows', index, 'referenceVideoUrl'],
          message: 'Enable video input before submitting reference video fields',
        });
      }
    });
  });

export type BatchGenerateRequest = z.infer<typeof batchGenerateRequestSchema>;
