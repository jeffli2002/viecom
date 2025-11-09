import { auth } from '@/lib/auth/auth';
import { creemService } from '@/lib/creem/creem-service';
import { isCreemConfigured } from '@/payment/creem/client';
import { paymentRepository } from '@/server/db/repositories/payment-repository';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const downgradeSchema = z.object({
  newPlanId: z.enum(['pro', 'free']),
  newInterval: z.enum(['month', 'year']),
  scheduleAtPeriodEnd: z.boolean().optional().default(true),
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

    const body = await request.json();
    const validation = downgradeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { newPlanId, newInterval, scheduleAtPeriodEnd } = validation.data;

    if (newPlanId === 'free') {
      // Cancel subscription if downgrading to free
      const creemProvider = new CreemProvider();
      const success = await creemProvider.cancelSubscription(subscriptionId);

      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Failed to cancel subscription' },
          { status: 500 }
        );
      }

      await paymentRepository.update(subscriptionId, {
        status: 'canceled',
        cancelAtPeriodEnd: false,
      });

      return NextResponse.json({
        success: true,
        message: 'Subscription canceled successfully',
      });
    }

    // Downgrade to different paid plan
    const newProductKey = `${newPlanId}_${newInterval === 'year' ? 'yearly' : 'monthly'}` as
      | 'pro_monthly'
      | 'pro_yearly';

    const result = await creemService.downgradeSubscription(
      subscriptionId,
      newProductKey,
      scheduleAtPeriodEnd
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to downgrade subscription' },
        { status: 500 }
      );
    }

    await paymentRepository.update(paymentRecord.id, {
      priceId: newPlanId,
      interval: newInterval,
      cancelAtPeriodEnd: scheduleAtPeriodEnd,
    });

    await paymentRepository.createEvent({
      paymentId: paymentRecord.id,
      eventType: 'downgraded',
      eventData: JSON.stringify({
        subscriptionId,
        oldPlan: paymentRecord.priceId,
        newPlan: newPlanId,
        scheduleAtPeriodEnd,
        downgradedAt: new Date().toISOString(),
      }),
    });

    return NextResponse.json({
      success: true,
      message: scheduleAtPeriodEnd
        ? 'Subscription will be downgraded at the end of current period'
        : 'Subscription downgraded immediately',
      subscription: result.subscription,
    });
  } catch (error) {
    console.error('[Creem Subscription Downgrade] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to downgrade subscription',
      },
      { status: 500 }
    );
  }
}


