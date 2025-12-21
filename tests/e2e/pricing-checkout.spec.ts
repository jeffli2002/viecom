import { expect, test } from '@playwright/test';

test.describe('Pricing checkout', () => {
  test('authenticated click on paid plan triggers create-checkout request', async ({ page }) => {
    await page.addInitScript(() => {
      const now = Date.now();
      localStorage.setItem(
        'ecommerce-ai-auth',
        JSON.stringify({
          state: {
            user: {
              id: 'e2e-user',
              email: 'e2e@example.com',
              name: 'E2E User',
              emailVerified: true,
              image: null,
              createdAt: new Date(now).toISOString(),
              updatedAt: new Date(now).toISOString(),
            },
            isAuthenticated: true,
            lastUpdated: now,
            cacheExpiry: 10 * 60 * 1000,
          },
          version: 1,
        })
      );
    });

    await page.route('**/api/auth/get-session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          authenticated: true,
          session: {
            user: {
              id: 'e2e-user',
              email: 'e2e@example.com',
              name: 'E2E User',
              emailVerified: true,
              image: null,
            },
          },
        }),
      });
    });

    await page.route('**/api/credits/initialize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { signupCreditsGranted: 0 } }),
      });
    });

    await page.route('**/api/credits/check', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ hasAccount: true }),
      });
    });

    await page.route('**/api/creem/subscription', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ subscription: null }),
      });
    });

    await page.goto('/pricing', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible({ timeout: 20_000 });

    await page.evaluate(() => {
      // Capture and mock the checkout request in the browser so we can assert it fired,
      // without depending on real payment providers or server-side auth.
      window.__e2eCheckoutCalls = [];
      const originalFetch = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : input?.url || '';
        if (url.includes('/api/payment/create-checkout')) {
          window.__e2eCheckoutCalls.push({
            url,
            body: typeof init?.body === 'string' ? init.body : '',
          });
          return new Response(
            JSON.stringify({
              success: true,
              sessionId: 'e2e-checkout',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return originalFetch(input, init);
      };
    });

    const proTitle = page.locator('[data-slot="card-title"]', { hasText: /^pro$/i });
    await expect(proTitle).toBeVisible({ timeout: 15_000 });

    const proCard = page.locator('[data-slot="card"]').filter({ has: proTitle });
    const purchaseButton = proCard.getByRole('button').first();

    await expect(purchaseButton).toBeEnabled({ timeout: 15_000 });
    await purchaseButton.click({ timeout: 15_000 });

    await expect
      .poll(
        () =>
          page.evaluate(() => {
            return (window.__e2eCheckoutCalls || []).length;
          }),
        { timeout: 15_000 }
      )
      .toBe(1);

    const calls = await page.evaluate(() => window.__e2eCheckoutCalls || []);
    expect(calls[0]?.body || '').toContain('"planId":"pro"');
  });
});
