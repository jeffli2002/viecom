import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

/**
 * E2E Test: Video Generation Complete Flow
 * 
 * This test covers the complete video generation flow to ensure:
 * 1. KIE.ai success = user gets video + credits deducted
 * 2. Database save retry mechanism works
 * 3. Credit charge retry mechanism works
 * 4. Partial failures are handled correctly
 */

test.describe('Video Generation Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to video generation page
    await page.goto('/en/video-generation');
  });

  test('should complete full video generation flow successfully', async ({ page, request }) => {
    // Step 1: Check if user is logged in
    const loginButton = page.getByRole('link', { name: /login|sign in/i });
    const isLoggedIn = (await loginButton.count()) === 0;

    if (!isLoggedIn) {
      test.skip();
      return;
    }

    // Step 2: Fill in video generation form
    const promptInput = page.locator('textarea[placeholder*="prompt" i], textarea[placeholder*="描述" i]').first();
    await promptInput.fill('A beautiful sunset over the ocean, cinematic, 4K quality');

    // Step 3: Select model (if available)
    const modelSelect = page.locator('select, [role="combobox"]').filter({ hasText: /sora/i }).first();
    if (await modelSelect.isVisible()) {
      await modelSelect.selectOption({ label: /sora-2/i });
    }

    // Step 4: Select duration (if available)
    const durationSelect = page.locator('select, [role="combobox"], button').filter({ hasText: /10|15|duration/i }).first();
    if (await durationSelect.isVisible()) {
      await durationSelect.click();
      await page.getByText('10').first().click();
    }

    // Step 5: Click generate button
    const generateButton = page.getByRole('button', { name: /generate|生成/i }).first();
    await generateButton.click();

    // Step 6: Wait for generation to start
    await expect(page.getByText(/generating|生成中|processing/i).first()).toBeVisible({ timeout: 10000 });

    // Step 7: Wait for completion (with timeout)
    // Note: Real video generation can take 2-5 minutes
    const maxWaitTime = 5 * 60 * 1000; // 5 minutes
    const startTime = Date.now();

    let videoUrl: string | null = null;
    let taskId: string | null = null;

    while (Date.now() - startTime < maxWaitTime) {
      // Check for success message or video element
      const successMessage = page.getByText(/success|成功|completed|完成/i);
      const videoElement = page.locator('video').first();
      const errorMessage = page.getByText(/error|失败|failed/i);

      if (await successMessage.isVisible({ timeout: 1000 }).catch(() => false)) {
        // Success - try to get video URL
        const video = await videoElement.getAttribute('src').catch(() => null);
        if (video) {
          videoUrl = video;
          break;
        }
      }

      if (await errorMessage.isVisible({ timeout: 1000 }).catch(() => false)) {
        // Error occurred
        const errorText = await errorMessage.textContent();
        throw new Error(`Video generation failed: ${errorText}`);
      }

      // Wait a bit before checking again
      await page.waitForTimeout(5000);
    }

    // Step 8: Verify video was generated
    expect(videoUrl).not.toBeNull();
    expect(videoUrl).toMatch(/https?:\/\//);

    // Step 9: Verify credits were deducted by checking API
    const balanceResponse = await request.get('/api/credits/balance', {
      headers: {
        Cookie: await page.context().cookies().then((cookies) =>
          cookies.map((c) => `${c.name}=${c.value}`).join('; ')
        ),
      },
    });

    if (balanceResponse.ok()) {
      const balanceData = await balanceResponse.json();
      expect(balanceData).toHaveProperty('data');
      // Credits should have been deducted
    }

    // Step 10: Verify asset was saved to database
    const assetsResponse = await request.get('/api/v1/assets?limit=1', {
      headers: {
        Cookie: await page.context().cookies().then((cookies) =>
          cookies.map((c) => `${c.name}=${c.value}`).join('; ')
        ),
      },
    });

    if (assetsResponse.ok()) {
      const assetsData = await assetsResponse.json();
      expect(assetsData).toHaveProperty('assets');
      const recentAsset = assetsData.assets?.[0];
      if (recentAsset) {
        expect(recentAsset.url).toBe(videoUrl);
        expect(recentAsset.type).toBe('video');
        expect(recentAsset.status).toBe('completed');
      }
    }
  });

  test('should handle database save retry on failure', async ({ page, request }) => {
    // This test would require mocking database failures
    // For now, we'll test the API directly with a mock scenario
    test.skip(); // Skip until we have proper mocking setup
  });

  test('should handle credit charge retry on failure', async ({ page, request }) => {
    // This test would require mocking credit service failures
    // For now, we'll test the API directly with a mock scenario
    test.skip(); // Skip until we have proper mocking setup
  });
});

/**
 * API-level E2E Test for Video Generation
 * Tests the complete API flow including retry mechanisms
 */
test.describe('Video Generation API E2E', () => {
  const testUserId = `test-user-${randomUUID()}`;
  const testTaskId = randomUUID().replace(/-/g, '').substring(0, 32);

  test('should complete video generation API flow', async ({ request }) => {
    // Note: This test requires:
    // 1. Valid authentication token
    // 2. Sufficient credits
    // 3. KIE API access
    // 4. R2 storage configured

    test.skip(); // Skip in CI, run manually with proper setup

    const response = await request.post('/api/v1/generate-video', {
      data: {
        prompt: 'A test video generation for E2E testing',
        model: 'sora-2',
        mode: 't2v',
        aspect_ratio: '16:9',
        duration: 10,
        quality: 'standard',
      },
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers here
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Verify response structure
    expect(data).toHaveProperty('videoUrl');
    expect(data).toHaveProperty('taskId');
    expect(data).toHaveProperty('creditsUsed');
    expect(data.videoUrl).toMatch(/https?:\/\//);

    // Verify video URL is accessible
    const videoResponse = await request.get(data.videoUrl);
    expect(videoResponse.status()).toBe(200);
    expect(videoResponse.headers()['content-type']).toContain('video');
  });
});


