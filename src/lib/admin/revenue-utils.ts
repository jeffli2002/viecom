import { paymentConfig } from '@/config/payment.config';

const priceMap = new Map<string, number>();

const registerPrice = (priceId: string | undefined, amount: number | undefined) => {
  if (priceId && typeof amount === 'number') {
    priceMap.set(priceId, amount);
  }
};

paymentConfig.plans.forEach((plan) => {
  registerPrice(plan.stripePriceIds?.monthly, plan.price);
  registerPrice(plan.creemPriceIds?.monthly, plan.price);
  if (plan.stripePriceIds?.yearly) {
    registerPrice(plan.stripePriceIds.yearly, plan.yearlyPrice ?? plan.price * 12);
  }
  if (plan.creemPriceIds?.yearly) {
    registerPrice(plan.creemPriceIds.yearly, plan.yearlyPrice ?? plan.price * 12);
  }
});

export const getPlanPriceByPriceId = (priceId?: string | null) => {
  if (!priceId) return 0;
  return priceMap.get(priceId) ?? 0;
};

export const getCreditPackByIdentifier = (productId?: string | null, credits?: number) => {
  if (productId) {
    const pack = paymentConfig.creditPacks.find((pack) => pack.creemProductKey === productId);
    if (pack) {
      return pack;
    }
  }
  if (typeof credits === 'number' && Number.isFinite(credits)) {
    return paymentConfig.creditPacks.find((pack) => pack.credits === credits);
  }
  return undefined;
};
