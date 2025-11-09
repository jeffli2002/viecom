import { auth } from '@/lib/auth/auth';
import { isCreemConfigured } from '@/payment/creem/client';
import { CreemProvider } from '@/payment/creem/provider';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const checkoutSchema = z.object({
  priceId: z.string().min(1),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  metadata: z.record(z.string()).optional(),
});

export async function POST(request: Request) {
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

    const body = await request.json();
    const validatedData = checkoutSchema.parse(body);

    const creemProvider = new CreemProvider();

    const result = await creemProvider.createPayment({
      userId: session.user.id,
      priceId: validatedData.priceId,
      successUrl: validatedData.successUrl,
      cancelUrl: validatedData.cancelUrl,
      metadata: {
        ...validatedData.metadata,
        email: session.user.email,
        name: session.user.name || session.user.email || 'Unknown User',
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Creem Checkout] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}


