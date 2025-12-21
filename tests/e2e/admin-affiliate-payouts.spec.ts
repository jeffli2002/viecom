import { expect, test } from '@playwright/test';

test.describe('Admin Affiliate Payouts', () => {
  test('should require admin login', async ({ page }) => {
    await page.goto('/admin/affiliate-payouts', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(page).toHaveURL(/\/admin\/login/i);
    await expect(page.getByText(/admin/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
