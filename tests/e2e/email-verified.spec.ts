import { test, expect } from '@playwright/test';

test.describe('Email verification auto sign-in', () => {
  test('redirects to callbackUrl after session refresh', async ({ page }) => {
    // Mock session endpoint to simulate a freshly verified user session
    await page.route('**/api/auth/get-session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            user: {
              id: 'user_123',
              email: 'verified@example.com',
              name: 'Verified User',
            },
          },
        }),
      });
    });

    // Visit the email-verified page with a desired callback target
    await page.goto('/en/email-verified?callbackUrl=%2Fimage-generation', {
      waitUntil: 'domcontentloaded',
    });

    // The page refreshes session and redirects to callbackUrl
    await expect(page).toHaveURL(/\/en\/image-generation$/);
  });

  test('defaults to dashboard when no callbackUrl provided', async ({ page }) => {
    await page.route('**/api/auth/get-session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            user: {
              id: 'user_456',
              email: 'verified2@example.com',
              name: 'Verified Two',
            },
          },
        }),
      });
    });

    await page.goto('/en/email-verified', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/en\/dashboard$/);
  });
});

