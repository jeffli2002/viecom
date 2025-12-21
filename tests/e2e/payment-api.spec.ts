import { expect, test } from '@playwright/test';

test.describe('Payment API', () => {
  test('create-checkout should reject unauthenticated requests', async ({ request }) => {
    const response = await request.post('/api/payment/create-checkout', {
      data: {
        planId: 'pro',
        interval: 'month',
        successUrl: 'http://localhost:3000/settings/billing?success=true',
        cancelUrl: 'http://localhost:3000/settings/billing?canceled=true',
      },
    });

    expect(response.status()).toBe(401);
    const payload = await response.json().catch(() => ({}));
    expect(payload).toHaveProperty('error');
  });
});
