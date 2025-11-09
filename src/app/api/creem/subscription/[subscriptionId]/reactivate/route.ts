import { auth } from '@/lib/auth/auth';
import { creemService } from '@/lib/creem/creem-service';
import { isCreemConfigured } from '@/payment/creem/client';
import { paymentRepository } from '@/server/db/repositories/payment-repository';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(
  _request: Request,
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

    const result = await creemService.reactivateSubscription(subscriptionId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to reactivate subscription' },
        { status: 500 }
      );
    }

    await paymentRepository.update(subscriptionId, {
      cancelAtPeriodEnd: false,
      status: 'active',
    });

    await paymentRepository.createEvent({
      paymentId: paymentRecord.id,
      eventType: 'reactivated',
      eventData: JSON.stringify({
        subscriptionId,
        reactivatedAt: new Date().toISOString(),
      }),
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription reactivated successfully',
      subscription: result.subscription,
    });
  } catch (error) {
    console.error('[Creem Subscription Reactivate] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reactivate subscription',
      },
      { status: 500 }
    );
  }
}
