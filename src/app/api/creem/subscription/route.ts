import { auth } from '@/lib/auth/auth';
import { resolvePlanByIdentifier, resolvePlanByProductId } from '@/lib/creem/plan-utils';
import { isCreemConfigured } from '@/payment/creem/client';
import { paymentRepository } from '@/server/db/repositories/payment-repository';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: Object.fromEntries(headersList.entries()),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Debug: Check all subscriptions for this user
    const allSubscriptions = await paymentRepository.findByUserId(session.user.id);
    console.log('[Subscription API] All subscriptions for user:', {
      userId: session.user.id,
      email: session.user.email,
      count: allSubscriptions.length,
      subscriptions: allSubscriptions.map((s) => ({
        id: s.id,
        priceId: s.priceId,
        productId: s.productId,
        status: s.status,
        type: s.type,
        interval: s.interval,
        cancelAtPeriodEnd: s.cancelAtPeriodEnd,
        provider: s.provider,
      })),
    });

    // Find active Creem subscription
    let activeSubscription = await paymentRepository.findActiveSubscriptionByUserId(
      session.user.id
    );

    // Only return Creem subscriptions for this API endpoint
    if (activeSubscription && activeSubscription.provider !== 'creem') {
      console.warn('[Subscription API] Active subscription found but provider is not Creem:', {
        provider: activeSubscription.provider,
        subscriptionId: activeSubscription.id,
      });
      activeSubscription = null;
    }

    // If no active Creem subscription, check for any Creem subscription (even canceled)
    // This helps with debugging and allows viewing canceled subscriptions
    if (!activeSubscription) {
      const creemSubscriptions = allSubscriptions.filter(
        (s) => s.provider === 'creem' && s.type === 'subscription'
      );
      if (creemSubscriptions.length > 0) {
        console.warn(
          '[Subscription API] No active Creem subscription found. Found',
          creemSubscriptions.length,
          'Creem subscription(s) (may be canceled)'
        );
        // Don't fallback to canceled subscriptions - return null instead
      }
    }

    // Return null if no active Creem subscription
    if (!activeSubscription) {
      console.log('[Subscription API] No active Creem subscription found for user');
      return NextResponse.json({ subscription: null });
    }

    console.log('[Subscription API] Found active subscription:', {
      id: activeSubscription.id,
      priceId: activeSubscription.priceId,
      productId: activeSubscription.productId,
      status: activeSubscription.status,
      interval: activeSubscription.interval,
      cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
      provider: activeSubscription.provider,
    });

    const intervalHint = activeSubscription.interval === 'year' ? 'year' : 'month';
    // 有些历史记录把 Creem 的 prod_... 存进了 priceId，这里做兼容
    const candidateProductId =
      activeSubscription.productId ||
      (activeSubscription.priceId?.startsWith('prod_') ? activeSubscription.priceId : undefined);

    // Debug logging to diagnose mapping issues
    console.log('[Subscription API] Debug:', {
      priceId: activeSubscription.priceId,
      productId: activeSubscription.productId,
      candidateProductId,
      interval: intervalHint,
      status: activeSubscription.status,
    });

    const resolvedPlanByIdentifier = resolvePlanByIdentifier(
      activeSubscription.priceId,
      intervalHint
    );
    const resolvedPlanByProduct = resolvePlanByProductId(candidateProductId, intervalHint);
    const resolvedPlan = resolvedPlanByIdentifier || resolvedPlanByProduct;

    console.log('[Subscription API] Plan resolution:', {
      priceId: activeSubscription.priceId,
      productId: activeSubscription.productId,
      candidateProductId,
      intervalHint,
      resolvedByIdentifier: resolvedPlanByIdentifier
        ? { planId: resolvedPlanByIdentifier.plan.id, name: resolvedPlanByIdentifier.plan.name }
        : null,
      resolvedByProduct: resolvedPlanByProduct
        ? { planId: resolvedPlanByProduct.plan.id, name: resolvedPlanByProduct.plan.name }
        : null,
      finalResolved: resolvedPlan
        ? { planId: resolvedPlan.plan.id, name: resolvedPlan.plan.name }
        : null,
    });

    // Infer planId as a final fallback from identifiers to avoid returning undefined
    const inferPlanIdFromStrings = (): 'pro' | 'proplus' | undefined => {
      const haystack =
        `${activeSubscription.priceId || ''}|${activeSubscription.productId || ''}`.toLowerCase();
      if (haystack.includes('proplus')) return 'proplus';
      if (haystack.includes('pro')) return 'pro';
      return undefined;
    };

    let normalizedPlanId: 'pro' | 'proplus' | undefined =
      (resolvedPlan?.plan?.id as 'pro' | 'proplus' | undefined) ?? inferPlanIdFromStrings();
    let normalizedPlanName: string | undefined =
      resolvedPlan?.plan?.name ?? resolvedPlan?.plan?.id ?? undefined;

    // 强兜底：若为活跃/试用订阅但未解析到 planId，则推断或默认为 'pro'
    const isActiveOrTrial =
      activeSubscription.status === 'active' || activeSubscription.status === 'trialing';
    if (!normalizedPlanId && isActiveOrTrial) {
      const nameHaystack =
        `${activeSubscription.priceId || ''}|${activeSubscription.productId || ''}|${normalizedPlanName || ''}`.toLowerCase();
      if (nameHaystack.includes('proplus')) {
        normalizedPlanId = 'proplus';
        normalizedPlanName = 'Pro Plus';
      } else {
        normalizedPlanId = 'pro';
        normalizedPlanName = 'Pro';
      }
    }

    // 方案2: 优先从 scheduled 字段读取即将升级的计划
    let upcomingPlan: {
      planId: 'pro' | 'proplus';
      interval: 'month' | 'year';
      takesEffectAt?: string | null;
      changeType?: 'upgrade' | 'downgrade';
    } | null = null;

    // 方案2: 优先从 scheduled 字段读取即将升级的计划
    // 现在 scheduled 字段已经添加到 schema，可以直接访问
    const scheduledPlanId = activeSubscription.scheduledPlanId;
    const scheduledInterval = activeSubscription.scheduledInterval;
    const scheduledPeriodStart = activeSubscription.scheduledPeriodStart;

    console.log('[Subscription API] Checking scheduled fields:', {
      scheduledPlanId,
      scheduledInterval,
      scheduledPeriodStart: scheduledPeriodStart?.toISOString(),
    });

    if (
      scheduledPlanId &&
      (scheduledPlanId === 'pro' || scheduledPlanId === 'proplus') &&
      scheduledInterval &&
      (scheduledInterval === 'month' || scheduledInterval === 'year')
    ) {
      // 从 scheduled 字段读取
      const takesEffectAt = scheduledPeriodStart?.toISOString() || null;
      const takesEffectTime = takesEffectAt ? new Date(takesEffectAt).getTime() : null;
      const isFuture = !takesEffectTime || takesEffectTime > Date.now();

      if (isFuture) {
        // 判断是升级还是降级
        const currentPlanId = normalizedPlanId || activeSubscription.priceId;
        const isUpgrade =
          (currentPlanId === 'pro' && scheduledPlanId === 'proplus') ||
          (currentPlanId === 'free' &&
            (scheduledPlanId === 'pro' || scheduledPlanId === 'proplus'));

        upcomingPlan = {
          planId: scheduledPlanId as 'pro' | 'proplus',
          interval: scheduledInterval as 'month' | 'year',
          takesEffectAt,
          changeType: isUpgrade ? 'upgrade' : 'downgrade',
        };

        console.log(
          '[Subscription API] Found scheduled plan change from scheduled fields:',
          upcomingPlan
        );
      } else {
        console.log('[Subscription API] Scheduled plan change is in the past, ignoring');
      }
    }

    // Fallback: 从事件记录读取（兼容旧逻辑）
    if (!upcomingPlan) {
      try {
        const latestPlanChangeEvent = await paymentRepository.findLatestPlanChangeEvent(
          activeSubscription.id
        );

        if (latestPlanChangeEvent?.eventData) {
          try {
            const payload = JSON.parse(latestPlanChangeEvent.eventData);
            const scheduled =
              payload?.scheduledAtPeriodEnd ||
              payload?.scheduleAtPeriodEnd ||
              (typeof payload?.action === 'string' && payload.action.includes('scheduled'));
            const takesEffectAt =
              payload?.takesEffectAt ||
              payload?.periodEnd ||
              activeSubscription.periodEnd?.toISOString() ||
              null;
            const takesEffectTime = takesEffectAt ? new Date(takesEffectAt).getTime() : null;
            const isFuture = !takesEffectTime || takesEffectTime > Date.now();

            if (
              scheduled &&
              isFuture &&
              (payload?.newPlan === 'pro' || payload?.newPlan === 'proplus') &&
              (payload?.newInterval === 'month' || payload?.newInterval === 'year')
            ) {
              upcomingPlan = {
                planId: payload.newPlan,
                interval: payload.newInterval,
                takesEffectAt,
                changeType:
                  typeof payload?.action === 'string' && payload.action.includes('downgrade')
                    ? 'downgrade'
                    : 'upgrade',
              };
            }
          } catch (error) {
            console.warn('[Subscription API] Failed to parse plan change event data', {
              paymentId: activeSubscription.id,
              error,
            });
          }
        }
      } catch (error) {
        console.warn('[Subscription API] Failed to fetch plan change event', {
          paymentId: activeSubscription.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      subscription: {
        id: activeSubscription.id,
        subscriptionId: activeSubscription.subscriptionId,
        status: activeSubscription.status,
        planName: normalizedPlanName,
        planId: normalizedPlanId,
        priceId: activeSubscription.priceId,
        productId: activeSubscription.productId,
        interval: activeSubscription.interval,
        periodStart: activeSubscription.periodStart
          ? activeSubscription.periodStart.toISOString()
          : null,
        periodEnd: activeSubscription.periodEnd ? activeSubscription.periodEnd.toISOString() : null,
        cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
        provider: activeSubscription.provider,
        upcomingPlan,
      },
    });
  } catch (error) {
    console.error('[Creem Subscription] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Creem Subscription] Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to fetch subscription', details: errorMessage },
      { status: 500 }
    );
  }
}
