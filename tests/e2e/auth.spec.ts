import { expect, test } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page should be reachable and show form', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Ensure URL includes login (locale redirects allowed)
    await expect(page).toHaveURL(/login/i);

    // Form fields should be visible
    await expect(page.getByLabel(/email/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel(/password/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('signup page should be reachable and show form', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'domcontentloaded', timeout: 60000 });

    await expect(page).toHaveURL(/signup/i);

    await expect(page.getByLabel(/email/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel(/password/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel(/confirm password/i).first()).toBeVisible({ timeout: 10_000 });
  });
});
