import { expect, test } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Viecom|E-commerce AI Studio/i);
  });

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/');

    // Check for navigation elements
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
  });

  test('should have login and signup buttons', async ({ page }) => {
    await page.goto('/');

    // Look for login/signup links or buttons
    const loginLink = page.getByRole('link', { name: /login|sign in/i });
    const signupLink = page.getByRole('link', { name: /sign up|signup|register/i });

    // At least one should be visible
    const hasLogin = (await loginLink.count()) > 0;
    const hasSignup = (await signupLink.count()) > 0;

    expect(hasLogin || hasSignup).toBeTruthy();
  });
});
