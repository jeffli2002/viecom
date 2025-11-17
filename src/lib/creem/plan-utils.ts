import { paymentConfig } from '@/config/payment.config';

export type BillingInterval = 'month' | 'year';

export interface ResolvedPlan {
  plan: (typeof paymentConfig.plans)[number];
  interval: BillingInterval;
  identifier: string;
}

/**
 * Resolve a plan configuration from a given identifier. Supports plan IDs as well as
 * Stripe and Creem price identifiers so downstream logic can work with normalized data.
 */
export function resolvePlanByIdentifier(
  identifier?: string,
  fallbackInterval?: BillingInterval
): ResolvedPlan | null {
  if (!identifier) {
    return null;
  }

  for (const plan of paymentConfig.plans) {
    if (plan.id === identifier) {
      return {
        plan,
        interval: fallbackInterval || (plan.interval === 'year' ? 'year' : 'month'),
        identifier,
      };
    }

    if (plan.stripePriceIds?.monthly === identifier) {
      return { plan, interval: 'month', identifier };
    }

    if (plan.stripePriceIds?.yearly === identifier) {
      return { plan, interval: 'year', identifier };
    }

    if (plan.creemPriceIds?.monthly === identifier) {
      return { plan, interval: 'month', identifier };
    }

    if (plan.creemPriceIds?.yearly === identifier) {
      return { plan, interval: 'year', identifier };
    }
  }

  return null;
}

/**
 * Resolve plan by known product identifiers (e.g., Creem product keys).
 * Useful when database stores productId rather than priceId.
 */
export function resolvePlanByProductId(
  productId?: string,
  interval?: BillingInterval
): ResolvedPlan | null {
  if (!productId) return null;

  // Map known Creem product keys to plan ids
  const productKeyToPlanId: Record<string, { id: 'pro' | 'proplus'; interval: BillingInterval }> =
    {};

  if (paymentConfig.creem.proProductKeyMonthly) {
    productKeyToPlanId[paymentConfig.creem.proProductKeyMonthly] = { id: 'pro', interval: 'month' };
  }
  if (paymentConfig.creem.proProductKeyYearly) {
    productKeyToPlanId[paymentConfig.creem.proProductKeyYearly] = { id: 'pro', interval: 'year' };
  }
  if (paymentConfig.creem.proplusProductKeyMonthly) {
    productKeyToPlanId[paymentConfig.creem.proplusProductKeyMonthly] = {
      id: 'proplus',
      interval: 'month',
    };
  }
  if (paymentConfig.creem.proplusProductKeyYearly) {
    productKeyToPlanId[paymentConfig.creem.proplusProductKeyYearly] = {
      id: 'proplus',
      interval: 'year',
    };
  }

  // Debug: log mapping table and lookup
  if (Object.keys(productKeyToPlanId).length > 0) {
    console.log('[Plan Utils] Product mapping table:', Object.keys(productKeyToPlanId));
    console.log('[Plan Utils] Looking up productId:', productId);
  }

  const mapped = productKeyToPlanId[productId];
  if (!mapped) {
    console.log('[Plan Utils] No mapping found for productId:', productId);
    return null;
  }

  const plan = paymentConfig.plans.find((p) => p.id === mapped.id);
  if (!plan) return null;

  return {
    plan,
    interval: interval || mapped.interval,
    identifier: productId,
  };
}

export interface PlanCreditInfo {
  plan: (typeof paymentConfig.plans)[number] | null;
  planId: string;
  interval: BillingInterval;
  amount: number;
  identifier: string;
}

/**
 * Calculate the credit allocation for a plan/price identifier.
 * Tries resolvePlanByIdentifier first, then resolvePlanByProductId as fallback.
 */
export function getCreditsForPlan(identifier: string, interval?: BillingInterval): PlanCreditInfo {
  // Try to resolve by identifier (priceId) first
  let resolved = resolvePlanByIdentifier(identifier, interval);

  // If not resolved and identifier looks like a product ID (starts with 'prod_'), try product ID resolution
  if (!resolved && identifier.startsWith('prod_')) {
    resolved = resolvePlanByProductId(identifier, interval);
  }

  if (!resolved) {
    return {
      plan: null,
      planId: identifier,
      interval: interval || 'month',
      amount: 0,
      identifier,
    };
  }

  const { plan } = resolved;
  const effectiveInterval: BillingInterval = interval || resolved.interval;

  const monthlyCredits = plan.credits?.monthly ?? 0;

  const amount = effectiveInterval === 'year' ? monthlyCredits * 12 : monthlyCredits;

  return {
    plan,
    planId: plan.id,
    interval: effectiveInterval,
    amount,
    identifier,
  };
}

export function formatPlanName(
  plan: (typeof paymentConfig.plans)[number] | null,
  fallback: string
): string {
  if (plan?.name) {
    return plan.name;
  }

  return fallback.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
