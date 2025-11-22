import { getSessionFromRequest } from '@/lib/auth/auth-utils';
import { creemService } from '@/lib/creem/creem-service';
import { enforceSingleCreemSubscription } from '@/lib/creem/enforce-single-subscription';
import {
  getCreditsForPlan,
  resolvePlanByIdentifier,
  resolvePlanByProductId,
} from '@/lib/creem/plan-utils';
import { normalizeCreemStatus } from '@/lib/creem/status-utils';
import { grantSubscriptionCredits } from '@/lib/creem/subscription-credits';
import type { PaymentStatus } from '@/payment/types';
import { paymentRepository } from '@/server/db/repositories/payment-repository';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

type RemoteSubscriptionResult = Awaited<ReturnType<typeof creemService.getSubscription>> & {
  timedOut?: boolean;
  failed?: boolean;
};

const REMOTE_SUBSCRIPTION_TIMEOUT_MS = 4000;

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request.headers);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      subscriptionId,
      planId,
      productId,
      interval,
      customerId,
      checkoutId,
    }: {
      subscriptionId?: string;
      planId?: string;
      productId?: string;
      interval?: 'month' | 'year';
      customerId?: string;
      checkoutId?: string;
    } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 });
    }

    const existing = await paymentRepository.findBySubscriptionId(subscriptionId);

    const remoteFetchPromise = creemService
      .getSubscription(subscriptionId)
      .then((result) => result as RemoteSubscriptionResult)
      .catch((error: unknown) => {
        console.warn('[Creem Sync Checkout] Remote subscription fetch failed:', {
          subscriptionId,
          error: error instanceof Error ? error.message : error,
        });
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          failed: true,
        } as RemoteSubscriptionResult;
      });

    const remote = await Promise.race<RemoteSubscriptionResult>([
      remoteFetchPromise,
      new Promise<RemoteSubscriptionResult>((resolve) =>
        setTimeout(
          () =>
            resolve({
              success: false,
              error: 'Request timed out',
              timedOut: true,
            }),
          REMOTE_SUBSCRIPTION_TIMEOUT_MS
        )
      ),
    ]);

    if (remote.timedOut) {
      console.warn(
        `[Creem Sync Checkout] Remote subscription lookup timed out for ${subscriptionId}. Using local payload fallback.`
      );
    }

    const remoteSub = remote.success ? remote.subscription : null;

    // Use productId as primary identifier (matching im2prompt approach where productId maps to plan)
    // Fallback order: productId from request -> remoteSub product_id -> remoteSub priceId -> planId
    const productIdToResolve =
      productId || remoteSub?.product_id || remoteSub?.product?.id || remoteSub?.priceId || planId;

    if (!productIdToResolve) {
      console.warn('[Creem Sync Checkout] Missing product identifier; cannot resolve plan', {
        subscriptionId,
        productId,
        remoteSub: remoteSub
          ? { product_id: remoteSub.product_id, priceId: remoteSub.priceId }
          : null,
      });
      return NextResponse.json({ error: 'Missing product identifier' }, { status: 400 });
    }

    const intervalHint = interval || (remoteSub?.interval === 'year' ? 'year' : 'month');

    // Resolve plan using productId (primary) or planId (fallback)
    // Since we use productId to map subscriptions, prioritize productId resolution
    let resolvedPlan:
      | ReturnType<typeof resolvePlanByProductId>
      | ReturnType<typeof resolvePlanByIdentifier>
      | null = null;

    if (productIdToResolve.startsWith('prod_')) {
      // Product ID: use resolvePlanByProductId
      resolvedPlan = resolvePlanByProductId(productIdToResolve, intervalHint);
    } else {
      // Plan ID or price ID: use resolvePlanByIdentifier
      resolvedPlan = resolvePlanByIdentifier(productIdToResolve, intervalHint);
    }

    if (!resolvedPlan) {
      console.error('[Creem Sync Checkout] Failed to resolve plan from identifier:', {
        productIdToResolve,
        intervalHint,
      });
      return NextResponse.json(
        { error: 'Failed to resolve plan from product identifier' },
        { status: 400 }
      );
    }

    const normalizedPlanId = resolvedPlan.plan.id;
    const normalizedInterval = resolvedPlan.interval;
    const subscriptionStatus = normalizeCreemStatus(remoteSub?.status);

    // Always calculate periodStart and periodEnd from current time and interval
    // This matches im2prompt's approach and ensures periodEnd is always set
    const now = new Date();
    const periodStart = remoteSub?.current_period_start_date
      ? new Date(remoteSub.current_period_start_date)
      : now;

    // Calculate periodEnd from periodStart + interval (matching im2prompt approach)
    const periodEnd = new Date(periodStart);
    const intervalMonths = normalizedInterval === 'year' ? 12 : 1;
    periodEnd.setMonth(periodEnd.getMonth() + intervalMonths);
    const trialStart = remoteSub?.trial_start_date
      ? new Date(remoteSub.trial_start_date)
      : undefined;
    const trialEnd = remoteSub?.trial_end_date ? new Date(remoteSub.trial_end_date) : undefined;
    const status = subscriptionStatus;

    // Use resolved plan ID for credit granting (normalized from productId)
    const creditsPlanId = normalizedPlanId;

    if (!existing) {
      // Create new subscription - always grant full credits (matching im2prompt approach)
      await paymentRepository.create({
        id: subscriptionId,
        provider: 'creem',
        priceId: normalizedPlanId,
        productId: productIdToResolve.startsWith('prod_') ? productIdToResolve : null,
        type: 'subscription',
        interval: normalizedInterval,
        userId: session.user.id,
        customerId: (remoteSub?.customer_id as string | undefined) ?? customerId ?? session.user.id,
        subscriptionId,
        status,
        periodStart,
        periodEnd,
        cancelAtPeriodEnd: remoteSub?.cancel_at_period_end || false,
        trialStart,
        trialEnd,
      });
      await enforceSingleCreemSubscription(session.user.id, subscriptionId);

      // Grant full credits for new subscription
      console.log('[Creem Sync Checkout] New subscription created:', {
        subscriptionId,
        normalizedPlanId,
        creditsPlanId,
        normalizedInterval,
        resolvedPlan: { planId: resolvedPlan.plan.id, interval: resolvedPlan.interval },
        productIdToResolve,
      });

      if (creditsPlanId) {
        console.log('[Creem Sync Checkout] Granting credits for new subscription', {
          userId: session.user.id,
          subscriptionId,
          creditsPlanId,
          interval: normalizedInterval,
        });
        const granted = await grantSubscriptionCredits(
          session.user.id,
          creditsPlanId,
          subscriptionId,
          normalizedInterval || undefined
        );
        console.log('[Creem Sync Checkout] Credit grant result:', {
          granted,
          creditsPlanId,
          subscriptionId,
          userId: session.user.id,
          interval: normalizedInterval,
        });
        if (!granted) {
          console.warn(
            '[Creem Sync Checkout] Credits were NOT granted! This might indicate a duplicate grant was prevented.'
          );
        }
      } else {
        console.warn('[Creem Sync Checkout] Credits not granted:', {
          creditsPlanId,
          reason: 'No creditsPlanId',
        });
      }
    } else {
      // Update existing subscription - adjust credits based on plan/interval changes
      // Use productId as primary identifier (matching our approach)
      const oldProductId = existing.productId || existing.priceId;
      const oldInterval = existing.interval || 'month';
      const newInterval = normalizedInterval;

      // Resolve plan IDs from productId (primary identifier)
      const oldPlanResolved = oldProductId?.startsWith('prod_')
        ? resolvePlanByProductId(oldProductId, oldInterval)
        : resolvePlanByIdentifier(oldProductId || '', oldInterval);
      const newPlanResolved = resolvedPlan; // Already resolved above from productIdToResolve

      const oldPlanId = oldPlanResolved?.plan?.id || oldProductId || 'free';
      const newPlanId = newPlanResolved?.plan?.id || normalizedPlanId || 'free';

      const planChanged = oldPlanId !== newPlanId;
      const intervalChanged = oldInterval !== newInterval;

      // Check if old plan is Free (no valid plan or 'free' plan)
      // Also check if the existing subscription was canceled (indicating user was on Free)
      const isOldPlanFree =
        !oldPlanResolved || oldPlanResolved.plan?.id === 'free' || existing.status === 'canceled';
      const isNewPlanPaid = newPlanResolved && newPlanResolved.plan?.id !== 'free';

      console.log('[Creem Sync Checkout] Plan upgrade check:', {
        isOldPlanFree,
        isNewPlanPaid,
        oldPlanId,
        newPlanId,
        oldPlanResolved: oldPlanResolved ? { planId: oldPlanResolved.plan.id } : null,
        existingStatus: existing.status,
        existingPriceId: existing.priceId,
      });

      // Calculate credit difference to determine if this is upgrade or downgrade
      // Use resolved plan IDs for accurate credit calculation
      // IMPORTANT: Use resolved plan IDs (not productIds) for credit calculation
      const oldCreditInfo = getCreditsForPlan(oldPlanId, oldInterval);
      const newCreditInfo = getCreditsForPlan(newPlanId, newInterval);

      console.log('[Creem Sync Checkout] Credit calculation:', {
        oldPlanId,
        oldInterval,
        oldCredits: oldCreditInfo.amount,
        newPlanId,
        newInterval,
        newCredits: newCreditInfo.amount,
        oldPlanResolved: oldPlanResolved
          ? { planId: oldPlanResolved.plan.id, interval: oldPlanResolved.interval }
          : null,
        newPlanResolved: newPlanResolved
          ? { planId: newPlanResolved.plan.id, interval: newPlanResolved.interval }
          : null,
      });

      const creditDifference = newCreditInfo.amount - oldCreditInfo.amount;
      const isDowngrade = creditDifference < 0;

      // Handle credit adjustments for all scenarios:
      // 1. Free -> Paid: Grant full credits (new subscription)
      // 2. Upgrade (积分增加): Update plan immediately and grant credit difference
      // 3. Downgrade (积分减少): Schedule for period end, keep old plan until then

      if (isOldPlanFree && isNewPlanPaid) {
        // Free -> Paid: Grant full credits (like new subscription)
        // Update plan immediately
        await paymentRepository.update(existing.id, {
          priceId: normalizedPlanId,
          productId: productIdToResolve.startsWith('prod_') ? productIdToResolve : null,
          status,
          interval: normalizedInterval,
          periodStart,
          periodEnd,
          cancelAtPeriodEnd: remoteSub?.cancel_at_period_end || false,
          trialStart,
          trialEnd,
        });

        console.log(
          `[Creem Sync Checkout] Upgrading from Free to ${newPlanId}, granting full credits`,
          {
            oldPlanId,
            newPlanId,
            creditsPlanId,
            normalizedInterval,
          }
        );
        if (creditsPlanId) {
          console.log('[Creem Sync Checkout] Granting credits for Free->Paid upgrade', {
            userId: session.user.id,
            subscriptionId,
            creditsPlanId,
            interval: normalizedInterval,
            oldPlanId,
            newPlanId,
          });
          const granted = await grantSubscriptionCredits(
            session.user.id,
            creditsPlanId,
            subscriptionId,
            normalizedInterval || undefined
          );
          console.log('[Creem Sync Checkout] Credit grant result (Free->Paid):', {
            granted,
            creditsPlanId,
            subscriptionId,
            userId: session.user.id,
            interval: normalizedInterval,
          });
          if (!granted) {
            console.warn(
              '[Creem Sync Checkout] Credits were NOT granted for Free->Paid upgrade! This might indicate a duplicate grant was prevented.'
            );
          }
        } else {
          console.warn('[Creem Sync Checkout] Credits not granted (Free->Paid):', {
            creditsPlanId,
            reason: 'No creditsPlanId',
          });
        }
      } else if (planChanged || intervalChanged) {
        // Plan or interval changed: Adjust credits difference
        console.log('[Creem Sync Checkout] Plan/interval change detected:', {
          planChanged,
          intervalChanged,
          oldPlanId,
          newPlanId,
          oldInterval,
          newInterval,
          creditDifference,
          isDowngrade,
          oldPlanResolved: oldPlanResolved
            ? { planId: oldPlanResolved.plan.id, interval: oldPlanResolved.interval }
            : null,
          newPlanResolved: newPlanResolved
            ? { planId: newPlanResolved.plan.id, interval: newPlanResolved.interval }
            : null,
        });

        if (creditDifference !== 0) {
          console.log(
            `[Creem Sync Checkout] Plan/interval change: ${oldPlanId || 'Free'} ${oldInterval} → ${newPlanId} ${newInterval}, credit difference: ${creditDifference} (${isDowngrade ? 'downgrade' : 'upgrade'})`
          );

          if (isDowngrade) {
            // Downgrade: Schedule for period end, don't deduct credits immediately
            // Don't update priceId/interval yet - keep old plan until period ends
            // Set cancelAtPeriodEnd to true so the downgrade takes effect at period end
            await paymentRepository.update(existing.id, {
              cancelAtPeriodEnd: true,
              status,
              periodStart,
              periodEnd,
              trialStart,
              trialEnd,
              // Keep old priceId and interval until period ends
              // They will be updated when period ends (in webhook renewal detection)
            });

            console.log(
              `[Creem Sync Checkout] Downgrade scheduled for period end: ${periodEnd.toISOString()}. Plan will change from ${oldPlanId} ${oldInterval} to ${newPlanId} ${newInterval} at that time. Credits will be adjusted then.`
            );
          } else {
            // Upgrade: Update plan immediately and apply credit difference
            await paymentRepository.update(existing.id, {
              priceId: normalizedPlanId,
              productId: productIdToResolve.startsWith('prod_') ? productIdToResolve : null,
              status,
              interval: normalizedInterval,
              periodStart,
              periodEnd,
              cancelAtPeriodEnd: remoteSub?.cancel_at_period_end || false,
              trialStart,
              trialEnd,
            });

            // Apply credit difference immediately
            const { db } = await import('@/server/db');
            const { creditTransactions, userCredits } = await import('@/server/db/schema');
            const { eq } = await import('drizzle-orm');
            const { randomUUID } = await import('node:crypto');

            const referenceId = `creem_${subscriptionId}_plan_change_${Date.now()}`;
            const userId = session.user.id;

            try {
              await db.transaction(async (tx) => {
                const [userCredit] = await tx
                  .select()
                  .from(userCredits)
                  .where(eq(userCredits.userId, userId))
                  .limit(1);

                if (!userCredit) {
                  console.error(`[Creem Sync Checkout] User credit record not found for ${userId}`);
                  throw new Error(`User credit record not found for ${userId}`);
                }

                const newBalance = userCredit.balance + creditDifference;
                const transactionType = 'earn';

                console.log('[Creem Sync Checkout] Applying credit upgrade:', {
                  userId,
                  currentBalance: userCredit.balance,
                  creditDifference,
                  newBalance,
                  oldPlanId: oldCreditInfo.planId,
                  newPlanId: newCreditInfo.planId,
                });

                await tx
                  .update(userCredits)
                  .set({
                    balance: newBalance,
                    totalEarned: userCredit.totalEarned + creditDifference,
                    updatedAt: new Date(),
                  })
                  .where(eq(userCredits.userId, userId));

                await tx.insert(creditTransactions).values({
                  id: randomUUID(),
                  userId,
                  type: transactionType,
                  amount: creditDifference,
                  balanceAfter: newBalance,
                  source: 'subscription',
                  description: `Plan upgrade: ${oldCreditInfo.planId} ${oldInterval} → ${newCreditInfo.planId} ${newInterval}`,
                  referenceId,
                  metadata: JSON.stringify({
                    oldPlanId: oldCreditInfo.planId,
                    newPlanId: newCreditInfo.planId,
                    oldInterval,
                    newInterval,
                    subscriptionId,
                    provider: 'creem',
                    creditDifference,
                  }),
                });
              });

              console.log(
                `[Creem Sync Checkout] ✅ Successfully upgraded credits by ${creditDifference} for user ${userId} (immediate)`
              );
            } catch (error) {
              console.error('[Creem Sync Checkout] ❌ Failed to upgrade credits:', error);
              throw error; // Re-throw to ensure the error is visible
            }
          }
        } else {
          // No credit difference, but plan/interval changed - update plan info
          console.warn('[Creem Sync Checkout] ⚠️ Plan/interval changed but creditDifference is 0:', {
            oldPlanId,
            newPlanId,
            oldInterval,
            newInterval,
            oldCredits: oldCreditInfo.amount,
            newCredits: newCreditInfo.amount,
            oldCreditInfo,
            newCreditInfo,
          });

          await paymentRepository.update(existing.id, {
            priceId: normalizedPlanId,
            productId: productIdToResolve.startsWith('prod_') ? productIdToResolve : null,
            status,
            interval: normalizedInterval,
            periodStart,
            periodEnd,
            cancelAtPeriodEnd: remoteSub?.cancel_at_period_end || false,
            trialStart,
            trialEnd,
          });
          console.log('[Creem Sync Checkout] Plan/interval updated (no credit adjustment needed)');
        }
      } else {
        // No plan or interval change - just update other fields
        await paymentRepository.update(existing.id, {
          status,
          periodStart,
          periodEnd,
          cancelAtPeriodEnd: remoteSub?.cancel_at_period_end || false,
          trialStart,
          trialEnd,
        });
      }
    }

    if (checkoutId) {
      try {
        await paymentRepository.createEvent({
          paymentId: subscriptionId,
          eventType: 'checkout_synced',
          creemEventId: checkoutId,
          eventData: JSON.stringify({
            subscriptionId,
            planId: normalizedPlanId,
            interval: normalizedInterval,
            syncedAt: new Date().toISOString(),
          }),
        });
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === '23505') {
          console.warn('[Creem Sync Checkout] Event already recorded for checkout', { checkoutId });
        } else {
          throw error;
        }
      }
    }

    return NextResponse.json({
      success: true,
      subscriptionId,
    });
  } catch (error) {
    console.error('[Creem Sync Checkout] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to sync subscription',
      },
      { status: 500 }
    );
  }
}
