import { createHash, randomUUID } from 'node:crypto';
import { getSessionFromRequest } from '@/lib/auth/auth-utils';
import { db } from '@/server/db';
import { affiliate, affiliateClick } from '@/server/db/schema';
import { and, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const clickSchema = z.object({
  ref: z.string().min(4).max(32),
  path: z.string().max(2048).optional(),
  referrer: z.string().max(2048).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = clickSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const affiliateCode = parsed.data.ref.trim();
    if (!/^[A-Za-z0-9_-]{4,32}$/.test(affiliateCode)) {
      return NextResponse.json({ success: false, error: 'Invalid ref code' }, { status: 400 });
    }

    const [affiliateRow] = await db
      .select({ id: affiliate.id, code: affiliate.code })
      .from(affiliate)
      .where(and(eq(affiliate.code, affiliateCode), eq(affiliate.status, 'active')))
      .limit(1);

    if (!affiliateRow) {
      return NextResponse.json({ success: true, ignored: true });
    }

    const session = await getSessionFromRequest(request.headers);
    const userId = session?.user?.id ?? null;

    const forwardedFor = request.headers.get('x-forwarded-for') || '';
    const userAgent = request.headers.get('user-agent') || '';

    const ipHash = forwardedFor ? createHash('sha256').update(forwardedFor).digest('hex') : null;
    const userAgentHash = userAgent ? createHash('sha256').update(userAgent).digest('hex') : null;

    await db.insert(affiliateClick).values({
      id: randomUUID(),
      affiliateId: affiliateRow.id,
      affiliateCode: affiliateRow.code,
      userId,
      path: parsed.data.path ?? null,
      referrer: parsed.data.referrer ?? null,
      ipHash,
      userAgentHash,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Affiliate Click] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to record click' }, { status: 500 });
  }
}
