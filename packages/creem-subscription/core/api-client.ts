import type {
  CreemApiConfig,
  CheckoutRequest,
  CheckoutResult,
  ApiResult,
} from '../types/config';
import type { Logger } from '../types/adapters';
import { ConsoleLogger } from '../types/adapters';
import { verifyWebhookSignature } from '../utils/crypto';
import { getErrorMessage, CreemApiError } from '../utils/error';

export class CreemApiClient {
  private readonly config: Required<CreemApiConfig>;
  private readonly logger: Logger;

  constructor(config: CreemApiConfig, logger?: Logger) {
    this.config = {
      apiKey: config.apiKey,
      webhookSecret: config.webhookSecret,
      testMode: config.testMode ?? this.detectTestMode(config.apiKey),
      baseUrl: config.baseUrl ?? this.getDefaultBaseUrl(config.apiKey),
      timeout: config.timeout ?? 30000,
    };
    this.logger = logger ?? new ConsoleLogger('[Creem API]');

    if (!this.config.apiKey) {
      throw new Error('Creem API key is required');
    }
  }

  private detectTestMode(apiKey: string): boolean {
    if (apiKey.startsWith('creem_test_')) {
      return true;
    }
    if (apiKey.startsWith('creem_') && !apiKey.startsWith('creem_test_')) {
      return false;
    }
    return false;
  }

  private getDefaultBaseUrl(apiKey: string): string {
    const isTestMode = this.detectTestMode(apiKey);
    return isTestMode ? 'https://test-api.creem.io' : 'https://api.creem.io';
  }

  /**
   * Create a checkout session for subscription or one-time payment
   */
  async createCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
    try {
      this.logger.info('Creating checkout', {
        productId: request.productId,
        customer: request.customer?.email,
        testMode: this.config.testMode,
      });

      // Try SDK first
      try {
        const result = await this.createCheckoutWithSdk(request);
        if (result.success) {
          return result;
        }
      } catch (sdkError) {
        this.logger.debug('SDK not available, falling back to direct API call');
      }

      // Fallback to direct API call
      return await this.createCheckoutDirect(request);
    } catch (error) {
      const message = getErrorMessage(error);
      this.logger.error('Create checkout failed:', message);
      return {
        success: false,
        error: message,
      };
    }
  }

  private async createCheckoutWithSdk(request: CheckoutRequest): Promise<CheckoutResult> {
    const { Creem } = await import('creem');
    const creem = new Creem({
      serverIdx: this.config.testMode ? 1 : 0,
    });

    const checkout = await creem.createCheckout({
      xApiKey: this.config.apiKey,
      createCheckoutRequest: request,
    });

    if (!checkout.checkoutUrl) {
      throw new Error('No checkout URL in response');
    }

    this.logger.info('Checkout created via SDK', {
      id: checkout.id,
      url: checkout.checkoutUrl,
    });

    return {
      success: true,
      sessionId: checkout.id,
      url: checkout.checkoutUrl,
    };
  }

  private async createCheckoutDirect(request: CheckoutRequest): Promise<CheckoutResult> {
    const response = await this.fetch('/v1/checkouts', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new CreemApiError(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }

    const checkout = await response.json();

    this.logger.info('Checkout created via direct API', {
      id: checkout.id || checkout.checkout_id,
      url: checkout.checkoutUrl || checkout.checkout_url,
    });

    return {
      success: true,
      sessionId: checkout.id || checkout.checkout_id,
      url: checkout.checkoutUrl || checkout.checkout_url,
    };
  }

  /**
   * Get subscription details by ID
   */
  async getSubscription(subscriptionId: string): Promise<ApiResult> {
    try {
      this.logger.debug('Fetching subscription', { subscriptionId });

      // Try SDK first
      try {
        const result = await this.getSubscriptionWithSdk(subscriptionId);
        if (result.success) {
          return result;
        }
      } catch (sdkError) {
        this.logger.debug('SDK not available, using direct API');
      }

      // Fallback to direct API
      return await this.getSubscriptionDirect(subscriptionId);
    } catch (error) {
      const message = getErrorMessage(error);
      this.logger.error('Get subscription failed:', message);
      return {
        success: false,
        error: message,
      };
    }
  }

  private async getSubscriptionWithSdk(subscriptionId: string): Promise<ApiResult> {
    const { Creem } = await import('creem');
    const creem = new Creem({
      serverIdx: this.config.testMode ? 1 : 0,
    });

    const subscription = await creem.getSubscription({
      id: subscriptionId,
      xApiKey: this.config.apiKey,
    });

    return {
      success: true,
      data: subscription,
    };
  }

  private async getSubscriptionDirect(subscriptionId: string): Promise<ApiResult> {
    const response = await this.fetch(`/v1/subscriptions/${subscriptionId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new CreemApiError(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }

    const subscription = await response.json();
    return {
      success: true,
      data: subscription,
    };
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<ApiResult> {
    try {
      this.logger.info('Cancelling subscription', { subscriptionId });

      // Try SDK first
      try {
        const result = await this.cancelSubscriptionWithSdk(subscriptionId);
        if (result.success) {
          return result;
        }
      } catch (sdkError) {
        this.logger.debug('SDK not available, using direct API');
      }

      // Fallback to direct API
      return await this.cancelSubscriptionDirect(subscriptionId);
    } catch (error) {
      const message = getErrorMessage(error);
      this.logger.error('Cancel subscription failed:', message);
      return {
        success: false,
        error: message,
      };
    }
  }

  private async cancelSubscriptionWithSdk(subscriptionId: string): Promise<ApiResult> {
    const { Creem } = await import('creem');
    const creem = new Creem({
      serverIdx: this.config.testMode ? 1 : 0,
    });

    const result = await creem.cancelSubscription({
      id: subscriptionId,
      xApiKey: this.config.apiKey,
    });

    this.logger.info('Subscription cancelled via SDK', { subscriptionId });

    return {
      success: true,
      data: result,
    };
  }

  private async cancelSubscriptionDirect(subscriptionId: string): Promise<ApiResult> {
    const response = await this.fetch(`/v1/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new CreemApiError(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }

    const result = await response.json();

    this.logger.info('Subscription cancelled via direct API', { subscriptionId });

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Upgrade a subscription to a new product
   */
  async upgradeSubscription(
    subscriptionId: string,
    newProductId: string,
    options?: { useProration?: boolean }
  ): Promise<ApiResult> {
    try {
      this.logger.info('Upgrading subscription', {
        subscriptionId,
        newProductId,
        useProration: options?.useProration,
      });

      const response = await this.fetch(`/v1/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          product_id: newProductId,
          update_behavior: options?.useProration ? 'proration' : 'proration-none',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new CreemApiError(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData
        );
      }

      const result = await response.json();

      this.logger.info('Subscription upgraded', { subscriptionId, newProductId });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const message = getErrorMessage(error);
      this.logger.error('Upgrade subscription failed:', message);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Generate customer portal link
   */
  async generateCustomerPortalLink(customerId: string, returnUrl: string): Promise<ApiResult<{ url: string }>> {
    try {
      this.logger.info('Generating customer portal link', { customerId });

      const response = await this.fetch('/v1/portal_sessions', {
        method: 'POST',
        body: JSON.stringify({
          customer: customerId,
          return_url: returnUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new CreemApiError(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData
        );
      }

      const result = await response.json();

      this.logger.info('Customer portal link generated', { url: result.url });

      return {
        success: true,
        data: { url: result.url },
      };
    } catch (error) {
      const message = getErrorMessage(error);
      this.logger.error('Generate portal link failed:', message);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    return verifyWebhookSignature(payload, signature, this.config.webhookSecret);
  }

  /**
   * Parse webhook event
   */
  parseWebhookEvent(rawEvent: string): Record<string, unknown> {
    try {
      return JSON.parse(rawEvent);
    } catch (error) {
      throw new Error('Invalid webhook event payload');
    }
  }

  /**
   * Internal fetch wrapper with default headers and timeout
   */
  private async fetch(path: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.config.baseUrl}${path}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'x-api-key': this.config.apiKey,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
