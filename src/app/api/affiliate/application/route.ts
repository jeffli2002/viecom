import { randomUUID } from 'node:crypto';
import { getSessionFromRequest } from '@/lib/auth/auth-utils';
import { db } from '@/server/db';
import { affiliateApplication } from '@/server/db/schema';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request.headers);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = (await request.json()) as {
      name?: string;
      email?: string;
      companyName?: string;
      companyDescription?: string;
      channels?: string[];
      address?: string;
      city?: string;
      country?: string;
      zipCode?: string;
      region?: string;
      payoutMethod?: string;
      payoutAccount?: string;
    };

    if (!payload?.name || !payload?.email) {
      return NextResponse.json({ success: false, error: 'Missing name or email' }, { status: 400 });
    }

    const [record] = await db
      .insert(affiliateApplication)
      .values({
        id: randomUUID(),
        userId: session.user.id,
        name: payload.name,
        email: payload.email,
        companyName: payload.companyName ?? null,
        companyDescription: payload.companyDescription ?? null,
        channels: payload.channels ?? [],
        address: payload.address ?? null,
        city: payload.city ?? null,
        country: payload.country ?? null,
        zipCode: payload.zipCode ?? null,
        region: payload.region ?? null,
        payoutMethod: payload.payoutMethod ?? null,
        payoutAccount: payload.payoutAccount ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: affiliateApplication.userId,
        set: {
          name: payload.name,
          email: payload.email,
          companyName: payload.companyName ?? null,
          companyDescription: payload.companyDescription ?? null,
          channels: payload.channels ?? [],
          address: payload.address ?? null,
          city: payload.city ?? null,
          country: payload.country ?? null,
          zipCode: payload.zipCode ?? null,
          region: payload.region ?? null,
          payoutMethod: payload.payoutMethod ?? null,
          payoutAccount: payload.payoutAccount ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error('[Affiliate Application] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit application',
      },
      { status: 500 }
    );
  }
}
