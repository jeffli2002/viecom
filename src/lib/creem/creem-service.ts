// @ts-nocheck
import crypto from 'node:crypto';
import { env } from '@/env';

const getCreemTestMode = () => {
  const testModeEnv = env.NEXT_PUBLIC_CREEM_TEST_MODE;
  return testModeEnv === 'true';
};

const getCreemApiKey = () => {
  return env.CREEM_API_KEY || '';
};

const getCreemWebhookSecret = () => {
  return env.CREEM_WEBHOOK_SECRET || '';
};

export const CREEM_PRODUCTS = {
  pro_monthly: env.CREEM_PRO_PLAN_PRODUCT_KEY_MONTHLY || '',
  proplus_monthly: env.CREEM_PROPLUS_PLAN_PRODUCT_KEY_MONTHLY || '',
  pro_yearly: env.CREEM_PRO_PLAN_PRODUCT_KEY_YEARLY || '',
  proplus_yearly: env.CREEM_PROPLUS_PLAN_PRODUCT_KEY_YEARLY || '',
};

export interface CreateCheckoutSessionParams {
  userId: string;
  userEmail: string;
  planId: 'pro' | 'proplus';
  interval: 'month' | 'year';
  successUrl: string;
  cancelUrl: string;
  currentPlan?: 'free' | 'pro' | 'proplus';
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
};

type CreemSubscriptionPayload = {
  id?: string;
  customer?: string | { id?: string; external_id?: string };
  customerId?: string;
  metadata?: Record<string, unknown>;
  subscription?: string | { id?: string; subscription_id?: string };
  status?: string;
  planId?: string;
  priceId?: string;
  product?: Record<string, unknown>;
  order?: Record<string, unknown>;
  trial_end_date?: string;
  trial_end?: string;
  trial_start?: string;
  attempt_count?: number;
  trial_period_days?: number;
  trial_start_date?: string;
  current_period_start_date?: string;
  current_period_end_date?: string;
  cancel_at_period_end?: boolean;
  canceled_at?: string | null;
  amount?: number;
  currency?: string;
} & Record<string, unknown>;

type CreemCheckoutPayload = {
  customer?: string;
  subscription?: string;
  metadata?: Record<string, unknown>;
  order?: Record<string, unknown>;
} & Record<string, unknown>;

type CreemWebhookEvent = Record<string, unknown>;

class CreemPaymentService {
  async createCheckoutSession({
    userId,
    userEmail,
    planId,
    interval,
    successUrl,
    cancelUrl: _cancelUrl,
    currentPlan = 'free',
  }: CreateCheckoutSessionParams) {
    try {
      const CREEM_API_KEY = getCreemApiKey();
      const testMode = getCreemTestMode();

      if (!CREEM_API_KEY) {
        throw new Error('Creem API key not configured');
      }

      const productKey = interval === 'year' ? `${planId}_yearly` : `${planId}_monthly`;
      const productId = CREEM_PRODUCTS[productKey as keyof typeof CREEM_PRODUCTS];

      if (!productId) {
        throw new Error(`Product ID not configured for plan: ${planId}`);
      }

      console.log('[Creem] Creating checkout with:', {
        productId,
        planId,
        interval,
        userEmail,
        testMode,
      });

      const checkoutRequest = {
        productId: productId,
        requestId: `checkout_${userId}_${Date.now()}`,
        successUrl: successUrl,
        metadata: {
          userId: userId,
          userEmail: userEmail,
          planId: planId,
          currentPlan: currentPlan,
        },
        customer: {
          email: userEmail,
        },
      };

      // Use Creem SDK if available, otherwise use direct API call
      try {
        const { Creem } = await import('creem');
        const creem = new Creem({
          serverIdx: testMode ? 1 : 0,
        });

        const checkout = await creem.createCheckout({
          xApiKey: CREEM_API_KEY,
          createCheckoutRequest: checkoutRequest,
        });

        console.log('[Creem] Checkout created:', {
          id: checkout.id,
          url: checkout.checkoutUrl,
        });

        if (!checkout.checkoutUrl) {
          throw new Error('No checkout URL in response');
        }

        return {
          success: true,
          sessionId: checkout.id,
          url: checkout.checkoutUrl,
        };
      } catch (_sdkError) {
        // Fallback to direct API call if SDK not available
        console.log('[Creem] SDK not available, using direct API call');
        const response = await fetch('https://api.creem.io/v1/checkouts', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${CREEM_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(checkoutRequest),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const checkout = await response.json();
        return {
          success: true,
          sessionId: checkout.id || checkout.checkout_id,
          url: checkout.checkoutUrl || checkout.checkout_url,
        };
      }
    } catch (error: unknown) {
      console.error('Creem checkout session error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create checkout session',
      };
    }
  }

  async cancelSubscription(subscriptionId: string) {
    try {
      console.log('[Creem] Cancelling subscription:', subscriptionId);
      const CREEM_API_KEY = getCreemApiKey();
      if (!CREEM_API_KEY) {
        throw new Error('Creem API key not configured');
      }

      try {
        const { Creem } = await import('creem');
        const creem = new Creem({
          serverIdx: getCreemTestMode() ? 1 : 0,
        });
        const result = await creem.cancelSubscription({
          id: subscriptionId,
          xApiKey: CREEM_API_KEY,
        });
        console.log('[Creem] Cancel result:', result);

        return {
          success: true,
          subscription: result,
        };
      } catch (_sdkError) {
        // Fallback to direct API call
        const response = await fetch(`https://api.creem.io/v1/subscriptions/${subscriptionId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${CREEM_API_KEY}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        return {
          success: true,
        };
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      console.error('[Creem] Cancel subscription error:', {
        subscriptionId,
        message,
      });

      if (
        message.includes('Subscription already canceled') ||
        message.includes('already canceled')
      ) {
        return {
          success: true,
          alreadyCancelled: true,
        };
      }

      if (message.includes('Subscription does not exist') || message.includes('does not exist')) {
        return {
          success: false,
          error: 'Subscription does not exist or has been deleted. Please refresh the page.',
        };
      }

      return {
        success: false,
        error: message || 'Failed to cancel subscription',
      };
    }
  }

  async getSubscription(subscriptionId: string) {
    try {
      const CREEM_API_KEY = getCreemApiKey();
      if (!CREEM_API_KEY) {
        throw new Error('Creem API key not configured');
      }

      try {
        const { Creem } = await import('creem');
        const creem = new Creem({
          serverIdx: getCreemTestMode() ? 1 : 0,
        });
        const result = await creem.retrieveSubscription({
          subscriptionId: subscriptionId,
          xApiKey: CREEM_API_KEY,
        });

        return {
          success: true,
          subscription: result,
        };
      } catch (_sdkError) {
        // Fallback to direct API call
        const response = await fetch(`https://api.creem.io/v1/subscriptions/${subscriptionId}`, {
          headers: {
            Authorization: `Bearer ${CREEM_API_KEY}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const subscription = await response.json();
        return {
          success: true,
          subscription,
        };
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      console.error('Creem get subscription error:', error);
      return {
        success: false,
        error: message || 'Failed to get subscription',
      };
    }
  }

  async upgradeSubscription(
    subscriptionId: string,
    newProductKey: 'pro_monthly' | 'pro_yearly' | 'proplus_monthly' | 'proplus_yearly',
    useProration = false
  ) {
    try {
      console.log('[Creem] Upgrading subscription:', subscriptionId, 'to', newProductKey);
      const CREEM_API_KEY = getCreemApiKey();
      if (!CREEM_API_KEY) {
        throw new Error('Creem API key not configured');
      }

      const newProductId = CREEM_PRODUCTS[newProductKey];
      if (!newProductId) {
        throw new Error(`Product ID not configured for: ${newProductKey}`);
      }

      try {
        const { Creem } = await import('creem');
        const creem = new Creem({
          serverIdx: getCreemTestMode() ? 1 : 0,
        });
        const result = await creem.upgradeSubscription({
          id: subscriptionId,
          xApiKey: CREEM_API_KEY,
          UpgradeSubscriptionRequestEntity: {
            productId: newProductId,
            updateBehavior: useProration ? 'proration-charge' : 'proration-none',
          },
        });

        console.log('[Creem] Upgrade scheduled:', {
          subscriptionId,
          newProductKey,
          updateBehavior: useProration ? 'proration-charge' : 'proration-none',
        });

        return {
          success: true,
          subscription: result,
        };
      } catch (_sdkError) {
        // Fallback to direct API call
        const response = await fetch(
          `https://api.creem.io/v1/subscriptions/${subscriptionId}/upgrade`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${CREEM_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              product_id: newProductId,
              update_behavior: useProration ? 'proration-charge' : 'proration-none',
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const result = await response.json();
        return {
          success: true,
          subscription: result,
        };
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      console.error('[Creem] Upgrade subscription error:', {
        subscriptionId,
        newProductKey,
        message,
      });

      return {
        success: false,
        error: message || 'Failed to upgrade subscription',
      };
    }
  }

  async downgradeSubscription(
    subscriptionId: string,
    newProductKey: 'pro_monthly' | 'pro_yearly' | 'proplus_monthly' | 'proplus_yearly',
    scheduleAtPeriodEnd = true
  ) {
    try {
      console.log(
        '[Creem] Downgrading subscription:',
        subscriptionId,
        'to',
        newProductKey,
        'scheduleAtPeriodEnd:',
        scheduleAtPeriodEnd
      );
      const CREEM_API_KEY = getCreemApiKey();
      if (!CREEM_API_KEY) {
        throw new Error('Creem API key not configured');
      }

      const newProductId = CREEM_PRODUCTS[newProductKey];
      if (!newProductId) {
        throw new Error(`Product ID not configured for: ${newProductKey}`);
      }

      if (scheduleAtPeriodEnd) {
        try {
          const { Creem } = await import('creem');
          const creem = new Creem({
            serverIdx: getCreemTestMode() ? 1 : 0,
          });
          const result = await creem.upgradeSubscription({
            id: subscriptionId,
            xApiKey: CREEM_API_KEY,
            UpgradeSubscriptionRequestEntity: {
              productId: newProductId,
              updateBehavior: 'proration-none',
            },
          });

          console.log('[Creem] Downgrade scheduled at period end:', {
            subscriptionId,
            newProductKey,
          });

          return {
            success: true,
            subscription: result,
            scheduledAtPeriodEnd: true,
          };
        } catch (_sdkError) {
          // Fallback to direct API call
          const response = await fetch(
            `https://api.creem.io/v1/subscriptions/${subscriptionId}/upgrade`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${CREEM_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                product_id: newProductId,
                update_behavior: 'proration-none',
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const result = await response.json();
          return {
            success: true,
            subscription: result,
            scheduledAtPeriodEnd: true,
          };
        }
      }
      await this.cancelSubscription(subscriptionId);

      console.log('[Creem] Old subscription canceled immediately for downgrade');

      return {
        success: true,
        canceled: true,
        scheduledAtPeriodEnd: false,
      };
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      console.error('[Creem] Downgrade subscription error:', {
        subscriptionId,
        newProductKey,
        message,
      });

      return {
        success: false,
        error: message || 'Failed to downgrade subscription',
      };
    }
  }

  async reactivateSubscription(subscriptionId: string) {
    try {
      console.log('[Creem] Reactivating subscription:', subscriptionId);
      const CREEM_API_KEY = getCreemApiKey();
      if (!CREEM_API_KEY) {
        throw new Error('Creem API key not configured');
      }

      try {
        const { Creem } = await import('creem');
        const creem = new Creem({
          serverIdx: getCreemTestMode() ? 1 : 0,
        });
        const result = await creem.updateSubscription({
          id: subscriptionId,
          xApiKey: CREEM_API_KEY,
          UpdateSubscriptionRequestEntity: {
            cancelAtPeriodEnd: false,
          },
        });

        console.log('[Creem] Subscription reactivated:', subscriptionId);

        return {
          success: true,
          subscription: result,
        };
      } catch (_sdkError) {
        // Fallback to direct API call
        const response = await fetch(`https://api.creem.io/v1/subscriptions/${subscriptionId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${CREEM_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cancel_at_period_end: false,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const result = await response.json();
        return {
          success: true,
          subscription: result,
        };
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      console.error('[Creem] Reactivate subscription error:', {
        subscriptionId,
        message,
      });

      return {
        success: false,
        error: message || 'Failed to reactivate subscription',
      };
    }
  }

  async generateCustomerPortalLink(customerId: string, returnUrl: string) {
    try {
      console.log('[Creem] Generating customer portal link for:', customerId);
      const CREEM_API_KEY = getCreemApiKey();
      if (!CREEM_API_KEY) {
        throw new Error('Creem API key not configured');
      }

      try {
        const { Creem } = await import('creem');
        const creem = new Creem({
          serverIdx: getCreemTestMode() ? 1 : 0,
        });
        const result = await creem.generateCustomerLinks({
          customerId: customerId,
          xApiKey: CREEM_API_KEY,
          returnUrl: returnUrl,
        });

        console.log('[Creem] Customer portal link generated');

        return {
          success: true,
          url: result.url || result.portalUrl,
        };
      } catch (_sdkError) {
        // Fallback to direct API call
        const response = await fetch('https://api.creem.io/v1/customer/portal', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${CREEM_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customer_id: customerId,
            return_url: returnUrl,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const result = await response.json();
        return {
          success: true,
          url: result.url || result.portal_url,
        };
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      console.error('[Creem] Generate customer portal link error:', {
        customerId,
        message,
      });

      return {
        success: false,
        error: message || 'Failed to generate customer portal link',
      };
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const CREEM_WEBHOOK_SECRET = getCreemWebhookSecret();

    if (!CREEM_WEBHOOK_SECRET) {
      console.error('[SECURITY] Webhook secret not configured - rejecting request');
      return false;
    }

    try {
      const hmac = crypto.createHmac('sha256', CREEM_WEBHOOK_SECRET);
      const digest = hmac.update(payload).digest('hex');
      const isValid = digest === signature;

      if (!isValid) {
        console.error('[SECURITY] Invalid webhook signature detected');
      }

      return isValid;
    } catch (error) {
      console.error('[SECURITY] Webhook signature verification error:', error);
      return false;
    }
  }

  async handleWebhookEvent(event: CreemWebhookEvent) {
    const eventType = (event.eventType || event.type) as string | undefined;
    const eventData =
      (event.object as Record<string, unknown> | undefined) ||
      (event.data as { object?: Record<string, unknown> } | undefined)?.object;

    if (!eventType || !eventData) {
      console.warn('[Creem] Received webhook without type or data payload');
      return { success: false };
    }

    switch (eventType) {
      case 'checkout.completed':
        return this.handleCheckoutComplete(eventData as CreemCheckoutPayload);

      case 'subscription.created':
        return this.handleSubscriptionCreated(eventData as CreemSubscriptionPayload);

      case 'subscription.active':
      case 'subscription.update':
        return this.handleSubscriptionUpdate(eventData as CreemSubscriptionPayload);

      case 'subscription.canceled':
        return this.handleSubscriptionDeleted(eventData as CreemSubscriptionPayload);

      case 'subscription.paid':
        return this.handlePaymentSuccess(eventData as CreemSubscriptionPayload);

      case 'subscription.expired':
        return this.handleSubscriptionExpired(eventData as CreemSubscriptionPayload);

      case 'subscription.trial_will_end':
        return this.handleSubscriptionTrialWillEnd(eventData as CreemSubscriptionPayload);

      case 'subscription.trial_ended':
        return this.handleSubscriptionTrialEnded(eventData as CreemSubscriptionPayload);

      case 'subscription.paused':
        return this.handleSubscriptionPaused(eventData as CreemSubscriptionPayload);

      case 'refund.created':
        return this.handleRefundCreated(eventData as Record<string, unknown>);

      case 'dispute.created':
        return this.handleDisputeCreated(eventData as Record<string, unknown>);

      case 'payment.failed':
      case 'subscription.payment_failed':
        return this.handlePaymentFailed(eventData as CreemSubscriptionPayload);

      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
        return { success: true };
    }
  }

  private async handleSubscriptionCreated(subscription: CreemSubscriptionPayload) {
    const {
      id,
      customer,
      metadata,
      status,
      trial_period_days,
      trial_start_date,
      trial_end_date,
      current_period_start_date,
      current_period_end_date,
    } = subscription;

    const customerId = typeof customer === 'string' ? customer : customer?.id;
    const userId = metadata?.userId || customer?.external_id;

    if (!id || !customerId) {
      return { success: true };
    }

    const planId = metadata?.planId || this.getPlanFromProduct(subscription.product?.id);

    return {
      type: 'subscription_created',
      subscriptionId: id,
      customerId: customerId,
      userId: userId,
      status: status,
      planId: planId,
      trialPeriodDays: trial_period_days,
      trialStart: trial_start_date ? new Date(trial_start_date) : undefined,
      trialEnd: trial_end_date ? new Date(trial_end_date) : undefined,
      currentPeriodStart: current_period_start_date
        ? new Date(current_period_start_date)
        : undefined,
      currentPeriodEnd: current_period_end_date ? new Date(current_period_end_date) : undefined,
    };
  }

  private async handleCheckoutComplete(checkout: CreemCheckoutPayload) {
    const { customer, subscription, metadata, order } = checkout;

    const userId = metadata?.userId || customer?.external_id;
    const planId = metadata?.planId || this.getPlanFromProduct(order?.product);

    const subscriptionId =
      subscription?.id || subscription?.subscription_id || checkout.subscription_id;

    return {
      type: 'checkout_complete',
      userId: userId,
      customerId: customer?.id,
      subscriptionId: subscriptionId,
      planId: planId,
    };
  }

  private async handleSubscriptionUpdate(subscription: CreemSubscriptionPayload) {
    const {
      customer,
      status,
      metadata,
      current_period_end_date,
      canceled_at,
      product,
      cancel_at_period_end,
    } = subscription;

    const customerId = typeof customer === 'string' ? customer : customer?.id;
    const userId = metadata?.userId;
    const planId = metadata?.planId || this.getPlanFromProduct(product?.id);

    return {
      type: 'subscription_update',
      customerId: customerId,
      status: status,
      userId: userId,
      planId: planId,
      currentPeriodEnd: current_period_end_date ? new Date(current_period_end_date) : undefined,
      cancelAtPeriodEnd: cancel_at_period_end || !!canceled_at,
    };
  }

  private async handleSubscriptionDeleted(subscription: CreemSubscriptionPayload) {
    const { customerId, metadata } = subscription;

    return {
      type: 'subscription_deleted',
      customerId: customerId,
      userId: metadata?.userId,
    };
  }

  private async handlePaymentSuccess(subscription: CreemSubscriptionPayload) {
    const { customer, id, metadata } = subscription;

    const customerId = typeof customer === 'string' ? customer : customer?.id;
    const userId = metadata?.userId;

    return {
      type: 'payment_success',
      customerId: customerId,
      subscriptionId: id,
      userId: userId,
    };
  }

  private async handleSubscriptionExpired(subscription: CreemSubscriptionPayload) {
    const { customer, metadata, id } = subscription;

    const customerId = typeof customer === 'string' ? customer : customer?.id;
    const userId = metadata?.userId;

    return {
      type: 'subscription_deleted',
      subscriptionId: id,
      customerId: customerId,
      userId: userId,
    };
  }

  private async handleSubscriptionTrialWillEnd(subscription: CreemSubscriptionPayload) {
    const { customer, metadata, trial_end_date, product } = subscription;

    const customerId = typeof customer === 'string' ? customer : customer?.id;
    const userId = metadata?.userId;
    const planId = metadata?.planId || this.getPlanFromProduct(product?.id);

    return {
      type: 'subscription_trial_will_end',
      customerId: customerId,
      userId: userId,
      planId: planId,
      trialEndDate: trial_end_date ? new Date(trial_end_date) : undefined,
    };
  }

  private async handleSubscriptionTrialEnded(subscription: CreemSubscriptionPayload) {
    const { customer, metadata, id, product } = subscription;

    const customerId = typeof customer === 'string' ? customer : customer?.id;
    const userId = metadata?.userId;
    const planId = metadata?.planId || this.getPlanFromProduct(product?.id);

    return {
      type: 'subscription_trial_ended',
      customerId: customerId,
      userId: userId,
      subscriptionId: id,
      planId: planId,
    };
  }

  private async handleSubscriptionPaused(subscription: CreemSubscriptionPayload) {
    const { id, customer, metadata } = subscription;

    const customerId = typeof customer === 'string' ? customer : customer?.id;
    const userId = metadata?.userId;

    return {
      type: 'subscription_paused',
      subscriptionId: id,
      customerId: customerId,
      userId: userId,
    };
  }

  private async handleRefundCreated(refund: Record<string, unknown>) {
    const { customer, subscription, checkout } = refund;

    return {
      type: 'refund_created',
      customerId: customer?.id,
      subscriptionId: subscription?.id,
      checkoutId: checkout?.id,
      amount: refund.refund_amount,
    };
  }

  private async handleDisputeCreated(dispute: Record<string, unknown>) {
    const { customer, subscription } = dispute;

    return {
      type: 'dispute_created',
      customerId: customer?.id,
      subscriptionId: subscription?.id,
      amount: dispute.amount,
    };
  }

  private async handlePaymentFailed(payment: CreemSubscriptionPayload) {
    const { customer, subscription, metadata, attempt_count } = payment;

    const customerId = typeof customer === 'string' ? customer : customer?.id;
    const userId = metadata?.userId;
    const subscriptionId = subscription?.id || payment.subscription_id;

    return {
      type: 'payment_failed',
      customerId: customerId,
      subscriptionId: subscriptionId,
      userId: userId,
      attemptCount: attempt_count || 1,
      amount: payment.amount,
      currency: payment.currency,
    };
  }

  private getPlanFromProduct(productId: string): string {
    if (!productId) return 'free';

    if (productId.includes('proplus')) {
      return 'proplus';
    }
    if (productId.includes('pro')) {
      return 'pro';
    }

    return 'free';
  }

  isTestMode(): boolean {
    return getCreemTestMode();
  }
}

export const creemService = new CreemPaymentService();
export { getCreemTestMode, getCreemApiKey };
