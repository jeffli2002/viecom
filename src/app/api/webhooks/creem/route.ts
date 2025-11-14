// @ts-nocheck
import { randomUUID } from 'node:crypto';
import { paymentConfig } from '@/config/payment.config';
import { env } from '@/env';
import { creemService } from '@/lib/creem/creem-service';
import { type BillingInterval, formatPlanName, getCreditsForPlan } from '@/lib/creem/plan-utils';
import type { PaymentStatus } from '@/payment/types';
import { db } from '@/server/db';
import { paymentRepository } from '@/server/db/repositories/payment-repository';
import { creditTransactions, userCredits } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Grant subscription credits to user with idempotency
 * Returns true if credits were granted, false if already granted
 */
async function grantSubscriptionCredits(
  userId: string,
  planIdentifier: string,
  subscriptionId: string,
  interval?: BillingInterval,
  isRenewal = false
): Promise<boolean> {
  const creditInfo = getCreditsForPlan(planIdentifier, interval);

  if (!creditInfo.plan || creditInfo.amount <= 0) {
    console.log(
      `[Creem Webhook] No credits to grant for identifier ${planIdentifier} (interval=${interval || 'auto'})`
    );
    return false;
  }

  const normalizedPlanId = creditInfo.planId;
  const isYearly = creditInfo.interval === 'year';
  const creditsToGrant = creditInfo.amount;
  const planDisplayName = formatPlanName(creditInfo.plan, normalizedPlanId);

  try {
    // Create idempotent reference ID
    const referenceId = `creem_${subscriptionId}_${isRenewal ? 'renewal' : 'initial'}_${Date.now()}`;

    const granted = await db.transaction(async (tx) => {
      // Check if credits already granted (idempotency)
      const [existingTransaction] = await tx
        .select()
        .from(creditTransactions)
        .where(eq(creditTransactions.referenceId, referenceId))
        .limit(1);

      if (existingTransaction) {
        console.log(`[Creem Webhook] Credits already granted for reference ${referenceId}`);
        return false;
      }

      const [userCredit] = await tx
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, userId))
        .limit(1);

      const newBalance = (userCredit?.balance || 0) + creditsToGrant;

      if (userCredit) {
        await tx
          .update(userCredits)
          .set({
            balance: newBalance,
            totalEarned: userCredit.totalEarned + creditsToGrant,
            updatedAt: new Date(),
          })
          .where(eq(userCredits.userId, userId));
      } else {
        await tx.insert(userCredits).values({
          id: randomUUID(),
          userId,
          balance: creditsToGrant,
          totalEarned: creditsToGrant,
          totalSpent: 0,
          frozenBalance: 0,
        });
      }

      await tx.insert(creditTransactions).values({
        id: randomUUID(),
        userId,
        type: 'earn',
        amount: creditsToGrant,
        balanceAfter: newBalance,
        source: 'subscription',
        description: `${planDisplayName} subscription ${isRenewal ? 'renewal' : 'credits'} (Creem)`,
        referenceId,
        metadata: JSON.stringify({
          planId: normalizedPlanId,
          planIdentifier,
          isYearly,
          subscriptionId,
          provider: 'creem',
          isRenewal,
        }),
      });

      return true;
    });

    if (granted) {
      console.log(
        `[Creem Webhook] Granted ${creditsToGrant} credits to user ${userId} for ${normalizedPlanId} ${isRenewal ? 'renewal' : 'subscription'}`
      );
    }

    return granted;
  } catch (error) {
    console.error('[Creem Webhook] Error granting subscription credits:', error);
    return false;
  }
}

/**
 * Adjust credits when changing plans (upgrade/downgrade)
 */
async function adjustCreditsForPlanChange(
  userId: string,
  oldPlanIdentifier: string,
  newPlanIdentifier: string,
  subscriptionId: string,
  isYearly: boolean
) {
  try {
    const interval: BillingInterval = isYearly ? 'year' : 'month';
    const oldCreditInfo = getCreditsForPlan(oldPlanIdentifier, interval);
    const newCreditInfo = getCreditsForPlan(newPlanIdentifier, interval);

    if (!oldCreditInfo.plan || !newCreditInfo.plan) {
      console.log(
        `[Creem Webhook] Unable to resolve plans for credit adjustment (${oldPlanIdentifier} → ${newPlanIdentifier})`
      );
      return;
    }

    const oldCredits = oldCreditInfo.amount;
    const newCredits = newCreditInfo.amount;
    const creditDifference = newCredits - oldCredits;

    if (creditDifference === 0) {
      console.log('[Creem Webhook] No credit adjustment needed for plan change');
      return;
    }

    const referenceId = `creem_${subscriptionId}_plan_change_${Date.now()}`;

    await db.transaction(async (tx) => {
      const [userCredit] = await tx
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, userId))
        .limit(1);

      if (!userCredit) {
        console.error(`[Creem Webhook] User credit record not found for ${userId}`);
        return;
      }

      const newBalance = Math.max(0, userCredit.balance + creditDifference);
      const transactionType = creditDifference > 0 ? 'earn' : 'spend';

      await tx
        .update(userCredits)
        .set({
          balance: newBalance,
          totalEarned:
            creditDifference > 0
              ? userCredit.totalEarned + creditDifference
              : userCredit.totalEarned,
          totalSpent:
            creditDifference < 0
              ? userCredit.totalSpent + Math.abs(creditDifference)
              : userCredit.totalSpent,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId));

      await tx.insert(creditTransactions).values({
        id: randomUUID(),
        userId,
        type: transactionType,
        amount: Math.abs(creditDifference),
        balanceAfter: newBalance,
        source: 'subscription',
        description: `Plan ${creditDifference > 0 ? 'upgrade' : 'downgrade'}: ${oldCreditInfo.planId} → ${newCreditInfo.planId}`,
        referenceId,
        metadata: JSON.stringify({
          oldPlanId: oldCreditInfo.planId,
          newPlanId: newCreditInfo.planId,
          oldPlanIdentifier,
          newPlanIdentifier,
          subscriptionId,
          provider: 'creem',
          creditDifference,
        }),
      });
    });

    console.log(
      `[Creem Webhook] Adjusted credits by ${creditDifference} for user ${userId} (${oldCreditInfo.planId} → ${newCreditInfo.planId})`
    );
  } catch (error) {
    console.error('[Creem Webhook] Error adjusting credits:', error);
  }
}

interface CreemWebhookData {
  type?: string;
  userId?: string;
  customerId?: string;
  subscriptionId?: string;
  planId?: string;
  status?: string;
  trialStart?: string;
  trialEnd?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  eventId?: string;
  interval?: string;
  billingInterval?: string;
  previousPlanId?: string;
  previousStatus?: string;
  checkoutId?: string;
  amount?: number;
  reason?: string;
  priceId?: string;
  creditsGranted?: number;
  manualAdjustment?: number;
  [key: string]: unknown;
}

type CreemWebhookResult = CreemWebhookData & { type: string };

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const startTime = Date.now();

  try {
    const origin = request.headers.get('origin');
    const forwardedFor = request.headers.get('x-forwarded-for');
    const userAgent = request.headers.get('user-agent');

    console.log('[Creem Webhook] Incoming request', {
      requestId,
      origin,
      forwardedFor,
      userAgent,
      isProduction: env.NODE_ENV === 'production',
    });

    const body = await request.text();
    const signature =
      request.headers.get('x-creem-signature') || request.headers.get('creem-signature');

    if (!signature) {
      console.warn('[Creem Webhook] Missing signature header', { requestId, forwardedFor });
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const isValid = creemService.verifyWebhookSignature(body, signature);
    if (!isValid) {
      console.error('[Creem Webhook] Invalid signature', { requestId, forwardedFor, userAgent });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventId = event.id;
    const eventType = event.eventType || event.type;

    const isProcessed = await paymentRepository.isCreemEventProcessed(eventId);
    if (isProcessed) {
      console.log('[Creem Webhook] Event already processed', { eventType, eventId, requestId });
      return NextResponse.json({ received: true });
    }

    console.log('[Creem Webhook] Processing event', { eventType, eventId, requestId });

    const rawResult = await creemService.handleWebhookEvent(event);

    if (!rawResult || typeof rawResult !== 'object' || !('type' in rawResult)) {
      return NextResponse.json({ received: true });
    }

    const result = rawResult as CreemWebhookResult;

    switch (result.type) {
      case 'checkout_complete':
        await handleCheckoutComplete(result);
        break;

      case 'subscription_created':
        await handleSubscriptionCreated(result);
        break;

      case 'subscription_update':
        await handleSubscriptionUpdate(result);
        break;

      case 'subscription_deleted':
        await handleSubscriptionDeleted(result);
        break;

      case 'payment_success':
        await handlePaymentSuccess(result);
        break;

      case 'subscription_trial_will_end':
        await handleSubscriptionTrialWillEnd(result);
        break;

      case 'subscription_trial_ended':
        await handleSubscriptionTrialEnded(result);
        break;

      case 'subscription_paused':
        await handleSubscriptionPaused(result);
        break;

      case 'refund_created':
        await handleRefundCreated(result);
        break;

      case 'dispute_created':
        await handleDisputeCreated(result);
        break;

      case 'payment_failed':
        await handlePaymentFailed(result);
        break;
    }

    const processingTime = Date.now() - startTime;
    console.log('[Creem Webhook] Successfully processed', {
      eventType,
      requestId,
      processingTime,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('[Creem Webhook] Error processing webhook', {
      error,
      requestId,
      processingTime,
    });

    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCheckoutComplete(data: CreemWebhookData) {
  const { userId, customerId, subscriptionId, planId, trialEnd } = data;

  if (!userId || !planId) {
    console.error('[Creem Webhook] Missing required data for checkout complete');
    return;
  }

  try {
    if (subscriptionId) {
      const existingRecord = await paymentRepository.findBySubscriptionId(subscriptionId);
      if (!existingRecord) {
        const status: PaymentStatus = trialEnd ? 'trialing' : 'active';

        await paymentRepository.create({
          id: subscriptionId,
          provider: 'creem',
          priceId: planId,
          type: 'subscription',
          userId,
          customerId: customerId || '',
          subscriptionId,
          status,
          trialEnd: trialEnd ? new Date(trialEnd) : undefined,
        });

        // Grant credits immediately for non-trial subscriptions
        if (!trialEnd) {
          await grantSubscriptionCredits(userId, planId, subscriptionId, data.interval, false);
        } else {
          console.log(
            '[Creem Webhook] Trial subscription - credits will be granted after trial ends'
          );
        }
      } else {
        console.log(`[Creem Webhook] Subscription ${subscriptionId} already exists`);
      }
    }

    console.log(
      `[Creem Webhook] Checkout completed for user ${userId} (${trialEnd ? 'trial' : 'active'})`
    );
  } catch (error) {
    console.error('[Creem Webhook] Error in handleCheckoutComplete:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(data: CreemWebhookData) {
  const {
    subscriptionId,
    customerId,
    userId,
    status,
    planId,
    currentPeriodStart,
    currentPeriodEnd,
    trialStart,
    trialEnd,
  } = data;

  if (!subscriptionId || !customerId) {
    console.error('[Creem Webhook] Missing subscription ID or customer ID');
    return;
  }

  try {
    const existingRecord = await paymentRepository.findBySubscriptionId(subscriptionId);

    if (!existingRecord) {
      await paymentRepository.create({
        id: subscriptionId,
        provider: 'creem',
        priceId: planId || '',
        type: 'subscription',
        userId: userId || customerId,
        customerId,
        subscriptionId,
        status: (status as PaymentStatus) || 'active',
        periodStart: currentPeriodStart,
        periodEnd: currentPeriodEnd,
        trialStart,
        trialEnd,
      });

      // Only grant credits if not in trial or if trial just ended
      if (planId && userId && status !== 'trialing') {
        await grantSubscriptionCredits(userId, planId, subscriptionId, data.interval, false);
      } else if (status === 'trialing') {
        console.log(
          '[Creem Webhook] Trial subscription created - credits will be granted after trial ends'
        );
      }
    } else {
      console.log(`[Creem Webhook] Subscription ${subscriptionId} already exists - updating`);

      // Update existing record if status changed
      await paymentRepository.update(subscriptionId, {
        status: (status as PaymentStatus) || existingRecord.status,
        periodStart: currentPeriodStart,
        periodEnd: currentPeriodEnd,
        trialStart,
        trialEnd,
      });
    }

    await paymentRepository.createEvent({
      paymentId: subscriptionId,
      eventType: 'subscription.created',
      creemEventId: data.eventId || randomUUID(),
      eventData: JSON.stringify(data),
    });

    console.log(`[Creem Webhook] Created subscription ${subscriptionId} with status ${status}`);
  } catch (error) {
    console.error('[Creem Webhook] Error in handleSubscriptionCreated:', error);
    throw error;
  }
}

async function handleSubscriptionUpdate(data: CreemWebhookData) {
  const {
    customerId,
    status,
    userId,
    planId,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    subscriptionId,
  } = data;

  try {
    let actualUserId = userId;
    let targetSubscription = null;

    // Try to find subscription by ID first
    if (subscriptionId) {
      targetSubscription = await paymentRepository.findBySubscriptionId(subscriptionId);
      if (targetSubscription) {
        actualUserId = targetSubscription.userId;
      }
    }

    // Fallback to finding by customer ID
    if (!actualUserId && customerId) {
      const subscription = await paymentRepository.findByCustomerId(customerId);
      if (subscription && subscription.length > 0 && subscription[0]) {
        actualUserId = subscription[0].userId;
        targetSubscription = subscription[0];
      }
    }

    if (!actualUserId) {
      console.error('[Creem Webhook] Could not find user for customer:', customerId);
      return;
    }

    // If no specific subscription found, find the active one
    if (!targetSubscription) {
      const subscriptions = await paymentRepository.findByUserId(actualUserId);
      targetSubscription = subscriptions.find(
        (s) => s.status === 'active' || s.status === 'trialing'
      );
    }

    if (targetSubscription) {
      const oldPlanId = targetSubscription.priceId;
      const newPlanId = planId || oldPlanId;
      const oldStatus = targetSubscription.status;
      const newStatus = status as PaymentStatus;

      // Detect plan change (upgrade/downgrade)
      if (oldPlanId !== newPlanId) {
        console.log(`[Creem Webhook] Plan change detected: ${oldPlanId} → ${newPlanId}`);
        await adjustCreditsForPlanChange(
          actualUserId,
          oldPlanId,
          newPlanId,
          targetSubscription.id,
          (targetSubscription.interval || data.interval) === 'year'
        );
      }

      // Detect status change from trialing to active (trial ended, grant credits)
      if (oldStatus === 'trialing' && newStatus === 'active') {
        console.log(`[Creem Webhook] Trial ended, granting credits for ${newPlanId}`);
        await grantSubscriptionCredits(
          actualUserId,
          newPlanId,
          targetSubscription.id,
          targetSubscription.interval || data.interval,
          false
        );
      }

      await paymentRepository.update(targetSubscription.id, {
        status: newStatus,
        periodEnd: currentPeriodEnd,
        cancelAtPeriodEnd: cancelAtPeriodEnd,
        priceId: newPlanId,
      });

      console.log(
        `[Creem Webhook] Updated subscription ${targetSubscription.id} for user ${actualUserId} (status: ${newStatus})`
      );
    } else {
      console.warn(`[Creem Webhook] No active subscription found for user ${actualUserId}`);
    }
  } catch (error) {
    console.error('[Creem Webhook] Error in handleSubscriptionUpdate:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(data: CreemWebhookData) {
  const { customerId } = data;

  try {
    const subscriptions = await paymentRepository.findByCustomerId(customerId);
    if (subscriptions.length === 0) {
      console.error('[Creem Webhook] No subscription found for customer:', customerId);
      return;
    }

    for (const subscription of subscriptions) {
      await paymentRepository.update(subscription.id, {
        status: 'canceled',
      });
    }

    console.log(`[Creem Webhook] Marked subscription as cancelled for customer ${customerId}`);
  } catch (error) {
    console.error('[Creem Webhook] Error in handleSubscriptionDeleted:', error);
    throw error;
  }
}

async function handlePaymentSuccess(data: CreemWebhookData) {
  const { customerId, subscriptionId, userId: _userId } = data;

  if (!customerId) {
    return;
  }

  try {
    const paymentRecord = subscriptionId
      ? await paymentRepository.findBySubscriptionId(subscriptionId)
      : null;

    if (paymentRecord) {
      // This is a renewal payment - grant credits
      if (paymentRecord.status === 'active' && paymentRecord.userId) {
        const planId = paymentRecord.priceId;
        const isYearly = paymentRecord.interval === 'year';

        console.log(`[Creem Webhook] Renewal payment detected for ${planId}`);
        await grantSubscriptionCredits(
          paymentRecord.userId,
          planId,
          subscriptionId,
          isYearly ? 'year' : 'month',
          true
        );
      }

      await paymentRepository.createEvent({
        paymentId: paymentRecord.id,
        eventType: 'payment.succeeded',
        creemEventId: data.eventId || randomUUID(),
        eventData: JSON.stringify(data),
      });
    }

    console.log(`[Creem Webhook] Payment succeeded for customer ${customerId}`);
  } catch (error) {
    console.error('[Creem Webhook] Error in handlePaymentSuccess:', error);
    throw error;
  }
}

async function handleSubscriptionTrialWillEnd(data: CreemWebhookData) {
  const { customerId: _customerId, userId, planId, trialEndDate: _trialEndDate } = data;

  try {
    console.log(`[Creem Webhook] Trial will end soon for user ${userId}, plan ${planId}`);
    // TODO: Send email notification to user about trial ending
    // This is a notification event, no state changes needed
  } catch (error) {
    console.error('[Creem Webhook] Error in handleSubscriptionTrialWillEnd:', error);
  }
}

async function handleSubscriptionTrialEnded(data: CreemWebhookData) {
  const { customerId: _customerId, userId, subscriptionId, planId } = data;

  try {
    if (!subscriptionId) {
      console.error('[Creem Webhook] Missing subscription ID in trial ended event');
      return;
    }

    const paymentRecord = await paymentRepository.findBySubscriptionId(subscriptionId);

    if (paymentRecord) {
      // Update status from trialing to active
      await paymentRepository.update(subscriptionId, {
        status: 'active',
        trialEnd: new Date(),
      });

      // Grant initial credits now that trial has ended and payment succeeded
      if (userId && planId) {
        console.log(`[Creem Webhook] Trial ended, granting credits for ${planId}`);
        await grantSubscriptionCredits(
          userId,
          planId,
          subscriptionId,
          paymentRecord.interval || 'month',
          false
        );
      }
    }

    console.log(`[Creem Webhook] Trial ended for subscription ${subscriptionId}`);
  } catch (error) {
    console.error('[Creem Webhook] Error in handleSubscriptionTrialEnded:', error);
  }
}

async function handleSubscriptionPaused(data: CreemWebhookData) {
  const { subscriptionId, customerId: _customerId, userId: _userId } = data;

  try {
    if (!subscriptionId) {
      console.error('[Creem Webhook] Missing subscription ID in paused event');
      return;
    }

    const paymentRecord = await paymentRepository.findBySubscriptionId(subscriptionId);

    if (paymentRecord) {
      await paymentRepository.update(subscriptionId, {
        status: 'paused',
      });
    }

    console.log(`[Creem Webhook] Subscription paused: ${subscriptionId}`);
  } catch (error) {
    console.error('[Creem Webhook] Error in handleSubscriptionPaused:', error);
  }
}

async function handleRefundCreated(data: CreemWebhookData) {
  const { customerId: _customerId, subscriptionId, checkoutId, amount } = data;

  try {
    console.log(
      `[Creem Webhook] Refund created for ${subscriptionId || checkoutId}, amount: ${amount}`
    );

    if (subscriptionId) {
      const paymentRecord = await paymentRepository.findBySubscriptionId(subscriptionId);

      if (paymentRecord) {
        // Mark subscription as canceled due to refund
        await paymentRepository.update(subscriptionId, {
          status: 'canceled',
        });

        // TODO: Revoke credits if refund within X days
        console.log(`[Creem Webhook] Subscription ${subscriptionId} canceled due to refund`);
      }
    }
  } catch (error) {
    console.error('[Creem Webhook] Error in handleRefundCreated:', error);
  }
}

async function handleDisputeCreated(data: CreemWebhookData) {
  const { customerId: _customerId, subscriptionId, amount } = data;

  try {
    console.log(`[Creem Webhook] Dispute created for ${subscriptionId}, amount: ${amount}`);

    if (subscriptionId) {
      const paymentRecord = await paymentRepository.findBySubscriptionId(subscriptionId);

      if (paymentRecord) {
        // Freeze credits until dispute is resolved
        // TODO: Implement credit freezing logic
        console.log(`[Creem Webhook] Dispute opened for subscription ${subscriptionId}`);
      }
    }
  } catch (error) {
    console.error('[Creem Webhook] Error in handleDisputeCreated:', error);
  }
}

async function handlePaymentFailed(data: CreemWebhookData) {
  const {
    customerId: _customerId,
    subscriptionId,
    userId: _userId,
    attemptCount,
    amount,
    currency,
  } = data;

  try {
    console.log(
      `[Creem Webhook] Payment failed for subscription ${subscriptionId}, attempt ${attemptCount}`
    );

    if (!subscriptionId) {
      console.error('[Creem Webhook] Missing subscription ID in payment failed event');
      return;
    }

    const paymentRecord = await paymentRepository.findBySubscriptionId(subscriptionId);

    if (paymentRecord) {
      await paymentRepository.update(subscriptionId, {
        status: 'past_due',
      });

      await paymentRepository.createEvent({
        paymentId: paymentRecord.id,
        eventType: 'invoice.payment_failed',
        creemEventId: data.eventId || randomUUID(),
        eventData: JSON.stringify({
          subscriptionId,
          userId: paymentRecord.userId,
          attemptCount,
          amount,
          currency,
          failedAt: new Date().toISOString(),
        }),
      });

      console.warn('[Creem Webhook] Payment failed, subscription marked as past_due', {
        subscriptionId,
        userId: paymentRecord.userId,
        attemptCount,
        amount,
      });

      if (attemptCount >= 3) {
        console.error('[Creem Webhook] Multiple payment failures detected', {
          subscriptionId,
          attemptCount,
          userId: paymentRecord.userId,
        });
      }
    } else {
      console.error('[Creem Webhook] Payment record not found for failed payment', {
        subscriptionId,
      });
    }
  } catch (error) {
    console.error('[Creem Webhook] Error in handlePaymentFailed:', error);
  }
}
