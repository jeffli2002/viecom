import { paymentConfig } from '@/config/payment.config';
import { formatPlanName, getCreditsForPlan, resolvePlanByIdentifier } from '@/lib/creem/plan-utils';
import { describe, expect, it } from '@jest/globals';

describe('Plan Utils', () => {
  describe('resolvePlanByIdentifier', () => {
    it('should resolve plan by plan ID', () => {
      const result = resolvePlanByIdentifier('free');
      expect(result).toBeDefined();
      expect(result?.plan.id).toBe('free');
    });

    it('should resolve plan by Creem monthly price ID', () => {
      const proPlan = paymentConfig.plans.find((p) => p.id === 'pro');
      if (proPlan?.creemPriceIds?.monthly) {
        const result = resolvePlanByIdentifier(proPlan.creemPriceIds.monthly);
        expect(result).toBeDefined();
        expect(result?.plan.id).toBe('pro');
        expect(result?.interval).toBe('month');
      }
    });

    it('should resolve plan by Creem yearly price ID', () => {
      const proPlan = paymentConfig.plans.find((p) => p.id === 'pro');
      if (proPlan?.creemPriceIds?.yearly) {
        const result = resolvePlanByIdentifier(proPlan.creemPriceIds.yearly);
        expect(result).toBeDefined();
        expect(result?.plan.id).toBe('pro');
        expect(result?.interval).toBe('year');
      }
    });

    it('should return null for unknown identifier', () => {
      const result = resolvePlanByIdentifier('unknown-plan-id');
      expect(result).toBeNull();
    });

    it('should return null for empty identifier', () => {
      const result = resolvePlanByIdentifier('');
      expect(result).toBeNull();
    });
  });

  describe('getCreditsForPlan', () => {
    it('should return correct credits for free plan', () => {
      const result = getCreditsForPlan('free', 'month');
      expect(result.planId).toBe('free');
      expect(result.amount).toBe(0);
    });

    it('should return correct credits for pro monthly plan', () => {
      const result = getCreditsForPlan('pro', 'month');
      expect(result.planId).toBe('pro');
      expect(result.amount).toBeGreaterThan(0);
      expect(result.interval).toBe('month');
    });

    it('should return correct credits for pro yearly plan', () => {
      const result = getCreditsForPlan('pro', 'year');
      expect(result.planId).toBe('pro');
      expect(result.amount).toBeGreaterThan(0);
      expect(result.interval).toBe('year');
      // Yearly should have more credits than monthly
      const monthlyResult = getCreditsForPlan('pro', 'month');
      expect(result.amount).toBeGreaterThan(monthlyResult.amount);
    });

    it('should return correct credits for proplus monthly plan', () => {
      const result = getCreditsForPlan('proplus', 'month');
      expect(result.planId).toBe('proplus');
      expect(result.amount).toBeGreaterThan(0);
      expect(result.interval).toBe('month');
    });

    it('should return correct credits for proplus yearly plan', () => {
      const result = getCreditsForPlan('proplus', 'year');
      expect(result.planId).toBe('proplus');
      expect(result.amount).toBeGreaterThan(0);
      expect(result.interval).toBe('year');
      // Yearly should have more credits than monthly
      const monthlyResult = getCreditsForPlan('proplus', 'month');
      expect(result.amount).toBeGreaterThan(monthlyResult.amount);
    });

    it('should return 0 credits for unknown plan', () => {
      const result = getCreditsForPlan('unknown-plan', 'month');
      expect(result.amount).toBe(0);
      expect(result.plan).toBeNull();
    });
  });

  describe('formatPlanName', () => {
    it('should format plan name correctly', () => {
      const freePlan = paymentConfig.plans.find((p) => p.id === 'free');
      if (freePlan) {
        const result = formatPlanName(freePlan, 'free');
        expect(result).toBe(freePlan.name);
      }
    });

    it('should format pro plan name correctly', () => {
      const proPlan = paymentConfig.plans.find((p) => p.id === 'pro');
      if (proPlan) {
        const result = formatPlanName(proPlan, 'pro');
        expect(result).toBe(proPlan.name);
      }
    });
  });
});
