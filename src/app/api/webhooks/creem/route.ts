// @ts-nocheck
import { randomUUID } from 'node:crypto';
import { paymentConfig } from '@/config/payment.config';
import { env } from '@/env';
import { creemService } from '@/lib/creem/creem-service';
import { enforceSingleCreemSubscription } from '@/lib/creem/enforce-single-subscription';
import {
  type BillingInterval,
  formatPlanName,
  getCreditsForPlan,
  resolvePlanByIdentifier,
  resolvePlanByProductId,
} from '@/lib/creem/plan-utils';
import { normalizeCreemStatus } from '@/lib/creem/status-utils';
import { grantSubscriptionCredits } from '@/lib/creem/subscription-credits';
import {
  sendCreditPackPurchaseEmail,
  sendSubscriptionCancelledEmail,
  sendSubscriptionCreatedEmail,
  sendSubscriptionDowngradedEmail,
  sendSubscriptionUpgradedEmail,
} from '@/lib/email';
import { getUserInfo } from '@/lib/email/user-helper';
import { db } from '@/server/db';
import { paymentRepository } from '@/server/db/repositories/payment-repository';
import { creditPackPurchase, creditTransactions, userCredits } from '@/server/db/schema';
import { and, desc, eq, or, sql } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Adjust credits when changing plans (upgrade/downgrade) or intervals
 * @deprecated This function is no longer used. Credits are now granted via grantSubscriptionCredits when scheduled upgrades take effect.
 *
 * REMOVED: This function used db.transaction() which is not supported by neon-http driver.
 * All credit adjustments now happen via grantSubscriptionCredits() which uses manual idempotency checks.
 */

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
  orderId?: string;
  amount?: number;
  reason?: string;
  priceId?: string;
  creditsGranted?: number;
  manualAdjustment?: number;
  credits?: number;
  productName?: string;
  productId?: string;
  currency?: string;
  [key: string]: unknown;
}

type CreemWebhookResult = CreemWebhookData & { type: string };

function normalizeIntervalValue(value?: string | null): BillingInterval | undefined {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  if (lower.includes('year')) {
    return 'year';
  }
  if (lower.includes('month')) {
    return 'month';
  }
  if (lower === 'annual' || lower === 'annually') {
    return 'year';
  }
  if (lower === 'monthly') {
    return 'month';
  }
  return undefined;
}

const getCreditPackByIdentifier = (productId?: string | null, credits?: number) => {
  if (productId) {
    const pack = paymentConfig.creditPacks.find((pack) => pack.creemProductKey === productId);
    if (pack) {
      return pack;
    }
  }
  if (typeof credits === 'number' && Number.isFinite(credits)) {
    return paymentConfig.creditPacks.find((pack) => pack.credits === credits);
  }
  return undefined;
};

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

    // Check if event already processed (with error handling)
    let isProcessed = false;
    try {
      isProcessed = await paymentRepository.isCreemEventProcessed(eventId);
    } catch (checkError) {
      console.error('[Creem Webhook] Error checking if event processed:', {
        eventId,
        error: checkError instanceof Error ? checkError.message : String(checkError),
        requestId,
      });
      // Continue processing if check fails (fail open)
    }

    if (isProcessed) {
      console.log('[Creem Webhook] Event already processed', { eventType, eventId, requestId });
      return NextResponse.json({ received: true });
    }

    console.log('[Creem Webhook] Processing event', { eventType, eventId, requestId });

    const rawResult = await creemService.handleWebhookEvent(event);

    if (!rawResult || typeof rawResult !== 'object' || !('type' in rawResult)) {
      return NextResponse.json({ received: true });
    }

    const result = { ...rawResult, eventId } as CreemWebhookResult;

    switch (result.type) {
      case 'checkout_complete':
        await handleCheckoutComplete(result);
        break;

      case 'credit_pack_purchase':
        await handleCreditPackPurchase(result);
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
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      requestId,
      processingTime,
    });

    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function handleCreditPackPurchase(data: CreemWebhookData) {
  const { userId, credits, productName, checkoutId, orderId, productId, amount, currency } = data;

  console.log('[Creem Webhook] handleCreditPackPurchase called with:', {
    userId,
    credits,
    productName,
    productId,
    checkoutId,
    orderId,
    allData: JSON.stringify(data),
  });

  if (!userId) {
    console.error('[Creem Webhook] Missing userId for credit pack purchase', { data });
    throw new Error('Missing userId for credit pack purchase');
  }

  if (!credits || credits <= 0) {
    console.error('[Creem Webhook] Invalid or missing credits amount for credit pack purchase', {
      credits,
      productName,
      productId,
      data,
    });
    throw new Error(`Invalid credits amount: ${credits}`);
  }

  try {
    const creditPack = getCreditPackByIdentifier(productId, credits);
    const rawAmount = typeof amount === 'number' ? amount : creditPack?.price ?? 0;
    const normalizedAmount = rawAmount > 100 ? rawAmount / 100 : rawAmount;

    // Generate referenceId without timestamp to ensure idempotency
    // Use orderId first (more stable), fallback to checkoutId
    const stableId = orderId || checkoutId;
    if (!stableId) {
      throw new Error('Missing orderId and checkoutId for credit pack purchase');
    }
    const referenceId = `creem_credit_pack_${stableId}`;

    // Check for existing transaction to prevent duplicates
    // Check by referenceId first (most reliable)
    const [existingByReference] = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.referenceId, referenceId))
      .limit(1);

    if (existingByReference) {
      console.log(
        `[Creem Webhook] Credit pack purchase already processed for reference ${referenceId}`
      );
      return;
    }

    // Also check by orderId or checkoutId in metadata (fallback check)
    // This handles cases where referenceId might have been different
    const orderIdPattern = orderId ? `%"orderId":"${orderId}"%` : null;
    const checkoutIdPattern = checkoutId ? `%"checkoutId":"${checkoutId}"%` : null;

    if (orderIdPattern || checkoutIdPattern) {
      const conditions = [
        eq(creditTransactions.userId, userId),
        eq(creditTransactions.source, 'purchase'),
      ];

      const metadataConditions = [];
      if (orderIdPattern) {
        metadataConditions.push(sql`${creditTransactions.metadata} LIKE ${orderIdPattern}`);
      }
      if (checkoutIdPattern) {
        metadataConditions.push(sql`${creditTransactions.metadata} LIKE ${checkoutIdPattern}`);
      }

      if (metadataConditions.length > 0) {
        conditions.push(
          metadataConditions.length === 1 ? metadataConditions[0]! : or(...metadataConditions)!
        );

        const existingByMetadata = await db
          .select()
          .from(creditTransactions)
          .where(and(...conditions))
          .limit(1);

        if (existingByMetadata.length > 0) {
          console.log(
            `[Creem Webhook] Credit pack purchase already processed (found by metadata): orderId=${orderId}, checkoutId=${checkoutId}`
          );
          return;
        }
      }
    }

    // Get or create user credit account
    const [userCredit] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .limit(1);

    const creditPack = paymentConfig.creditPacks.find(
      (pack) => pack.creemProductKey === productId || pack.credits === credits
    );
    const rawAmount = typeof amount === 'number' ? amount : (creditPack?.price ?? 0);
    const normalizedAmount = rawAmount > 100 ? rawAmount / 100 : rawAmount;
    const metadataPayload = {
      provider: 'creem',
      checkoutId,
      orderId,
      productId,
      productName,
      credits,
      amount: normalizedAmount,
      currency: currency || 'USD',
      creemEventId: data.eventId,
    };

    const metadataPayload = {
      provider: 'creem',
      checkoutId,
      orderId,
      productId,
      productName,
      credits,
      amount: normalizedAmount,
      currency: currency || 'USD',
      creemEventId: data.eventId,
    };

    const insertCreditTransaction = async (balanceAfter: number) => {
      const [transactionRecord] = await db
        .insert(creditTransactions)
        .values({
          id: randomUUID(),
          userId,
          type: 'earn',
          amount: credits,
          balanceAfter,
          source: 'purchase',
          description: `Credit pack purchase: ${productName || `${credits} credits`}`,
          referenceId,
          metadata: JSON.stringify(metadataPayload),
        })
        .returning({ id: creditTransactions.id });
      return transactionRecord?.id ?? null;
    };

    const insertCreditPackPurchase = async (creditTransactionId: string | null) => {
      await db.insert(creditPackPurchase).values({
        id: randomUUID(),
        userId,
        creditPackId: creditPack?.id || productId || 'unknown',
        credits,
        amountCents: Math.round((normalizedAmount || 0) * 100),
        currency: currency || 'USD',
        provider: 'creem',
        orderId: orderId || null,
        checkoutId: checkoutId || null,
        creditTransactionId,
        metadata: metadataPayload,
        createdAt: new Date(),
      });
    };

    if (!userCredit) {
      // Create credit account with purchased credits
      const now = new Date();
      await db.insert(userCredits).values({
        id: randomUUID(),
        userId,
        balance: credits,
        totalEarned: credits,
        totalSpent: 0,
        frozenBalance: 0,
        createdAt: now,
        updatedAt: now,
      });

      const creditTransactionId = await insertCreditTransaction(credits);
      await insertCreditPackPurchase(creditTransactionId);

      console.log(
        `[Creem Webhook] Created credit account for ${userId} with ${credits} credits from pack purchase`
      );
    } else {
      // Add credits to existing account
      const newBalance = userCredit.balance + credits;

      await db
        .update(userCredits)
        .set({
          balance: newBalance,
          totalEarned: userCredit.totalEarned + credits,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId));

      const creditTransactionId = await insertCreditTransaction(newBalance);
      await insertCreditPackPurchase(creditTransactionId);

      console.log(
        `[Creem Webhook] Granted ${credits} credits to ${userId} from pack purchase (new balance: ${newBalance})`
      );
    }

    // Send credit pack purchase email
    try {
      const userInfo = await getUserInfo(userId);
      if (userInfo) {
        // Find credit pack by credits amount
        const packName = creditPack?.name || productName || `${credits} Credits`;
        const packPrice = normalizedAmount || creditPack?.price || 0;

        await sendCreditPackPurchaseEmail(
          userInfo.email,
          userInfo.name,
          packName,
          credits,
          packPrice
        );
        console.log(`[Creem Webhook] Credit pack purchase email sent to ${userInfo.email}`);
      }
    } catch (emailError) {
      console.error('[Creem Webhook] Failed to send credit pack purchase email:', emailError);
      // Don't throw - email failure shouldn't block webhook processing
    }

    console.log(
      `[Creem Webhook] Successfully processed credit pack purchase for user ${userId}: ${credits} credits`
    );

    // Note: We don't call createEvent for credit pack purchases because:
    // 1. payment_event table requires paymentId to exist in payment table
    // 2. Credit pack purchases don't create payment records
    // 3. Duplicate prevention is handled by:
    //    - Main webhook handler checks isCreemEventProcessed (now checks credit_transactions too)
    //    - This handler checks referenceId in credit_transactions
    // 4. Event tracking is done via credit_transactions.metadata which includes creemEventId
  } catch (error) {
    console.error('[Creem Webhook] Error in handleCreditPackPurchase:', {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      userId,
      credits,
      orderId,
      checkoutId,
    });
    throw error;
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
    interval,
    status: incomingStatus,
  } = data;

  console.log('[Creem Webhook] handleCheckoutComplete called with:', {
    userId,
    customerId,
    subscriptionId,
    planId,
    billingInterval,
    interval,
    status: incomingStatus,
  });

  if (!userId) {
    console.error('[Creem Webhook] Missing userId for checkout complete', { data });
    return;
  }

  if (!planId) {
    console.error('[Creem Webhook] Missing planId for checkout complete', { data });
    return;
  }

  try {
    // Enforce single active subscription rule BEFORE processing
    const activeCount = await paymentRepository.getActiveSubscriptionCount(userId);
    if (activeCount > 1) {
      console.warn(
        `[Creem Webhook] User ${userId} has ${activeCount} active subscriptions - enforcing rule`
      );
      await enforceSingleCreemSubscription(userId);
    }

    if (subscriptionId) {
      const existingRecord = await paymentRepository.findBySubscriptionId(subscriptionId);
      if (!existingRecord) {
        // New subscription - create record
        const normalizedStatus = normalizeCreemStatus(
          incomingStatus || (trialEnd ? 'trialing' : 'active')
        );

        const resolvedInterval =
          normalizeIntervalValue(interval) || normalizeIntervalValue(billingInterval) || 'month';

        await paymentRepository.create({
          id: subscriptionId,
          provider: 'creem',
          priceId: planId,
          type: 'subscription',
          userId,
          customerId: customerId || '',
          subscriptionId,
          status: normalizedStatus,
          interval: resolvedInterval,
          trialEnd: trialEnd ? new Date(trialEnd) : undefined,
          cancelAtPeriodEnd: false,
        });
        await enforceSingleCreemSubscription(userId, subscriptionId);

        // Grant credits immediately for non-trial subscriptions
        if (normalizedStatus !== 'trialing') {
          await grantSubscriptionCredits(userId, planId, subscriptionId, resolvedInterval, false);

          // Send subscription created email
          try {
            const userInfo = await getUserInfo(userId);
            if (userInfo) {
              const plan = paymentConfig.plans.find((p) => p.id === planId);
              const planName = plan?.name || planId;
              const planPrice =
                resolvedInterval === 'year' && plan?.yearlyPrice
                  ? plan.yearlyPrice
                  : plan?.price || 0;
              const credits = getCreditsForPlan(planId, resolvedInterval).amount;

              await sendSubscriptionCreatedEmail(
                userInfo.email,
                userInfo.name,
                planName,
                planPrice,
                resolvedInterval,
                credits
              );
              console.log(`[Creem Webhook] Subscription created email sent to ${userInfo.email}`);
            }
          } catch (emailError) {
            console.error('[Creem Webhook] Failed to send subscription created email:', emailError);
            // Don't throw - email failure shouldn't block webhook processing
          }
        } else {
          console.log(
            '[Creem Webhook] Trial subscription - credits will be granted after trial ends'
          );
        }
      } else {
        // Existing subscription - handle upgrade/downgrade
        console.log(
          `[Creem Webhook] Subscription ${subscriptionId} already exists, checking for plan change`
        );

        const oldPlanId = existingRecord.priceId;
        const newPlanId = planId;
        const oldInterval = existingRecord.interval || 'month';
        const newInterval =
          normalizeIntervalValue(interval) ||
          normalizeIntervalValue(billingInterval) ||
          existingRecord.interval ||
          'month';

        const planChanged = oldPlanId !== newPlanId;
        const intervalChanged = oldInterval !== newInterval;

        if (planChanged || intervalChanged) {
          console.log(
            `[Creem Webhook] Plan/interval change detected in checkout: ${oldPlanId} ${oldInterval} → ${newPlanId} ${newInterval}`
          );

          // Check if this is an upgrade (from metadata or plan comparison)
          const isUpgrade =
            (oldPlanId === 'pro' && newPlanId === 'proplus') ||
            (oldPlanId === 'free' && (newPlanId === 'pro' || newPlanId === 'proplus'));

          const normalizedStatus = normalizeCreemStatus(
            incomingStatus || (trialEnd ? 'trialing' : 'active')
          );

          // 方案2: 对于升级，应该延迟生效（在周期结束时生效）
          // 设置 scheduled 字段，保持当前 priceId 不变
          // 积分将在周期结束时通过 handleSubscriptionUpdate 发放
          if (isUpgrade) {
            // Calculate when the upgrade should take effect (current period end)
            const currentPeriodEnd = existingRecord.periodEnd;
            const estimatedEffectiveDate =
              currentPeriodEnd ||
              (() => {
                const base = existingRecord.periodStart
                  ? new Date(existingRecord.periodStart)
                  : new Date();
                const monthsToAdd = (existingRecord.interval === 'year' ? 12 : 1) || 1;
                base.setMonth(base.getMonth() + monthsToAdd);
                return base;
              })();

            // Calculate next period end for scheduled upgrade
            const nextPeriodEnd = (() => {
              const base = new Date(estimatedEffectiveDate);
              const monthsToAdd = newInterval === 'year' ? 12 : 1;
              base.setMonth(base.getMonth() + monthsToAdd);
              return base;
            })();

            // Set scheduled upgrade fields - do NOT update priceId yet
            await paymentRepository.update(existingRecord.id, {
              status: normalizedStatus,
              // Keep current priceId (Pro), set scheduled fields for Pro+
              scheduledPlanId: newPlanId,
              scheduledInterval: newInterval,
              scheduledPeriodStart: estimatedEffectiveDate,
              scheduledPeriodEnd: nextPeriodEnd,
              scheduledAt: new Date(),
            });

            console.log(
              `[Creem Webhook] Scheduled upgrade set: ${oldPlanId} → ${newPlanId} will take effect at ${estimatedEffectiveDate.toISOString()}. Credits will be granted when upgrade takes effect.`
            );
          } else {
            // Downgrade or other change - update immediately
            await paymentRepository.update(existingRecord.id, {
              priceId: newPlanId,
              productId: data.productId,
              interval: newInterval,
              status: normalizedStatus,
              // Clear any existing scheduled upgrade
              scheduledPlanId: null,
              scheduledInterval: null,
              scheduledPeriodStart: null,
              scheduledPeriodEnd: null,
              scheduledAt: null,
            });
          }
        } else {
          // No plan change, just update status if needed
          const normalizedStatus = normalizeCreemStatus(
            incomingStatus || (trialEnd ? 'trialing' : 'active')
          );

          if (existingRecord.status !== normalizedStatus) {
            await paymentRepository.update(existingRecord.id, {
              status: normalizedStatus,
            });
          }
        }
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
    // Enforce single active subscription rule BEFORE processing
    const ownerUserId = userId || customerId;
    const activeCount = await paymentRepository.getActiveSubscriptionCount(ownerUserId);
    if (activeCount > 0) {
      console.warn(
        `[Creem Webhook] User ${ownerUserId} already has ${activeCount} active subscription(s) - enforcing rule`
      );
      await enforceSingleCreemSubscription(ownerUserId);
    }

    const existingRecord = await paymentRepository.findBySubscriptionId(subscriptionId);

    const normalizedStatus = normalizeCreemStatus(status);

    if (!existingRecord) {
      const resolvedInterval = normalizeIntervalValue(interval) || 'month';
      await paymentRepository.create({
        id: subscriptionId,
        provider: 'creem',
        priceId: planId || '',
        type: 'subscription',
        userId: ownerUserId,
        customerId,
        subscriptionId,
        status: normalizedStatus,
        interval: resolvedInterval,
        periodStart: currentPeriodStart ? new Date(currentPeriodStart) : undefined,
        periodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : undefined,
        trialStart: trialStart ? new Date(trialStart) : undefined,
        trialEnd: trialEnd ? new Date(trialEnd) : undefined,
        cancelAtPeriodEnd: false,
      });
      await enforceSingleCreemSubscription(ownerUserId, subscriptionId);

      // Only grant credits if not in trial or if trial just ended
      if (planId && userId && normalizedStatus !== 'trialing') {
        await grantSubscriptionCredits(userId, planId, subscriptionId, resolvedInterval, false);

        // Send subscription created email
        try {
          const userInfo = await getUserInfo(userId);
          if (userInfo) {
            const plan = paymentConfig.plans.find((p) => p.id === planId);
            const planName = plan?.name || planId;
            const planPrice =
              resolvedInterval === 'year' && plan?.yearlyPrice
                ? plan.yearlyPrice
                : plan?.price || 0;
            const credits = getCreditsForPlan(planId, resolvedInterval).amount;

            await sendSubscriptionCreatedEmail(
              userInfo.email,
              userInfo.name,
              planName,
              planPrice,
              resolvedInterval,
              credits
            );
            console.log(`[Creem Webhook] Subscription created email sent to ${userInfo.email}`);
          }
        } catch (emailError) {
          console.error('[Creem Webhook] Failed to send subscription created email:', emailError);
          // Don't throw - email failure shouldn't block webhook processing
        }
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
    console.log('[Creem Webhook] handleSubscriptionUpdate called with:', {
      subscriptionId,
      customerId,
      userId,
      planId,
      productId: data.productId,
      status,
      currentPeriodEnd,
    });

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

      // Check if scheduled upgrade is already set (by upgrade API endpoint)
      // If so, this webhook is just notification of the API call, not an actual plan change
      const alreadyScheduled =
        targetSubscription.scheduledPlanId && targetSubscription.scheduledPlanId === newPlanId;

      if (alreadyScheduled) {
        console.log(
          `[Creem Webhook] Scheduled upgrade already set by API endpoint: ${oldPlanId} → ${newPlanId}. Skipping duplicate scheduling.`
        );
        // Don't process plan change - it's already scheduled by the upgrade API endpoint
        // The actual upgrade will be processed when the renewal webhook arrives at period end
      } else if (planChanged || intervalChanged) {
        console.log(
          `[Creem Webhook] Plan/interval change detected: ${oldPlanId} ${oldInterval} → ${newPlanId} ${newInterval} (from priceId: ${oldPriceId} → ${newPriceId})`
        );

        // Calculate credit difference using resolved plan IDs with their respective intervals
        const oldCreditInfo = getCreditsForPlan(oldPlanId, oldInterval);
        const newCreditInfo = getCreditsForPlan(newPlanId, newInterval);
        const creditDifference = newCreditInfo.amount - oldCreditInfo.amount;

        // 所有付费用户升级和降级都需要等到下个订阅周期开始时生效
        // 不立即应用积分变更，而是在周期结束时通过 scheduled 字段处理
        if (creditDifference !== 0) {
          const isDowngrade = creditDifference < 0;
          const isUpgrade = creditDifference > 0;

          if (isUpgrade) {
            // 升级：设置 scheduled 字段，延迟生效
            const currentPeriodEnd = targetSubscription.periodEnd;
            const estimatedEffectiveDate =
              currentPeriodEnd ||
              (() => {
                const base = targetSubscription.periodStart
                  ? new Date(targetSubscription.periodStart)
                  : new Date();
                const monthsToAdd = (oldInterval === 'year' ? 12 : 1) || 1;
                base.setMonth(base.getMonth() + monthsToAdd);
                return base;
              })();

            const nextPeriodEnd = (() => {
              const base = new Date(estimatedEffectiveDate);
              const monthsToAdd = newInterval === 'year' ? 12 : 1;
              base.setMonth(base.getMonth() + monthsToAdd);
              return base;
            })();

            console.log(
              `[Creem Webhook] Upgrade detected: ${oldPlanId} → ${newPlanId}. Scheduling for period end. Credits will be granted when upgrade takes effect.`
            );

            await paymentRepository.update(targetSubscription.id, {
              scheduledPlanId: newPlanId,
              scheduledInterval: newInterval,
              scheduledPeriodStart: estimatedEffectiveDate,
              scheduledPeriodEnd: nextPeriodEnd,
              scheduledAt: new Date(),
            });

            // Send upgrade email
            try {
              const userInfo = await getUserInfo(actualUserId);
              if (userInfo) {
                const oldPlan = paymentConfig.plans.find((p) => p.id === oldPlanId);
                const newPlan = paymentConfig.plans.find((p) => p.id === newPlanId);
                const oldPlanName = oldPlan?.name || oldPlanId;
                const newPlanName = newPlan?.name || newPlanId;
                const newPlanPrice =
                  newInterval === 'year' && newPlan?.yearlyPrice
                    ? newPlan.yearlyPrice
                    : newPlan?.price || 0;
                const newCredits = newCreditInfo.amount;

                await sendSubscriptionUpgradedEmail(
                  userInfo.email,
                  userInfo.name,
                  oldPlanName,
                  newPlanName,
                  newPlanPrice,
                  newInterval,
                  newCredits,
                  estimatedEffectiveDate
                );
                console.log(`[Creem Webhook] Upgrade email sent to ${userInfo.email}`);
              }
            } catch (emailError) {
              console.error('[Creem Webhook] Failed to send upgrade email:', emailError);
              // Don't throw - email failure shouldn't block webhook processing
            }
          } else if (isDowngrade) {
            // 降级：设置 scheduled 字段，延迟生效
            const currentPeriodEnd = targetSubscription.periodEnd;
            const estimatedEffectiveDate =
              currentPeriodEnd ||
              (() => {
                const base = targetSubscription.periodStart
                  ? new Date(targetSubscription.periodStart)
                  : new Date();
                const monthsToAdd = (oldInterval === 'year' ? 12 : 1) || 1;
                base.setMonth(base.getMonth() + monthsToAdd);
                return base;
              })();

            const nextPeriodEnd = (() => {
              const base = new Date(estimatedEffectiveDate);
              const monthsToAdd = newInterval === 'year' ? 12 : 1;
              base.setMonth(base.getMonth() + monthsToAdd);
              return base;
            })();

            console.log(
              `[Creem Webhook] Downgrade detected: ${oldPlanId} → ${newPlanId}. Scheduling for period end. Credits will be adjusted when downgrade takes effect.`
            );

            await paymentRepository.update(targetSubscription.id, {
              scheduledPlanId: newPlanId,
              scheduledInterval: newInterval,
              scheduledPeriodStart: estimatedEffectiveDate,
              scheduledPeriodEnd: nextPeriodEnd,
              scheduledAt: new Date(),
              cancelAtPeriodEnd: false, // 降级不是取消
            });

            // Send downgrade email
            try {
              const userInfo = await getUserInfo(actualUserId);
              if (userInfo) {
                const oldPlan = paymentConfig.plans.find((p) => p.id === oldPlanId);
                const newPlan = paymentConfig.plans.find((p) => p.id === newPlanId);
                const oldPlanName = oldPlan?.name || oldPlanId;
                const newPlanName = newPlan?.name || newPlanId;
                const newPlanPrice =
                  newInterval === 'year' && newPlan?.yearlyPrice
                    ? newPlan.yearlyPrice
                    : newPlan?.price || 0;
                const newCredits = newCreditInfo.amount;

                await sendSubscriptionDowngradedEmail(
                  userInfo.email,
                  userInfo.name,
                  oldPlanName,
                  newPlanName,
                  newPlanPrice,
                  newInterval,
                  newCredits,
                  estimatedEffectiveDate
                );
                console.log(`[Creem Webhook] Downgrade email sent to ${userInfo.email}`);
              }
            } catch (emailError) {
              console.error('[Creem Webhook] Failed to send downgrade email:', emailError);
              // Don't throw - email failure shouldn't block webhook processing
            }
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

        // 方案2: 检查是否有 scheduled upgrade
        const hasScheduledUpgrade =
          targetSubscription.scheduledPlanId &&
          targetSubscription.scheduledPeriodStart &&
          nextPeriodEnd &&
          new Date(targetSubscription.scheduledPeriodStart).getTime() <= nextPeriodEnd.getTime();

        if (hasScheduledUpgrade) {
          // Scheduled upgrade 生效：使用 scheduled 计划信息
          const scheduledPlanId = targetSubscription.scheduledPlanId;
          const scheduledInterval = targetSubscription.scheduledInterval || newInterval;
          const scheduledPeriodStart = targetSubscription.scheduledPeriodStart;
          const scheduledPeriodEnd = targetSubscription.scheduledPeriodEnd || nextPeriodEnd;

          console.log(
            `[Creem Webhook] Processing scheduled upgrade: ${oldPlanId} ${oldInterval} → ${scheduledPlanId} ${scheduledInterval}`
          );

          // Grant full credits for the new plan (like a new subscription)
          await grantSubscriptionCredits(
            actualUserId,
            scheduledPlanId,
            targetSubscription.id,
            scheduledInterval,
            false // Not a renewal, it's a plan upgrade
          );

          // Update plan info: apply scheduled upgrade
          await paymentRepository.update(targetSubscription.id, {
            status: newStatus,
            priceId: scheduledPlanId,
            productId: newProductId,
            interval: scheduledInterval,
            periodStart: scheduledPeriodStart,
            periodEnd: scheduledPeriodEnd,
            cancelAtPeriodEnd: cancelAtPeriodEnd,
            // Clear scheduled upgrade fields
            scheduledPlanId: null,
            scheduledInterval: null,
            scheduledPeriodStart: null,
            scheduledPeriodEnd: null,
            scheduledAt: null,
          });
        } else {
          // 检查是否有 scheduled downgrade（通过 scheduledPlanId 检测）
          const hasScheduledDowngrade =
            targetSubscription.scheduledPlanId &&
            targetSubscription.scheduledPeriodStart &&
            nextPeriodEnd &&
            new Date(targetSubscription.scheduledPeriodStart).getTime() <=
              nextPeriodEnd.getTime() &&
            (targetSubscription.scheduledPlanId === 'pro' ||
              targetSubscription.scheduledPlanId === 'free');

          if (hasScheduledDowngrade) {
            // Scheduled downgrade 生效：使用 scheduled 计划信息
            const scheduledPlanId = targetSubscription.scheduledPlanId;
            const scheduledInterval = targetSubscription.scheduledInterval || newInterval;
            const scheduledPeriodStart = targetSubscription.scheduledPeriodStart;
            const scheduledPeriodEnd = targetSubscription.scheduledPeriodEnd || nextPeriodEnd;

            console.log(
              `[Creem Webhook] Processing scheduled downgrade: ${oldPlanId} ${oldInterval} → ${scheduledPlanId} ${scheduledInterval}`
            );

            // Grant full credits for the new plan (like a new subscription)
            // 如果降级到 Free，不发放积分；如果降级到 Pro，发放 Pro 的完整积分
            if (scheduledPlanId !== 'free') {
              await grantSubscriptionCredits(
                actualUserId,
                scheduledPlanId,
                targetSubscription.id,
                scheduledInterval,
                false // Not a renewal, it's a plan change
              );
            }

            // Update plan info: apply scheduled downgrade
            await paymentRepository.update(targetSubscription.id, {
              status: newStatus,
              priceId: scheduledPlanId,
              productId: newProductId,
              interval: scheduledInterval,
              periodStart: scheduledPeriodStart,
              periodEnd: scheduledPeriodEnd,
              cancelAtPeriodEnd: cancelAtPeriodEnd,
              // Clear scheduled downgrade fields
              scheduledPlanId: null,
              scheduledInterval: null,
              scheduledPeriodStart: null,
              scheduledPeriodEnd: null,
              scheduledAt: null,
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
              productId: newProductId,
              interval: newInterval,
            });
          }
        }
      } else {
        // No renewal detected, just update subscription info
        // But check if we need to apply scheduled upgrade based on period start
        const hasScheduledUpgrade =
          targetSubscription.scheduledPlanId &&
          targetSubscription.scheduledPeriodStart &&
          nextPeriodEnd &&
          new Date(targetSubscription.scheduledPeriodStart).getTime() <= nextPeriodEnd.getTime();

        if (hasScheduledUpgrade) {
          // Apply scheduled upgrade even if no renewal detected
          const scheduledPlanId = targetSubscription.scheduledPlanId;
          const scheduledInterval = targetSubscription.scheduledInterval || newInterval;
          const scheduledPeriodStart = targetSubscription.scheduledPeriodStart;
          const scheduledPeriodEnd = targetSubscription.scheduledPeriodEnd || nextPeriodEnd;

          console.log(
            `[Creem Webhook] Applying scheduled upgrade without renewal: ${oldPlanId} → ${scheduledPlanId}`
          );

          await grantSubscriptionCredits(
            actualUserId,
            scheduledPlanId,
            targetSubscription.id,
            scheduledInterval,
            false
          );

          await paymentRepository.update(targetSubscription.id, {
            status: newStatus,
            priceId: scheduledPlanId,
            productId: newProductId,
            interval: scheduledInterval,
            periodStart: scheduledPeriodStart,
            periodEnd: scheduledPeriodEnd,
            cancelAtPeriodEnd: cancelAtPeriodEnd,
            scheduledPlanId: null,
            scheduledInterval: null,
            scheduledPeriodStart: null,
            scheduledPeriodEnd: null,
            scheduledAt: null,
          });

          // Send upgrade email when scheduled upgrade takes effect
          try {
            const userInfo = await getUserInfo(actualUserId);
            if (userInfo) {
              const oldPlan = paymentConfig.plans.find((p) => p.id === oldPlanId);
              const newPlan = paymentConfig.plans.find((p) => p.id === scheduledPlanId);
              const oldPlanName = oldPlan?.name || oldPlanId;
              const newPlanName = newPlan?.name || scheduledPlanId;
              const newPlanPrice =
                scheduledInterval === 'year' && newPlan?.yearlyPrice
                  ? newPlan.yearlyPrice
                  : newPlan?.price || 0;
              const newCredits = getCreditsForPlan(scheduledPlanId, scheduledInterval).amount;

              await sendSubscriptionUpgradedEmail(
                userInfo.email,
                userInfo.name,
                oldPlanName,
                newPlanName,
                newPlanPrice,
                scheduledInterval,
                newCredits,
                scheduledPeriodStart || new Date()
              );
              console.log(`[Creem Webhook] Scheduled upgrade email sent to ${userInfo.email}`);
            }
          } catch (emailError) {
            console.error('[Creem Webhook] Failed to send scheduled upgrade email:', emailError);
            // Don't throw - email failure shouldn't block webhook processing
          }
        } else {
          await paymentRepository.update(targetSubscription.id, {
            status: newStatus,
            periodEnd: nextPeriodEnd,
            cancelAtPeriodEnd: cancelAtPeriodEnd,
            priceId: newPlanId,
            productId: newProductId,
            interval: newInterval,
          });
        }
      }

      console.log(
        `[Creem Webhook] Updated subscription ${targetSubscription.id} for user ${actualUserId} (status: ${newStatus})`
      );
    } else {
      console.warn(`[Creem Webhook] No active subscription found for user ${actualUserId}`);
    }
  } catch (error) {
    console.error('[Creem Webhook] Error in handleSubscriptionUpdate:', {
      error,
      subscriptionId: data.subscriptionId,
      userId: data.userId,
      customerId: data.customerId,
      planId: data.planId,
      productId: data.productId,
    });
    throw error;
  }
}

async function handleSubscriptionDeleted(data: CreemWebhookData) {
  const { customerId, userId, currentPeriodEnd } = data;

  try {
    const subscriptions = await paymentRepository.findByCustomerId(customerId);
    if (subscriptions.length === 0) {
      console.error('[Creem Webhook] No subscription found for customer:', customerId);
      return;
    }

    const actualUserId = userId || subscriptions[0]?.userId;
    if (!actualUserId) {
      console.error('[Creem Webhook] Could not find userId for cancelled subscription');
      return;
    }

    for (const subscription of subscriptions) {
      await paymentRepository.update(subscription.id, {
        status: 'canceled',
      });

      // Send cancellation email
      try {
        const userInfo = await getUserInfo(actualUserId);
        if (userInfo) {
          const plan = paymentConfig.plans.find((p) => p.id === subscription.priceId);
          const planName = plan?.name || subscription.priceId || 'Subscription';
          const cancelDate = new Date();
          const accessUntilDate =
            subscription.periodEnd || currentPeriodEnd
              ? new Date(currentPeriodEnd || subscription.periodEnd)
              : cancelDate;

          await sendSubscriptionCancelledEmail(
            userInfo.email,
            userInfo.name,
            planName,
            cancelDate,
            accessUntilDate
          );
          console.log(`[Creem Webhook] Cancellation email sent to ${userInfo.email}`);
        }
      } catch (emailError) {
        console.error('[Creem Webhook] Failed to send cancellation email:', emailError);
        // Don't throw - email failure shouldn't block webhook processing
      }
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
