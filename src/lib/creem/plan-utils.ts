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

export interface PlanCreditInfo {
  plan: (typeof paymentConfig.plans)[number] | null;
  planId: string;
  interval: BillingInterval;
  amount: number;
  identifier: string;
}

/**
 * Calculate the credit allocation for a plan/price identifier.
 */
export function getCreditsForPlan(identifier: string, interval?: BillingInterval): PlanCreditInfo {
  const resolved = resolvePlanByIdentifier(identifier, interval);

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


