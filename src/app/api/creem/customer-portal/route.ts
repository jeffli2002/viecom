import { auth } from '@/lib/auth/auth';
import { creemService } from '@/lib/creem/creem-service';
import { isCreemConfigured } from '@/payment/creem/client';
import { paymentRepository } from '@/server/db/repositories/payment-repository';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const portalSchema = z.object({
  returnUrl: z.string().url().optional(),
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

    const body = await request.json().catch(() => ({}));
    const validation = portalSchema.safeParse(body);

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

    const { returnUrl } = validation.data;

    // Find user's subscription to get customer ID
    const subscription = await paymentRepository.findActiveSubscriptionByUserId(session.user.id);

    if (!subscription || subscription.provider !== 'creem') {
      return NextResponse.json(
        { success: false, error: 'No active Creem subscription found' },
        { status: 404 }
      );
    }

    const result = await creemService.generateCustomerPortalLink(
      subscription.customerId,
      returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to generate customer portal link' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
    });
  } catch (error) {
    console.error('[Creem Customer Portal] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate customer portal link',
      },
      { status: 500 }
    );
  }
}


