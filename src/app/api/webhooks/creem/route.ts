// @ts-nocheck
import { randomUUID } from 'node:crypto';
import { paymentConfig } from '@/config/payment.config';
import { env } from '@/env';
import { creemService } from '@/lib/creem/creem-service';
import {
  type BillingInterval,
  formatPlanName,
  getCreditsForPlan,
  resolvePlanByIdentifier,
  resolvePlanByProductId,
} from '@/lib/creem/plan-utils';
import { normalizeCreemStatus } from '@/lib/creem/status-utils';
import { grantSubscriptionCredits } from '@/lib/creem/subscription-credits';
import { db } from '@/server/db';
import { paymentRepository } from '@/server/db/repositories/payment-repository';
import { creditTransactions, userCredits } from '@/server/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Adjust credits when changing plans (upgrade/downgrade) or intervals
 */
async function adjustCreditsForPlanChange(
  userId: string,
  oldPlanIdentifier: string,
  newPlanIdentifier: string,
  subscriptionId: string,
  oldInterval?: BillingInterval,
  newInterval?: BillingInterval
) {
  try {
    // Use provided intervals or default to month
    const oldIntervalValue: BillingInterval = oldInterval || 'month';
    const newIntervalValue: BillingInterval = newInterval || 'month';

    // Calculate credits using respective intervals for old and new plans
    // Handle 'free' plan explicitly
    const oldPlanId =
      oldPlanIdentifier === 'free' || !oldPlanIdentifier ? 'free' : oldPlanIdentifier;
    const newPlanId =
      newPlanIdentifier === 'free' || !newPlanIdentifier ? 'free' : newPlanIdentifier;

    const oldCreditInfo = getCreditsForPlan(oldPlanId, oldIntervalValue);
    const newCreditInfo = getCreditsForPlan(newPlanId, newIntervalValue);

    // Allow adjustment even if one plan is 'free' (no plan resolved)
    if (!oldCreditInfo.plan && oldPlanId !== 'free') {
      console.log(
        `[Creem Webhook] Unable to resolve old plan for credit adjustment: ${oldPlanIdentifier}`
      );
      return;
    }

    if (!newCreditInfo.plan && newPlanId !== 'free') {
      console.log(
        `[Creem Webhook] Unable to resolve new plan for credit adjustment: ${newPlanIdentifier}`
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
        if (creditDifference <= 0) {
          console.warn(
            `[Creem Webhook] No credit account for ${userId}, skipping negative/zero adjustment (${creditDifference}).`
          );
          return;
        }

        const now = new Date();
        const initialBalance = creditDifference;

        await tx.insert(userCredits).values({
          id: randomUUID(),
          userId,
          balance: initialBalance,
          totalEarned: initialBalance,
          totalSpent: 0,
          frozenBalance: 0,
          createdAt: now,
          updatedAt: now,
        });

        await tx.insert(creditTransactions).values({
          id: randomUUID(),
          userId,
          type: 'earn',
          amount: initialBalance,
          balanceAfter: initialBalance,
          source: 'subscription',
          description: `Plan upgrade: ${oldCreditInfo.planId} ${oldIntervalValue} → ${newCreditInfo.planId} ${newIntervalValue}`,
          referenceId,
          metadata: JSON.stringify({
            oldPlanId: oldCreditInfo.planId,
            newPlanId: newCreditInfo.planId,
            oldPlanIdentifier,
            newPlanIdentifier,
            oldInterval: oldIntervalValue,
            newInterval: newIntervalValue,
            subscriptionId,
            provider: 'creem',
            creditDifference,
            createdAccount: true,
          }),
        });

        console.log(
          `[Creem Webhook] Created credit account for ${userId} with initial balance ${initialBalance} (plan upgrade).`
        );
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
        description: `Plan ${creditDifference > 0 ? 'upgrade' : 'downgrade'}: ${oldCreditInfo.planId} ${oldIntervalValue} → ${newCreditInfo.planId} ${newIntervalValue}`,
        referenceId,
        metadata: JSON.stringify({
          oldPlanId: oldCreditInfo.planId,
          newPlanId: newCreditInfo.planId,
          oldPlanIdentifier,
          newPlanIdentifier,
          oldInterval: oldIntervalValue,
          newInterval: newIntervalValue,
          subscriptionId,
          provider: 'creem',
          creditDifference,
        }),
      });
    });

    console.log(
      `[Creem Webhook] Adjusted credits by ${creditDifference} for user ${userId} (${oldCreditInfo.planId} ${oldIntervalValue} → ${newCreditInfo.planId} ${newIntervalValue})`
    );
  } catch (error) {
    console.error('[Creem Webhook] Error adjusting credits:', error);
  }
}

async function hasInitialSubscriptionCreditGrant(userId: string, subscriptionId: string) {
  try {
    const transactions = await db
      .select({
        metadata: creditTransactions.metadata,
      })
      .from(creditTransactions)
      .where(
        and(eq(creditTransactions.userId, userId), eq(creditTransactions.source, 'subscription'))
      )
      .orderBy(desc(creditTransactions.createdAt))
      .limit(20);

    return transactions.some((transaction) => {
      if (!transaction.metadata) {
        return false;
      }

      try {
        const metadata = JSON.parse(transaction.metadata);
        return (
          metadata?.subscriptionId === subscriptionId &&
          metadata?.provider === 'creem' &&
          !metadata?.isRenewal
        );
      } catch (error) {
        console.warn('[Creem Webhook] Unable to parse credit transaction metadata', {
          userId,
          subscriptionId,
          error,
        });
        return false;
      }
    });
  } catch (error) {
    console.error('[Creem Webhook] Error checking existing credit grants:', {
      userId,
      subscriptionId,
      error,
    });
    return false;
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
  const {
    userId,
    customerId,
    subscriptionId,
    planId,
    trialEnd,
    billingInterval,
    status: incomingStatus,
  } = data;

  if (!userId || !planId) {
    console.error('[Creem Webhook] Missing required data for checkout complete');
    return;
  }

  try {
    if (subscriptionId) {
      const existingRecord = await paymentRepository.findBySubscriptionId(subscriptionId);
      if (!existingRecord) {
        const normalizedStatus = normalizeCreemStatus(
          incomingStatus || (trialEnd ? 'trialing' : 'active')
        );

        await paymentRepository.create({
          id: subscriptionId,
          provider: 'creem',
          priceId: planId,
          type: 'subscription',
          userId,
          customerId: customerId || '',
          subscriptionId,
          status: normalizedStatus,
          interval: billingInterval === 'year' ? 'year' : 'month',
          trialEnd: trialEnd ? new Date(trialEnd) : undefined,
        });
        await paymentRepository.cancelOtherActiveSubscriptions(userId, subscriptionId);

        // Grant credits immediately for non-trial subscriptions
        if (normalizedStatus !== 'trialing') {
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
      `[Creem Webhook] Checkout completed for user ${userId} (${incomingStatus || (trialEnd ? 'trial' : 'active')})`
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
    interval,
  } = data;

  if (!subscriptionId || !customerId) {
    console.error('[Creem Webhook] Missing subscription ID or customer ID');
    return;
  }

  try {
    const existingRecord = await paymentRepository.findBySubscriptionId(subscriptionId);

    const normalizedStatus = normalizeCreemStatus(status);

    if (!existingRecord) {
      const ownerUserId = userId || customerId;
      await paymentRepository.create({
        id: subscriptionId,
        provider: 'creem',
        priceId: planId || '',
        type: 'subscription',
        userId: ownerUserId,
        customerId,
        subscriptionId,
        status: normalizedStatus,
        interval: interval === 'year' ? 'year' : 'month',
        periodStart: currentPeriodStart ? new Date(currentPeriodStart) : undefined,
        periodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : undefined,
        trialStart: trialStart ? new Date(trialStart) : undefined,
        trialEnd: trialEnd ? new Date(trialEnd) : undefined,
      });
      await paymentRepository.cancelOtherActiveSubscriptions(ownerUserId, subscriptionId);

      // Only grant credits if not in trial or if trial just ended
      if (planId && userId && normalizedStatus !== 'trialing') {
        await grantSubscriptionCredits(userId, planId, subscriptionId, data.interval, false);
      } else if (normalizedStatus === 'trialing') {
        console.log(
          '[Creem Webhook] Trial subscription created - credits will be granted after trial ends'
        );
      }
    } else {
      console.log(`[Creem Webhook] Subscription ${subscriptionId} already exists - updating`);

      // Update existing record if status changed
      await paymentRepository.update(subscriptionId, {
        status: normalizedStatus || existingRecord.status,
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

    console.log(
      `[Creem Webhook] Created subscription ${subscriptionId} with status ${normalizedStatus}`
    );
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
      targetSubscription = subscriptions.find((s) => {
        const normalized = normalizeCreemStatus(s.status);
        return normalized === 'active' || normalized === 'trialing';
      });
    }

    if (targetSubscription) {
      const oldPriceId = targetSubscription.priceId;
      const oldProductId = targetSubscription.productId;
      const oldInterval = targetSubscription.interval || 'month';
      const newPriceId = planId || oldPriceId;
      const newProductId = data.productId || oldProductId;
      const newInterval = data.interval || targetSubscription.interval || 'month';
      const oldStatus = normalizeCreemStatus(targetSubscription.status);
      const newStatus = normalizeCreemStatus(status);

      // Resolve plan IDs from identifiers (priceId or productId)
      const oldPlanResolved =
        resolvePlanByIdentifier(oldPriceId, oldInterval) ||
        resolvePlanByProductId(oldProductId, oldInterval);
      const newPlanResolved =
        resolvePlanByIdentifier(newPriceId, newInterval) ||
        resolvePlanByProductId(newProductId, newInterval);

      const oldPlanId = oldPlanResolved?.plan?.id || oldPriceId || 'free';
      const newPlanId = newPlanResolved?.plan?.id || newPriceId || 'free';

      // Detect plan or interval change (upgrade/downgrade)
      const planChanged = oldPlanId !== newPlanId;
      const intervalChanged = oldInterval !== newInterval;

      if (planChanged || intervalChanged) {
        console.log(
          `[Creem Webhook] Plan/interval change detected: ${oldPlanId} ${oldInterval} → ${newPlanId} ${newInterval} (from priceId: ${oldPriceId} → ${newPriceId})`
        );

        // Calculate credit difference using resolved plan IDs with their respective intervals
        const oldCreditInfo = getCreditsForPlan(oldPlanId, oldInterval);
        const newCreditInfo = getCreditsForPlan(newPlanId, newInterval);
        const creditDifference = newCreditInfo.amount - oldCreditInfo.amount;

        if (creditDifference !== 0) {
          const isDowngrade = creditDifference < 0;

          if (isDowngrade) {
            // Downgrade: Schedule for period end, don't deduct credits immediately
            // The downgrade will be processed when the period ends (in renewal detection)
            console.log(
              `[Creem Webhook] Downgrade detected (${creditDifference} credits). Scheduled for period end. Credits will be adjusted at renewal.`
            );
            // Set cancelAtPeriodEnd to indicate downgrade is scheduled
            await paymentRepository.update(targetSubscription.id, {
              cancelAtPeriodEnd: true,
            });
          } else {
            // Upgrade: Apply credit difference immediately
            console.log(
              `[Creem Webhook] Upgrade detected: ${creditDifference} credits. Applying immediately.`
            );
            await adjustCreditsForPlanChange(
              actualUserId,
              oldPlanId,
              newPlanId,
              targetSubscription.id,
              oldInterval,
              newInterval
            );
          }
        } else {
          console.log('[Creem Webhook] No credit adjustment needed (same credit amount)');
        }
      }

      const initialGrantExists = await hasInitialSubscriptionCreditGrant(
        actualUserId,
        targetSubscription.id
      );
      const wasPreviouslyInactive =
        oldStatus === 'canceled' ||
        oldStatus === 'incomplete' ||
        oldStatus === 'incomplete_expired';
      const isReactivation = wasPreviouslyInactive && newStatus === 'active';

      if (newStatus === 'active') {
        if (initialGrantExists && !isReactivation) {
          console.log(
            `[Creem Webhook] Active status detected for ${newPlanId}, but initial credits already exist. Skipping duplicate grant.`
          );
        } else {
          if (isReactivation && initialGrantExists) {
            console.log(
              `[Creem Webhook] Reactivation detected for ${newPlanId} (previous status ${oldStatus}). Prior credits were from an older cycle, granting fresh allocation.`
            );
          } else {
            console.log(
              `[Creem Webhook] Initial credits missing for ${newPlanId} (previous status ${oldStatus}). Granting now.`
            );
          }
          await grantSubscriptionCredits(
            actualUserId,
            newPlanId,
            targetSubscription.id,
            targetSubscription.interval || data.interval,
            false
          );
        }
      }

      const nextPeriodEnd = currentPeriodEnd ? new Date(currentPeriodEnd) : undefined;
      const previousPeriodEnd = targetSubscription.periodEnd;

      const hasRenewed =
        newStatus === 'active' &&
        nextPeriodEnd &&
        previousPeriodEnd &&
        nextPeriodEnd.getTime() - previousPeriodEnd.getTime() > 60 * 1000;

      if (hasRenewed) {
        console.log(
          `[Creem Webhook] Renewal detected for ${newPlanId} (period ${previousPeriodEnd?.toISOString()} → ${nextPeriodEnd.toISOString()})`
        );

        // Check if this is a downgrade that was scheduled for period end
        const wasScheduledDowngrade = targetSubscription.cancelAtPeriodEnd && planChanged;

        if (wasScheduledDowngrade) {
          // Downgrade scheduled for period end: grant full credits for new plan
          // This is like starting a new subscription with the new plan
          console.log(
            `[Creem Webhook] Processing scheduled downgrade: old plan ${oldPlanId} ${oldInterval} ended, starting new plan ${newPlanId} ${newInterval}`
          );

          // Grant full credits for the new plan (like a new subscription)
          await grantSubscriptionCredits(
            actualUserId,
            newPlanId || 'free',
            targetSubscription.id,
            newInterval,
            false // Not a renewal, it's a new plan start
          );

          // Update plan info now that period has ended
          await paymentRepository.update(targetSubscription.id, {
            status: newStatus,
            periodEnd: nextPeriodEnd,
            cancelAtPeriodEnd: false, // Clear the downgrade flag
            priceId: newPlanId,
            interval: newInterval,
          });
        } else {
          // Normal renewal: grant full credits for the new period
          await grantSubscriptionCredits(
            actualUserId,
            newPlanId,
            targetSubscription.id,
            newInterval,
            true
          );

          // Update subscription info
          await paymentRepository.update(targetSubscription.id, {
            status: newStatus,
            periodEnd: nextPeriodEnd,
            cancelAtPeriodEnd: cancelAtPeriodEnd,
            priceId: newPlanId,
            interval: newInterval,
          });
        }
      } else {
        // No renewal detected, just update subscription info
        await paymentRepository.update(targetSubscription.id, {
          status: newStatus,
          periodEnd: nextPeriodEnd,
          cancelAtPeriodEnd: cancelAtPeriodEnd,
          priceId: newPlanId,
          interval: newInterval,
        });
      }

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
