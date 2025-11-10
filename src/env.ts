import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DISABLE_AUTH: z.string().optional().default('false'),
    BETTER_AUTH_SECRET: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().email().optional(),
    R2_BUCKET_NAME: z.string().optional().default('dummy'),
    R2_ACCESS_KEY_ID: z.string().optional().default('dummy'),
    R2_SECRET_ACCESS_KEY: z.string().optional().default('dummy'),
    R2_ENDPOINT: z.string().optional().default('https://dummy.r2.cloudflarestorage.com'),
    R2_PUBLIC_URL: z.string().optional().default('https://dummy.com'),
    // KIE API
    KIE_API_KEY: z.string(),
    KIE_IMAGE_T2I_MODEL: z.string().optional(),
    KIE_IMAGE_I2I_MODEL: z.string().optional(),
    // DeepSeek API (for prompt enhancement and brand analysis)
    DEEPSEEK_API_KEY: z.string().optional(),
    // Firecrawl API (for website scraping)
    FIRECRAWL_API_KEY: z.string().optional(),
    // OpenRouter API (for image generation with Gemini)
    OPENROUTER_API_KEY: z.string().optional(),
    // Admin Configuration
    ADMIN_EMAILS: z.string().optional().default(''),
    // Cron Security
    CRON_SECRET: z.string().optional().default('dummy'),
    // Redis for queue (optional)
    REDIS_URL: z.string().optional(),
    // Creem Payment
    CREEM_API_KEY: z.string().optional(),
    CREEM_WEBHOOK_SECRET: z.string().optional(),
    CREEM_PRO_PLAN_PRODUCT_KEY_MONTHLY: z.string().optional(),
    CREEM_PROPLUS_PLAN_PRODUCT_KEY_MONTHLY: z.string().optional(),
    CREEM_PRO_PLAN_PRODUCT_KEY_YEARLY: z.string().optional(),
    CREEM_PROPLUS_PLAN_PRODUCT_KEY_YEARLY: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_DISABLE_AUTH: z.string().optional().default('false'),
    NEXT_PUBLIC_CREEM_TEST_MODE: z.string().optional().default('false'),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    DISABLE_AUTH: process.env.DISABLE_AUTH,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_ENDPOINT: process.env.R2_ENDPOINT,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
    KIE_API_KEY: process.env.KIE_API_KEY,
    KIE_IMAGE_T2I_MODEL: process.env.KIE_IMAGE_T2I_MODEL,
    KIE_IMAGE_I2I_MODEL: process.env.KIE_IMAGE_I2I_MODEL,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_DISABLE_AUTH: process.env.NEXT_PUBLIC_DISABLE_AUTH,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    CRON_SECRET: process.env.CRON_SECRET,
    REDIS_URL: process.env.REDIS_URL,
    CREEM_API_KEY: process.env.CREEM_API_KEY,
    CREEM_WEBHOOK_SECRET: process.env.CREEM_WEBHOOK_SECRET,
    CREEM_PRO_PLAN_PRODUCT_KEY_MONTHLY: process.env.CREEM_PRO_PLAN_PRODUCT_KEY_MONTHLY,
    CREEM_PROPLUS_PLAN_PRODUCT_KEY_MONTHLY: process.env.CREEM_PROPLUS_PLAN_PRODUCT_KEY_MONTHLY,
    CREEM_PRO_PLAN_PRODUCT_KEY_YEARLY: process.env.CREEM_PRO_PLAN_PRODUCT_KEY_YEARLY,
    CREEM_PROPLUS_PLAN_PRODUCT_KEY_YEARLY: process.env.CREEM_PROPLUS_PLAN_PRODUCT_KEY_YEARLY,
    NEXT_PUBLIC_CREEM_TEST_MODE: process.env.NEXT_PUBLIC_CREEM_TEST_MODE,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
