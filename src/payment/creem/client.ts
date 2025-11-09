import { env } from '@/env';

export const creemConfig = {
  apiKey: env.CREEM_API_KEY || '',
  webhookSecret: env.CREEM_WEBHOOK_SECRET || '',
  proProductKeyMonthly: env.CREEM_PRO_PLAN_PRODUCT_KEY_MONTHLY || '',
  proplusProductKeyMonthly: env.CREEM_PROPLUS_PLAN_PRODUCT_KEY_MONTHLY || '',
  proProductKeyYearly: env.CREEM_PRO_PLAN_PRODUCT_KEY_YEARLY || '',
  proplusProductKeyYearly: env.CREEM_PROPLUS_PLAN_PRODUCT_KEY_YEARLY || '',
};

export const isCreemConfigured = !!creemConfig.apiKey && !!creemConfig.webhookSecret;


