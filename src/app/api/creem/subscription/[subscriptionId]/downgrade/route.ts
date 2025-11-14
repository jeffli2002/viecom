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
      if (scheduleAtPeriodEnd) {
        await paymentRepository.update(paymentRecord.id, {
          cancelAtPeriodEnd: true,
        });

        await paymentRepository.createEvent({
          paymentId: paymentRecord.id,
          eventType: 'updated',
          eventData: JSON.stringify({
            subscriptionId,
            action: 'downgrade_to_free_scheduled',
            scheduleAtPeriodEnd: true,
            periodEnd: paymentRecord.periodEnd?.toISOString(),
          }),
        });

        return NextResponse.json({
          success: true,
          message: 'Your subscription will be canceled at the end of the current billing period',
          data: {
            downgraded: true,
            scheduledAtPeriodEnd: true,
          },
        });
      }

      if (!paymentRecord.subscriptionId) {
        return NextResponse.json(
          { success: false, error: 'Subscription is missing billing reference' },
          { status: 400 }
        );
      }

      const cancelResult = await creemService.cancelSubscription(paymentRecord.subscriptionId);

      if (!cancelResult.success) {
        return NextResponse.json(
          { success: false, error: cancelResult.error || 'Failed to cancel subscription' },
          { status: 500 }
        );
      }

      await paymentRepository.update(paymentRecord.id, {
        status: 'canceled',
        cancelAtPeriodEnd: false,
      });

      await paymentRepository.createEvent({
        paymentId: paymentRecord.id,
        eventType: 'canceled',
        eventData: JSON.stringify({
          subscriptionId,
          action: 'downgrade_to_free_immediate',
          canceledAt: new Date().toISOString(),
        }),
      });

      return NextResponse.json({
        success: true,
        message: 'Your subscription has been canceled',
        data: {
          downgraded: true,
          scheduledAtPeriodEnd: false,
        },
      });
    }

    if (!paymentRecord.subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'Subscription is missing billing reference' },
        { status: 400 }
      );
    }

    const newProductKey = `${newPlanId}_${newInterval === 'year' ? 'yearly' : 'monthly'}` as
      | 'pro_monthly'
      | 'pro_yearly';

    const result = await creemService.downgradeSubscription(
      paymentRecord.subscriptionId,
      newProductKey,
      scheduleAtPeriodEnd
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to downgrade subscription' },
        { status: 500 }
      );
    }

    if (scheduleAtPeriodEnd && result.scheduledAtPeriodEnd) {
      await paymentRepository.update(paymentRecord.id, {
        priceId: newPlanId,
        interval: newInterval,
      });

      await paymentRepository.createEvent({
        paymentId: paymentRecord.id,
        eventType: 'updated',
        eventData: JSON.stringify({
          subscriptionId,
          oldPlan: paymentRecord.priceId,
          oldInterval: paymentRecord.interval,
          newPlan: newPlanId,
          newInterval,
          scheduledAtPeriodEnd: true,
          periodEnd: paymentRecord.periodEnd?.toISOString(),
        }),
      });

      return NextResponse.json({
        success: true,
        message: `Your subscription will be downgraded to ${newPlanId.toUpperCase()} ${newInterval === 'year' ? 'yearly' : 'monthly'} at the end of the current period`,
        data: {
          downgraded: true,
          scheduledAtPeriodEnd: true,
        },
      });
    }

    await paymentRepository.update(paymentRecord.id, {
      status: 'canceled',
    });

    await paymentRepository.createEvent({
      paymentId: paymentRecord.id,
      eventType: 'canceled',
      eventData: JSON.stringify({
        subscriptionId,
        action: 'downgrade_immediate',
        oldPlan: paymentRecord.priceId,
        newPlan: newPlanId,
        newInterval,
      }),
    });

    return NextResponse.json({
      success: true,
      message: 'Your subscription has been downgraded. Please complete checkout for the new plan.',
      data: {
        downgraded: true,
        scheduledAtPeriodEnd: false,
      },
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
