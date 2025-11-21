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

    const { newPlanId, newInterval } = validation.data;

    // 所有付费用户降级都需要等到下个订阅周期开始时生效
    // 强制使用延迟生效
    const forceScheduleAtPeriodEnd = true;

    if (newPlanId === 'free') {
      if (forceScheduleAtPeriodEnd) {
        // Call Creem API to cancel subscription
        console.log('[Creem Subscription Downgrade] Cancelling subscription:', subscriptionId);

        const creemResult = await creemService.cancelSubscription(subscriptionId);

        if (!creemResult.success) {
          console.error(
            '[Creem Subscription Downgrade] Failed to cancel subscription:',
            creemResult.error
          );
          return NextResponse.json(
            {
              success: false,
              error:
                creemResult.error ||
                'Failed to cancel subscription with Creem. Please try again or contact support.',
            },
            { status: 500 }
          );
        }

        console.log('[Creem Subscription Downgrade] Successfully cancelled subscription');

        // Update database: set cancelAtPeriodEnd and clear any scheduled upgrade fields
        await paymentRepository.update(paymentRecord.id, {
          cancelAtPeriodEnd: true,
          // Clear scheduled upgrade fields (if Pro+ was scheduled)
          scheduledPlanId: null,
          scheduledInterval: null,
          scheduledPeriodStart: null,
          scheduledPeriodEnd: null,
          scheduledAt: null,
        });

        console.log('[Creem Subscription Downgrade] Database updated - cleared scheduled fields');

        await paymentRepository.createEvent({
          paymentId: paymentRecord.id,
          eventType: 'updated',
          eventData: JSON.stringify({
            subscriptionId,
            action: 'downgrade_to_free_scheduled',
            scheduleAtPeriodEnd: true,
            periodEnd: paymentRecord.periodEnd?.toISOString(),
            takesEffectAt: paymentRecord.periodEnd?.toISOString(),
            clearedScheduledUpgrade: !!paymentRecord.scheduledPlanId,
            previousScheduledPlan: paymentRecord.scheduledPlanId,
          }),
        });

        return NextResponse.json({
          success: true,
          message: `Your subscription will be canceled at the end of the current billing period (${paymentRecord.periodEnd?.toLocaleDateString()}). You will be downgraded to the Free plan and will not be charged again.`,
          data: {
            downgraded: true,
            scheduledAtPeriodEnd: true,
            periodEnd: paymentRecord.periodEnd?.toISOString(),
          },
        });
      }

      // 所有降级都需要延迟生效，不允许立即取消
      return NextResponse.json(
        { success: false, error: 'Downgrade to Free must be scheduled at period end' },
        { status: 400 }
      );
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

    // 所有付费用户降级都需要等到下个订阅周期开始时生效
    // 强制使用延迟生效
    const result = await creemService.downgradeSubscription(
      paymentRecord.subscriptionId,
      newProductKey,
      true // 强制延迟生效
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to downgrade subscription' },
        { status: 500 }
      );
    }

    // 计算降级生效日期（当前周期结束时间）
    const estimatedEffectiveDate = paymentRecord.periodEnd
      ? new Date(paymentRecord.periodEnd)
      : (() => {
          const base = paymentRecord.periodStart ? new Date(paymentRecord.periodStart) : new Date();
          const monthsToAdd = (paymentRecord.interval === 'year' ? 12 : 1) || 1;
          base.setMonth(base.getMonth() + monthsToAdd);
          return base;
        })();

    // 计算下个周期结束时间
    const nextPeriodEnd = (() => {
      const base = new Date(estimatedEffectiveDate);
      const monthsToAdd = newInterval === 'year' ? 12 : 1;
      base.setMonth(base.getMonth() + monthsToAdd);
      return base;
    })();

    // 方案2: 设置 scheduled 字段，保持当前 priceId 不变
    await paymentRepository.update(paymentRecord.id, {
      scheduledPlanId: newPlanId,
      scheduledInterval: newInterval,
      scheduledPeriodStart: estimatedEffectiveDate,
      scheduledPeriodEnd: nextPeriodEnd,
      scheduledAt: new Date(),
      cancelAtPeriodEnd: false, // 降级不是取消，只是计划变更
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
        takesEffectAt: estimatedEffectiveDate.toISOString(),
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
