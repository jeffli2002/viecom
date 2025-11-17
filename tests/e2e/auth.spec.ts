import { expect, test } from '@playwright/test';

test.describe('Authentication', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');

    // Try to find and click login link
    const loginLink = page.getByRole('link', { name: /login|sign in/i }).first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/.*login.*/i);
    }
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/');

    // Try to find and click signup link
    const signupLink = page.getByRole('link', { name: /sign up|signup|register/i }).first();
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await expect(page).toHaveURL(/.*signup|register.*/i);
    }
  });
});
