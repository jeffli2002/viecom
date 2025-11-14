import { auth } from '@/lib/auth/auth';
import { resolvePlanByIdentifier } from '@/lib/creem/plan-utils';
import { isCreemConfigured } from '@/payment/creem/client';
import { paymentRepository } from '@/server/db/repositories/payment-repository';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
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

    const activeSubscription = await paymentRepository.findActiveSubscriptionByUserId(
      session.user.id
    );

    if (!activeSubscription || activeSubscription.provider !== 'creem') {
      return NextResponse.json({ subscription: null });
    }

    const resolvedPlan = resolvePlanByIdentifier(
      activeSubscription.priceId,
      activeSubscription.interval === 'year' ? 'year' : 'month'
    );

    return NextResponse.json({
      subscription: {
        id: activeSubscription.id,
        subscriptionId: activeSubscription.subscriptionId,
        status: activeSubscription.status,
        planId: resolvedPlan?.plan?.id ?? null,
        planName: resolvedPlan?.plan?.name ?? activeSubscription.priceId,
        priceId: activeSubscription.priceId,
        interval: activeSubscription.interval,
        periodStart: activeSubscription.periodStart,
        periodEnd: activeSubscription.periodEnd,
        cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
        provider: activeSubscription.provider,
      },
    });
  } catch (error) {
    console.error('[Creem Subscription] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}
