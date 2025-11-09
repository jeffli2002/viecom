import { createHmac } from 'node:crypto';
import type {
  CreatePaymentParams,
  CreateSubscriptionParams,
  CreemCheckoutParams,
  CreemSubscriptionParams,
  PaymentProvider,
  PaymentResult,
  PaymentStatus,
  SubscriptionResult,
  UpdateSubscriptionParams,
} from '@/payment/types';
import { creemConfig } from './client';

export class CreemProvider implements PaymentProvider {
  private apiKey: string;
  private baseUrl = 'https://api.creem.io/v1';

  constructor() {
    this.apiKey = creemConfig.apiKey;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[CreemProvider] Request error:', error);
      throw error;
    }
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    try {
      const { userId, priceId, successUrl, cancelUrl, metadata } = params;

      const requestBody: any = {
        product_id: priceId,
        success_url:
          successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
        metadata: {
          userId,
          ...metadata,
        },
      };

      if (metadata?.email) {
        requestBody.customer = {
          email: metadata.email,
        };
      }

      const response = await this.makeRequest<{
        checkout_url: string;
        checkout_id: string;
      }>('/checkouts', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      return {
        id: response.checkout_id,
        status: 'pending' as PaymentStatus,
        url: response.checkout_url,
        customerId: params.customerId || '',
      };
    } catch (error) {
      console.error('[CreemProvider] Create payment error:', error);
      throw error;
    }
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
    try {
      const { userId, priceId, trialPeriodDays, metadata } = params;

      const requestBody: any = {
        product_id: priceId,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
        metadata: {
          userId,
          ...metadata,
        },
      };

      if (metadata?.email) {
        requestBody.customer = {
          email: metadata.email,
        };
      }

      if (trialPeriodDays) {
        requestBody.trial_period_days = trialPeriodDays;
      }

      const response = await this.makeRequest<{
        checkout_url: string;
        checkout_id: string;
      }>('/checkouts', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      return {
        id: response.checkout_id,
        status: 'pending' as PaymentStatus,
        url: response.checkout_url,
        customerId: params.customerId || '',
        priceId: params.priceId,
        interval: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
      };
    } catch (error) {
      console.error('[CreemProvider] Create subscription error:', error);
      throw error;
    }
  }

  async updateSubscription(
    subscriptionId: string,
    params: UpdateSubscriptionParams
  ): Promise<SubscriptionResult> {
    try {
      const { priceId, cancelAtPeriodEnd, metadata } = params;

      const response = await this.makeRequest<{
        id: string;
        customerId: string;
        priceId: string;
        status: string;
        interval: 'month' | 'year';
        currentPeriodStart: number;
        currentPeriodEnd: number;
        trialStart?: number;
        trialEnd?: number;
        cancelAtPeriodEnd: boolean;
      }>(`/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          priceId,
          cancelAtPeriodEnd,
          metadata,
        }),
      });

      return {
        id: response.id,
        status: response.status as PaymentStatus,
        customerId: response.customerId,
        priceId: response.priceId,
        interval: response.interval,
        currentPeriodStart: new Date(response.currentPeriodStart * 1000),
        currentPeriodEnd: new Date(response.currentPeriodEnd * 1000),
        periodStart: new Date(response.currentPeriodStart * 1000),
        periodEnd: new Date(response.currentPeriodEnd * 1000),
        trialStart: response.trialStart ? new Date(response.trialStart * 1000) : undefined,
        trialEnd: response.trialEnd ? new Date(response.trialEnd * 1000) : undefined,
        cancelAtPeriodEnd: response.cancelAtPeriodEnd,
      };
    } catch (error) {
      console.error('[CreemProvider] Update subscription error:', error);
      throw new Error('Failed to update Creem subscription');
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('[CreemProvider] Cancel subscription error:', error);
      return false;
    }
  }

  async upgradeSubscription(
    subscriptionId: string,
    newProductId: string,
    useProration = false
  ): Promise<SubscriptionResult> {
    try {
      const updateBehavior = useProration ? 'proration-charge' : 'proration-none';

      const response = await this.makeRequest<{
        id: string;
        customerId: string;
        priceId: string;
        status: string;
        interval: 'month' | 'year';
        currentPeriodStart: number;
        currentPeriodEnd: number;
        trialStart?: number;
        trialEnd?: number;
        cancelAtPeriodEnd: boolean;
      }>(`/subscriptions/${subscriptionId}/upgrade`, {
        method: 'POST',
        body: JSON.stringify({
          product_id: newProductId,
          update_behavior: updateBehavior,
        }),
      });

      return {
        id: response.id,
        status: response.status as PaymentStatus,
        customerId: response.customerId,
        priceId: response.priceId,
        interval: response.interval,
        currentPeriodStart: new Date(response.currentPeriodStart * 1000),
        currentPeriodEnd: new Date(response.currentPeriodEnd * 1000),
        periodStart: new Date(response.currentPeriodStart * 1000),
        periodEnd: new Date(response.currentPeriodEnd * 1000),
        trialStart: response.trialStart ? new Date(response.trialStart * 1000) : undefined,
        trialEnd: response.trialEnd ? new Date(response.trialEnd * 1000) : undefined,
        cancelAtPeriodEnd: response.cancelAtPeriodEnd,
      };
    } catch (error) {
      console.error('[CreemProvider] Upgrade subscription error:', error);
      throw new Error('Failed to upgrade Creem subscription');
    }
  }

  async downgradeSubscription(
    subscriptionId: string,
    newProductId: string,
    scheduleAtPeriodEnd = true
  ): Promise<SubscriptionResult> {
    try {
      const updateBehavior = scheduleAtPeriodEnd ? 'proration-none' : 'proration-charge';

      const response = await this.makeRequest<{
        id: string;
        customerId: string;
        priceId: string;
        status: string;
        interval: 'month' | 'year';
        currentPeriodStart: number;
        currentPeriodEnd: number;
        trialStart?: number;
        trialEnd?: number;
        cancelAtPeriodEnd: boolean;
      }>(`/subscriptions/${subscriptionId}/upgrade`, {
        method: 'POST',
        body: JSON.stringify({
          product_id: newProductId,
          update_behavior: updateBehavior,
        }),
      });

      return {
        id: response.id,
        status: response.status as PaymentStatus,
        customerId: response.customerId,
        priceId: response.priceId,
        interval: response.interval,
        currentPeriodStart: new Date(response.currentPeriodStart * 1000),
        currentPeriodEnd: new Date(response.currentPeriodEnd * 1000),
        periodStart: new Date(response.currentPeriodStart * 1000),
        periodEnd: new Date(response.currentPeriodEnd * 1000),
        trialStart: response.trialStart ? new Date(response.trialStart * 1000) : undefined,
        trialEnd: response.trialEnd ? new Date(response.trialEnd * 1000) : undefined,
        cancelAtPeriodEnd: response.cancelAtPeriodEnd,
      };
    } catch (error) {
      console.error('[CreemProvider] Downgrade subscription error:', error);
      throw new Error('Failed to downgrade Creem subscription');
    }
  }

  async reactivateSubscription(subscriptionId: string): Promise<SubscriptionResult> {
    try {
      const response = await this.makeRequest<{
        id: string;
        customerId: string;
        priceId: string;
        status: string;
        interval: 'month' | 'year';
        currentPeriodStart: number;
        currentPeriodEnd: number;
        trialStart?: number;
        trialEnd?: number;
        cancelAtPeriodEnd: boolean;
      }>(`/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          cancel_at_period_end: false,
        }),
      });

      return {
        id: response.id,
        status: response.status as PaymentStatus,
        customerId: response.customerId,
        priceId: response.priceId,
        interval: response.interval,
        currentPeriodStart: new Date(response.currentPeriodStart * 1000),
        currentPeriodEnd: new Date(response.currentPeriodEnd * 1000),
        periodStart: new Date(response.currentPeriodStart * 1000),
        periodEnd: new Date(response.currentPeriodEnd * 1000),
        trialStart: response.trialStart ? new Date(response.trialStart * 1000) : undefined,
        trialEnd: response.trialEnd ? new Date(response.trialEnd * 1000) : undefined,
        cancelAtPeriodEnd: response.cancelAtPeriodEnd,
      };
    } catch (error) {
      console.error('[CreemProvider] Reactivate subscription error:', error);
      throw new Error('Failed to reactivate Creem subscription');
    }
  }

  async generateCustomerPortalLink(
    customerId: string,
    returnUrl: string
  ): Promise<{ url: string }> {
    try {
      const response = await this.makeRequest<{
        url: string;
        portal_url?: string;
      }>('/customer/portal', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: customerId,
          return_url: returnUrl,
        }),
      });

      return {
        url: response.url || response.portal_url || '',
      };
    } catch (error) {
      console.error('[CreemProvider] Generate customer portal link error:', error);
      throw new Error('Failed to generate customer portal link');
    }
  }

  async getSubscription(subscriptionId: string): Promise<SubscriptionResult | null> {
    try {
      const response = await this.makeRequest<{
        id: string;
        customerId: string;
        priceId: string;
        status: string;
        interval: 'month' | 'year';
        currentPeriodStart: number;
        currentPeriodEnd: number;
        trialStart?: number;
        trialEnd?: number;
        cancelAtPeriodEnd: boolean;
      }>(`/subscriptions/${subscriptionId}`);

      return {
        id: response.id,
        status: response.status as PaymentStatus,
        customerId: response.customerId,
        priceId: response.priceId,
        interval: response.interval,
        currentPeriodStart: new Date(response.currentPeriodStart * 1000),
        currentPeriodEnd: new Date(response.currentPeriodEnd * 1000),
        periodStart: new Date(response.currentPeriodStart * 1000),
        periodEnd: new Date(response.currentPeriodEnd * 1000),
        trialStart: response.trialStart ? new Date(response.trialStart * 1000) : undefined,
        trialEnd: response.trialEnd ? new Date(response.trialEnd * 1000) : undefined,
        cancelAtPeriodEnd: response.cancelAtPeriodEnd,
      };
    } catch (error) {
      console.error('[CreemProvider] Get subscription error:', error);
      return null;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const response = await this.makeRequest<{ status: string }>(`/payments/${paymentId}`);
      return response.status as PaymentStatus;
    } catch (error) {
      console.error('[CreemProvider] Get payment status error:', error);
      throw new Error('Failed to get payment status');
    }
  }

  async verifyWebhook(payload: string, signature: string): Promise<boolean> {
    try {
      const expectedSignature = createHmac('sha256', creemConfig.webhookSecret)
        .update(payload)
        .digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      console.error('[CreemProvider] Verify webhook error:', error);
      return false;
    }
  }

  constructWebhookEvent(payload: string): any {
    return JSON.parse(payload);
  }
}


