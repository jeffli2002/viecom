import { expect, test } from '@playwright/test';

test.describe('Pricing Page', () => {
  test('should load pricing page successfully', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page).toHaveTitle(/pricing/i);
  });

  test('should display pricing plans', async ({ page }) => {
    await page.goto('/pricing');

    // Check for plan cards or pricing information
    const pricingSection = page.locator('[class*="pricing"], [class*="plan"]').first();
    await expect(pricingSection).toBeVisible();
  });

  test('should display free plan', async ({ page }) => {
    await page.goto('/pricing');

    // Look for free plan
    const freePlan = page.getByText(/free/i).first();
    await expect(freePlan).toBeVisible();
  });

  test('should display pro plan', async ({ page }) => {
    await page.goto('/pricing');

    // Look for pro plan
    const proPlan = page.getByText(/pro/i).first();
    await expect(proPlan).toBeVisible();
  });
});
