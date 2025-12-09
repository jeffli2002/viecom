import { expect, test } from '@playwright/test';

test.describe('Pricing Page', () => {
  test('should load pricing page successfully', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page).toHaveURL(/pricing/i);
    await expect(page.getByText(/pricing/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('should display pricing plans', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Check for plan titles; expect at least 3 plans (Free, Pro, Pro+)
    const planTitles = page.locator('[data-slot="card-title"]');
    await expect(planTitles).toHaveCount(3, { timeout: 15_000 });
  });

  test('should display free plan', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page.getByText(/free/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('should display pro plan', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page.getByText(/pro\+?/i).first().or(page.getByText(/^pro$/i).first())).toBeVisible({
      timeout: 15_000,
    });
  });
});
