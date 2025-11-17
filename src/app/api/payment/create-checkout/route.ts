import { getSessionFromRequest } from '@/lib/auth/auth-utils';
import { creemService } from '@/lib/creem/creem-service';
import { paymentRepository } from '@/server/db/repositories/payment-repository';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request.headers);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.id === 'dev-user') {
      return NextResponse.json(
        { error: 'Test user is not allowed to create subscriptions' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    console.log('[Create Checkout] Request body', body);
    const {
      planId,
      interval = 'month',
      successUrl,
      cancelUrl,
    } = body as {
      planId?: 'pro' | 'proplus';
      interval?: 'month' | 'year';
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!planId) {
      return NextResponse.json({ error: 'Missing planId' }, { status: 400 });
    }

    if (!successUrl || !cancelUrl) {
      return NextResponse.json({ error: 'Missing success/cancel URLs' }, { status: 400 });
    }

    const activeSubscription = await paymentRepository.findActiveSubscriptionByUserId(
      session.user.id
    );
    console.log('[Create Checkout] Active subscription', {
      userId: session.user.id,
      subscriptionId: activeSubscription?.subscriptionId,
      priceId: activeSubscription?.priceId,
      interval: activeSubscription?.interval,
      status: activeSubscription?.status,
      cancelAtPeriodEnd: activeSubscription?.cancelAtPeriodEnd,
    });

    if (activeSubscription) {
      const currentPlan: 'pro' | 'proplus' = activeSubscription.priceId.includes('proplus')
        ? 'proplus'
        : 'pro';
      const currentInterval = activeSubscription.interval === 'year' ? 'year' : 'month';

      if (currentPlan === planId && currentInterval === interval) {
        console.warn('[Create Checkout] duplicate plan request', {
          userId: session.user.id,
          planId,
          interval,
        });
        return NextResponse.json(
          {
            error: `You already have an active ${planId.toUpperCase()} ${interval === 'year' ? 'yearly' : 'monthly'} subscription`,
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
                newInterval: interval,
              }),
            });
          } else {
            console.warn('[Create Checkout] Failed to auto-cancel Creem subscription');
          }
        } catch (error) {
          console.error('[Create Checkout] Error canceling existing subscription', error);
        }
      }
    }

    const currentPlanForCheckout: 'free' | 'pro' | 'proplus' = activeSubscription
      ? activeSubscription.priceId.includes('proplus')
        ? 'proplus'
        : 'pro'
      : 'free';

    const checkout = await creemService.createCheckoutSession({
      userId: session.user.id,
      userEmail: session.user.email,
      planId,
      interval,
      successUrl,
      cancelUrl,
      currentPlan: currentPlanForCheckout,
    });

    if (!checkout.success || !checkout.url) {
      console.error('[Create Checkout] Creem service returned error', checkout);
      return NextResponse.json(
        { error: checkout.error || 'Failed to create checkout session' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: checkout.sessionId,
      url: checkout.url,
    });
  } catch (error) {
    console.error('[Create Checkout] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
