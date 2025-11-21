import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CreemApiClient } from '../../packages/creem-subscription/core/api-client';
import { CreemApiError } from '../../packages/creem-subscription/utils/error';

global.fetch = jest.fn() as jest.Mock;

const mockFetch = global.fetch as jest.Mock;

describe('CreemApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Constructor & Configuration', () => {
    it('should auto-detect test mode from API key with creem_test_ prefix', () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123456',
        webhookSecret: 'test_secret',
      });

      expect(client['config'].testMode).toBe(true);
      expect(client['config'].baseUrl).toBe('https://test-api.creem.io');
    });

    it('should auto-detect production mode from API key without test prefix', () => {
      const client = new CreemApiClient({
        apiKey: 'creem_live_123456',
        webhookSecret: 'prod_secret',
      });

      expect(client['config'].testMode).toBe(false);
      expect(client['config'].baseUrl).toBe('https://api.creem.io');
    });

    it('should use custom base URL when provided', () => {
      const customUrl = 'https://custom.creem.io';
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'secret',
        baseUrl: customUrl,
      });

      expect(client['config'].baseUrl).toBe(customUrl);
    });

    it('should use default timeout of 30000ms', () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'secret',
      });

      expect(client['config'].timeout).toBe(30000);
    });

    it('should use custom timeout when provided', () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'secret',
        timeout: 60000,
      });

      expect(client['config'].timeout).toBe(60000);
    });

    it('should throw error if API key is missing', () => {
      expect(() => {
        new CreemApiClient({
          apiKey: '',
          webhookSecret: 'secret',
        });
      }).toThrow('Creem API key is required');
    });

    it('should accept custom logger', () => {
      const mockLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };

      const client = new CreemApiClient(
        {
          apiKey: 'creem_test_123',
          webhookSecret: 'secret',
        },
        mockLogger
      );

      expect(client['logger']).toBe(mockLogger);
    });
  });

  describe('createCheckout', () => {
    it('should create checkout via direct API call', async () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'secret',
      });

      const mockResponse = {
        id: 'checkout_123',
        checkout_url: 'https://checkout.creem.io/session_123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.createCheckout({
        productId: 'prod_test_123',
        successUrl: 'https://example.com/success',
        customer: { email: 'test@example.com' },
      });

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('checkout_123');
      expect(result.url).toBe('https://checkout.creem.io/session_123');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.creem.io/v1/checkouts',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'creem_test_123',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle checkout API errors', async () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'secret',
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid product ID' }),
      });

      const result = await client.createCheckout({
        productId: 'invalid_product',
        successUrl: 'https://example.com/success',
        customer: { email: 'test@example.com' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid product ID');
    });

    it('should include metadata in checkout request', async () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'secret',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'checkout_123',
          checkout_url: 'https://checkout.creem.io/session_123',
        }),
      });

      await client.createCheckout({
        productId: 'prod_test_123',
        successUrl: 'https://example.com/success',
        customer: { email: 'test@example.com' },
        metadata: {
          userId: 'user_123',
          planId: 'pro',
        },
      });

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.metadata).toEqual({
        userId: 'user_123',
        planId: 'pro',
      });
    });

    it('should handle network timeout', async () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'secret',
        timeout: 1000,
      });

      mockFetch.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Network timeout'));
          }, 2000);
        });
      });

      const result = await client.createCheckout({
        productId: 'prod_test_123',
        successUrl: 'https://example.com/success',
        customer: { email: 'test@example.com' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getSubscription', () => {
    it('should fetch subscription by ID', async () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'secret',
      });

      const mockSubscription = {
        id: 'sub_123',
        status: 'active',
        customer_id: 'cus_123',
        product_id: 'prod_123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscription,
      });

      const result = await client.getSubscription('sub_123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSubscription);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.creem.io/v1/subscriptions/sub_123',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle subscription not found error', async () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'secret',
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Subscription not found' }),
      });

      const result = await client.getSubscription('sub_nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Subscription not found');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription via direct API', async () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'secret',
      });

      const mockResponse = {
        id: 'sub_123',
        status: 'canceled',
        cancel_at_period_end: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.cancelSubscription('sub_123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.creem.io/v1/subscriptions/sub_123',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle cancellation errors', async () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'secret',
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Cannot cancel subscription' }),
      });

      const result = await client.cancelSubscription('sub_123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot cancel subscription');
    });
  });

  describe('upgradeSubscription', () => {
    it('should upgrade subscription without proration', async () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'secret',
      });

      const mockResponse = {
        id: 'sub_123',
        product_id: 'prod_new_456',
        status: 'active',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.upgradeSubscription('sub_123', 'prod_new_456', {
        useProration: false,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.product_id).toBe('prod_new_456');
      expect(requestBody.update_behavior).toBe('proration-none');
    });

    it('should upgrade subscription with proration', async () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'secret',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'sub_123',
          product_id: 'prod_new_456',
        }),
      });

      await client.upgradeSubscription('sub_123', 'prod_new_456', {
        useProration: true,
      });

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.update_behavior).toBe('proration');
    });

    it('should handle upgrade errors', async () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'secret',
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid product for upgrade' }),
      });

      const result = await client.upgradeSubscription('sub_123', 'invalid_prod');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid product for upgrade');
    });
  });

  describe('generateCustomerPortalLink', () => {
    it('should generate customer portal link', async () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'secret',
      });

      const mockResponse = {
        url: 'https://portal.creem.io/session_123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.generateCustomerPortalLink(
        'cus_123',
        'https://example.com/billing'
      );

      expect(result.success).toBe(true);
      expect(result.data?.url).toBe('https://portal.creem.io/session_123');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.creem.io/v1/portal_sessions',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should include return URL in portal request', async () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'secret',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://portal.creem.io/session_123' }),
      });

      await client.generateCustomerPortalLink('cus_123', 'https://example.com/billing');

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.customer).toBe('cus_123');
      expect(requestBody.return_url).toBe('https://example.com/billing');
    });

    it('should handle portal link generation errors', async () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'secret',
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid customer ID' }),
      });

      const result = await client.generateCustomerPortalLink('invalid_cus', 'https://example.com');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid customer ID');
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'test_secret',
      });

      const payload = '{"event":"test"}';
      const crypto = require('node:crypto');
      const hmac = crypto.createHmac('sha256', 'test_secret');
      const validSignature = hmac.update(payload).digest('hex');

      const isValid = client.verifyWebhookSignature(payload, validSignature);
      expect(isValid).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'test_secret',
      });

      const payload = '{"event":"test"}';
      const invalidSignature = 'invalid_signature_123';

      const isValid = client.verifyWebhookSignature(payload, invalidSignature);
      expect(isValid).toBe(false);
    });

    it('should reject signature with wrong secret', () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'test_secret',
      });

      const payload = '{"event":"test"}';
      const crypto = require('node:crypto');
      const hmac = crypto.createHmac('sha256', 'wrong_secret');
      const wrongSignature = hmac.update(payload).digest('hex');

      const isValid = client.verifyWebhookSignature(payload, wrongSignature);
      expect(isValid).toBe(false);
    });
  });

  describe('parseWebhookEvent', () => {
    it('should parse valid webhook event', () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'secret',
      });

      const payload = '{"event":"subscription.created","data":{"id":"sub_123"}}';
      const event = client.parseWebhookEvent(payload);

      expect(event.event).toBe('subscription.created');
      expect(event.data).toEqual({ id: 'sub_123' });
    });

    it('should throw error for invalid JSON', () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'secret',
      });

      const invalidPayload = '{invalid json}';

      expect(() => {
        client.parseWebhookEvent(invalidPayload);
      }).toThrow('Invalid webhook event payload');
    });
  });

  describe('Error Handling', () => {
    it('should return CreemApiError with status code', async () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'secret',
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'API key invalid' }),
      });

      const result = await client.createCheckout({
        productId: 'prod_test',
        successUrl: 'https://example.com/success',
        customer: { email: 'test@example.com' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('API key invalid');
    });

    it('should handle malformed error responses', async () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'secret',
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await client.getSubscription('sub_123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle network errors', async () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'secret',
      });

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.createCheckout({
        productId: 'prod_test',
        successUrl: 'https://example.com/success',
        customer: { email: 'test@example.com' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('Request Headers', () => {
    it('should include API key in request headers', async () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123456',
        webhookSecret: 'secret',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'sub_123' }),
      });

      await client.getSubscription('sub_123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': 'creem_test_123456',
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('URL Construction', () => {
    it('should use test API URL for test mode', async () => {
      const client = new CreemApiClient({
        apiKey: 'creem_test_123',
        webhookSecret: 'secret',
        testMode: true,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'sub_123' }),
      });

      await client.getSubscription('sub_123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.creem.io/v1/subscriptions/sub_123',
        expect.any(Object)
      );
    });

    it('should use production API URL for production mode', async () => {
      const client = new CreemApiClient({
        apiKey: 'creem_live_123',
        webhookSecret: 'secret',
        testMode: false,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'sub_123' }),
      });

      await client.getSubscription('sub_123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.creem.io/v1/subscriptions/sub_123',
        expect.any(Object)
      );
    });
  });
});
