import { auth } from '@/lib/auth/auth';
import { creemService } from '@/lib/creem/creem-service';
import { resolvePlanByIdentifier } from '@/lib/creem/plan-utils';
import { isCreemConfigured } from '@/payment/creem/client';
import { paymentRepository } from '@/server/db/repositories/payment-repository';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const checkoutSchema = z.object({
  planId: z.enum(['pro', 'proplus']).optional(),
  priceId: z.string().min(1).optional(),
  interval: z.enum(['month', 'year']).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

const DEFAULT_SUCCESS_URL = `${process.env.NEXT_PUBLIC_APP_URL || ''}/settings/billing?success=true`;
const DEFAULT_CANCEL_URL = `${process.env.NEXT_PUBLIC_APP_URL || ''}/settings/billing?canceled=true`;

export async function POST(request: Request) {
  try {
    if (!isCreemConfigured) {
      return NextResponse.json({ error: 'Creem is not configured' }, { status: 503 });
    }

    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: Object.fromEntries(headersList.entries()),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.id === 'dev-user') {
      return NextResponse.json(
        { error: 'Test users cannot create Creem checkouts' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validation = checkoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    let { planId, priceId, interval, successUrl, cancelUrl } = validation.data;

    if (!planId && !priceId) {
      return NextResponse.json(
        { error: 'Either planId or priceId must be provided' },
        { status: 400 }
      );
    }

    if (!planId && priceId) {
      const resolved = resolvePlanByIdentifier(priceId, interval || undefined);
      if (!resolved?.plan) {
        return NextResponse.json({ error: 'Unable to resolve plan from priceId' }, { status: 400 });
      }
      planId = resolved.plan.id as 'pro' | 'proplus';
      interval = interval || resolved.interval;
    }

    if (!planId) {
      return NextResponse.json({ error: 'Invalid plan selection' }, { status: 400 });
    }

    const billingInterval: 'month' | 'year' = interval || 'month';
    const successRedirect = successUrl || DEFAULT_SUCCESS_URL;
    const cancelRedirect = cancelUrl || DEFAULT_CANCEL_URL;

    const activeSubscription = await paymentRepository.findActiveSubscriptionByUserId(
      session.user.id
    );

    if (activeSubscription) {
      const currentPlanInfo = resolvePlanByIdentifier(
        activeSubscription.priceId,
        activeSubscription.interval === 'year' ? 'year' : 'month'
      );
      const currentPlan =
        (currentPlanInfo?.plan?.id as 'pro' | 'proplus' | undefined) ??
        (activeSubscription.priceId.includes('proplus') ? 'proplus' : 'pro');
      const currentInterval =
        currentPlanInfo?.interval ?? (activeSubscription.interval === 'year' ? 'year' : 'month');

      if (currentPlan === planId && currentInterval === billingInterval) {
        return NextResponse.json(
          {
            error: `You already have an active ${planId.toUpperCase()} ${billingInterval === 'year' ? 'yearly' : 'monthly'} subscription`,
            code: 'DUPLICATE_SUBSCRIPTION',
          },
          { status: 400 }
        );
      }

      if (!activeSubscription.cancelAtPeriodEnd && activeSubscription.subscriptionId) {
        try {
          const cancelResult = await creemService.cancelSubscription(
            activeSubscription.subscriptionId
          );

          if (cancelResult.success) {
            await paymentRepository.update(activeSubscription.id, {
              cancelAtPeriodEnd: true,
            });

            await paymentRepository.createEvent({
              paymentId: activeSubscription.id,
              eventType: 'canceled',
              eventData: JSON.stringify({
                subscriptionId: activeSubscription.subscriptionId,
                canceledAt: new Date().toISOString(),
                cancelAtPeriodEnd: true,
                reason: 'plan_change',
                newPlan: planId,
                newInterval: billingInterval,
              }),
            });
          } else {
            console.warn(
              `[Creem Checkout] Failed to auto-cancel existing subscription: ${cancelResult.error}`
            );
          }
        } catch (error) {
          console.error('[Creem Checkout] Error canceling existing subscription:', error);
        }
      }
    }

    const currentPlanForMetadata: 'free' | 'pro' | 'proplus' = activeSubscription
      ? ((resolvePlanByIdentifier(
          activeSubscription.priceId,
          activeSubscription.interval === 'year' ? 'year' : 'month'
        )?.plan?.id as 'pro' | 'proplus' | undefined) ??
        (activeSubscription.priceId.includes('proplus') ? 'proplus' : 'pro'))
      : 'free';

    const checkoutResult = await creemService.createCheckoutSession({
      userId: session.user.id,
      userEmail: session.user.email,
      planId,
      interval: billingInterval,
      successUrl: successRedirect,
      cancelUrl: cancelRedirect,
      currentPlan: currentPlanForMetadata,
    });

    if (!checkoutResult.success || !checkoutResult.url) {
      return NextResponse.json(
        { error: checkoutResult.error || 'Failed to create checkout session' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: checkoutResult.sessionId,
      url: checkoutResult.url,
    });
  } catch (error) {
    console.error('[Creem Checkout] Error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
