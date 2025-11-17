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
      })),
    });

    const activeSubscription = await paymentRepository.findActiveSubscriptionByUserId(
      session.user.id
    );

    // Return null only when there is truly no active subscription
    if (!activeSubscription) {
      console.log('[Subscription API] No active subscription found after filtering');
      return NextResponse.json({ subscription: null });
    }

    console.log('[Subscription API] Found active subscription:', {
      id: activeSubscription.id,
      priceId: activeSubscription.priceId,
      productId: activeSubscription.productId,
      status: activeSubscription.status,
      interval: activeSubscription.interval,
      cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
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

    const resolvedPlan =
      resolvePlanByIdentifier(activeSubscription.priceId, intervalHint) ||
      resolvePlanByProductId(candidateProductId, intervalHint);

    console.log('[Subscription API] Resolved plan:', {
      resolved: resolvedPlan
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
      },
    });
  } catch (error) {
    console.error('[Creem Subscription] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}
