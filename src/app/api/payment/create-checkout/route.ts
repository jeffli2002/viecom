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
      productKey,
      successUrl,
      cancelUrl,
    } = body as {
      planId?: 'pro' | 'proplus';
      interval?: 'month' | 'year';
      productKey?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!planId && !productKey) {
      return NextResponse.json({ error: 'Missing planId or productKey' }, { status: 400 });
    }

    if (!successUrl || !cancelUrl) {
      return NextResponse.json({ error: 'Missing success/cancel URLs' }, { status: 400 });
    }

    const affiliateCookie = request.cookies.get('aff_ref')?.value?.trim();
    const affiliateCode =
      affiliateCookie && /^[A-Za-z0-9_-]{4,32}$/.test(affiliateCookie)
        ? affiliateCookie
        : undefined;

    // If productKey is provided (credit pack purchase), skip subscription checks
    if (productKey) {
      console.log('[Create Checkout] Credit pack purchase with productKey:', productKey);

      const checkout = await creemService.createCheckoutSessionWithProductKey({
        userId: session.user.id,
        userEmail: session.user.email,
        productKey,
        successUrl,
        cancelUrl,
        affiliateCode,
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
    }

    // For subscriptions, check for active subscription first
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

      console.warn('[Create Checkout] Active subscription detected, blocking duplicate checkout', {
        userId: session.user.id,
        subscriptionId: activeSubscription.subscriptionId,
        currentPlan,
        currentInterval,
      });

      return NextResponse.json(
        {
          error:
            'You already have an active subscription. Please use the billing page to switch plans instead of creating a new checkout.',
          code: 'ACTIVE_SUBSCRIPTION_EXISTS',
        },
        { status: 400 }
      );
    }

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    const currentPlanForCheckout: 'free' | 'pro' | 'proplus' = 'free';

    const checkout = await creemService.createCheckoutSession({
      userId: session.user.id,
      userEmail: session.user.email,
      planId,
      interval,
      successUrl,
      cancelUrl,
      currentPlan: currentPlanForCheckout,
      affiliateCode,
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
