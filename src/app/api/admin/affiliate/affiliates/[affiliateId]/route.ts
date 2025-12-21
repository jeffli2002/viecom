import { requireAdmin } from '@/lib/admin/auth';
import { db } from '@/server/db';
import { affiliate } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const updateSchema = z.object({
  status: z.enum(['pending', 'active', 'suspended', 'banned']),
});

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ affiliateId: string }> }
) {
  try {
    await requireAdmin();

    const { affiliateId } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(affiliate)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(eq(affiliate.id, affiliateId))
      .returning({ id: affiliate.id });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Affiliates] PATCH error:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update affiliate' },
      { status: 500 }
    );
  }
}
