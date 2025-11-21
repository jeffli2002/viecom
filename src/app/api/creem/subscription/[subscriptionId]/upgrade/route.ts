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

    // Validate subscriptionId
    if (!subscriptionId || typeof subscriptionId !== 'string') {
      console.error('[Creem Subscription Upgrade] Invalid subscriptionId:', subscriptionId);
      return NextResponse.json({ error: 'Invalid subscription ID' }, { status: 400 });
    }

    console.log('[Creem Subscription Upgrade] Processing upgrade request:', {
      subscriptionId,
      userId: session.user.id,
      userEmail: session.user.email,
    });

    const paymentRecord = await paymentRepository.findBySubscriptionId(subscriptionId);

    if (!paymentRecord) {
      console.error('[Creem Subscription Upgrade] Subscription not found:', {
        subscriptionId,
        userId: session.user.id,
        userEmail: session.user.email,
      });
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    console.log('[Creem Subscription Upgrade] Found payment record:', {
      subscriptionId,
      paymentUserId: paymentRecord.userId,
      paymentCustomerId: paymentRecord.customerId,
      paymentStatus: paymentRecord.status,
      paymentPriceId: paymentRecord.priceId,
      sessionUserId: session.user.id,
      sessionUserEmail: session.user.email,
    });

    if (paymentRecord.userId !== session.user.id) {
      console.error('[Creem Subscription Upgrade] User mismatch:', {
        subscriptionId,
        paymentUserId: paymentRecord.userId,
        paymentUserIdType: typeof paymentRecord.userId,
        sessionUserId: session.user.id,
        sessionUserIdType: typeof session.user.id,
        userEmail: session.user.email,
      });
      return NextResponse.json(
        {
          error:
            'Forbidden: you do not have permission to upgrade this subscription. Please check your subscription status and contact support',
        },
        { status: 403 }
      );
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

    const { newPlanId, newInterval } = validation.data;

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

    // 所有付费用户升级都需要等到下个订阅周期开始时生效
    // 强制使用延迟生效（proration-none），不立即生效
    const forceScheduledAtPeriodEnd = true;
    const result = await creemService.upgradeSubscription(
      subscriptionId,
      newProductKey,
      false // 强制不使用 proration，延迟生效
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to upgrade subscription' },
        { status: 500 }
      );
    }

    const _scheduledAtPeriodEnd = forceScheduledAtPeriodEnd;
    const estimatedEffectiveDate = paymentRecord.periodEnd
      ? new Date(paymentRecord.periodEnd)
      : (() => {
          const base = paymentRecord.periodStart ? new Date(paymentRecord.periodStart) : new Date();
          const monthsToAdd = (paymentRecord.interval === 'year' ? 12 : 1) || 1;
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

    // 所有付费用户升级都需要等到下个订阅周期开始时生效
    // 方案2: 单条记录+字段 - 升级延迟生效，设置 scheduled 字段
    await paymentRepository.update(paymentRecord.id, {
      scheduledPlanId: newPlanId,
      scheduledInterval: newInterval,
      scheduledPeriodStart: estimatedEffectiveDate,
      scheduledPeriodEnd: nextPeriodEnd,
      scheduledAt: new Date(),
      cancelAtPeriodEnd: false,
    });
    console.log('[Creem Subscription Upgrade] Scheduled upgrade set:', {
      subscriptionId,
      currentPlan: currentPlan,
      scheduledPlan: newPlanId,
      scheduledInterval: newInterval,
      takesEffectAt: estimatedEffectiveDate,
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
        useProration: false, // 强制延迟生效
        upgradedAt: new Date().toISOString(),
        action: 'upgrade_scheduled',
        scheduledAtPeriodEnd: true,
        takesEffectAt: estimatedEffectiveDate.toISOString(),
      }),
    });

    const message = 'Subscription will be upgraded at the end of current period';

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
