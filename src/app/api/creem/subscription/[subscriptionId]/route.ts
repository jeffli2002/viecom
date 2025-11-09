import { auth } from '@/lib/auth/auth';
import { isCreemConfigured } from '@/payment/creem/client';
import { CreemProvider } from '@/payment/creem/provider';
import { paymentRepository } from '@/server/db/repositories/payment-repository';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const updateSchema = z.object({
  priceId: z.string().min(1).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  metadata: z.record(z.string()).optional(),
});

export async function GET(
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

    const creemProvider = new CreemProvider();
    const subscription = await creemProvider.getSubscription(subscriptionId);

    return NextResponse.json(subscription);
  } catch (error) {
    const { subscriptionId } = await params;
    console.error('[Creem Subscription Get] Error:', error, { subscriptionId });
    return NextResponse.json({ error: 'Failed to get subscription' }, { status: 500 });
  }
}

export async function PATCH(
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
    const validatedData = updateSchema.parse(body);

    const creemProvider = new CreemProvider();
    const result = await creemProvider.updateSubscription(subscriptionId, validatedData);

    return NextResponse.json(result);
  } catch (error) {
    const { subscriptionId } = await params;
    console.error('[Creem Subscription Update] Error:', error, { subscriptionId });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}

export async function DELETE(
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

    const creemProvider = new CreemProvider();
    const success = await creemProvider.cancelSubscription(subscriptionId);

    if (!success) {
      return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const { subscriptionId } = await params;
    console.error('[Creem Subscription Cancel] Error:', error, { subscriptionId });
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
