import { auth } from '@/lib/auth/auth';
import { creemService } from '@/lib/creem/creem-service';
import { isCreemConfigured } from '@/payment/creem/client';
import { paymentRepository } from '@/server/db/repositories/payment-repository';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const upgradeSchema = z.object({
  newPlanId: z.enum(['pro', 'proplus']),
  newInterval: z.enum(['month', 'year']),
  useProration: z.boolean().optional().default(false),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
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

    const { subscriptionId } = await params;
    const paymentRecord = await paymentRepository.findBySubscriptionId(subscriptionId);

    if (!paymentRecord || paymentRecord.userId !== session.user.id) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (paymentRecord.status !== 'active' && paymentRecord.status !== 'trialing') {
      return NextResponse.json(
        { error: 'Only active subscriptions can be upgraded' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = upgradeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error },
        { status: 400 }
      );
    }

    const { newPlanId, newInterval, useProration } = validation.data;

    const currentPlan = paymentRecord.priceId;
    const currentInterval = paymentRecord.interval;

    if (currentPlan === newPlanId && currentInterval === newInterval) {
      return NextResponse.json({ error: 'You are already on this plan' }, { status: 400 });
    }

    const newProductKey = `${newPlanId}_${newInterval === 'year' ? 'yearly' : 'monthly'}` as
      | 'pro_monthly'
      | 'pro_yearly'
      | 'proplus_monthly'
      | 'proplus_yearly';

    const result = await creemService.upgradeSubscription(
      subscriptionId,
      newProductKey,
      useProration
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to upgrade subscription' },
        { status: 500 }
      );
    }

    await paymentRepository.update(paymentRecord.id, {
      priceId: newPlanId,
      interval: newInterval,
    });

    await paymentRepository.createEvent({
      paymentId: paymentRecord.id,
      eventType: 'upgraded',
      eventData: JSON.stringify({
        subscriptionId,
        oldPlan: currentPlan,
        oldInterval: currentInterval,
        newPlan: newPlanId,
        newInterval: newInterval,
        useProration,
        upgradedAt: new Date().toISOString(),
      }),
    });

    const message = useProration
      ? 'Subscription upgraded immediately with prorated charge'
      : 'Subscription will be upgraded at the end of current period';

    return NextResponse.json({
      success: true,
      message,
      subscription: result.subscription,
    });
  } catch (error) {
    console.error('[Creem Subscription Upgrade] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


