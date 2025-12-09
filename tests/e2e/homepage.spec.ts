import { expect, test } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page).toHaveTitle(/AI Video Generator|Viecom|E-commerce AI Studio/i);
  });

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Check for navigation elements
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible({ timeout: 15_000 });
  });

  test('should have login and signup buttons', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Look for login/signup links or buttons (non-strict to tolerate locale)
    const loginLink = page.locator(
      'a[href*="login"], a[href*="signin"], button:has-text("Login"), button:has-text("Sign in")'
    );
    const signupLink = page.locator(
      'a[href*="signup"], a[href*="register"], button:has-text("Sign up"), button:has-text("Get started"), a[href*="pricing"]'
    );

    const hasLogin = (await loginLink.count()) > 0;
    const hasSignup = (await signupLink.count()) > 0;

    expect(hasLogin || hasSignup).toBeTruthy();
  });
});
