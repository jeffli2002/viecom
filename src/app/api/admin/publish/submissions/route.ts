import { SHOWCASE_CATEGORIES } from '@/config/showcase.config';
import { requireAdmin } from '@/lib/admin/auth';
import { db } from '@/server/db';
import { publishSubmissions, user } from '@/server/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    void admin;

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status') || 'pending';
    const limitParam = Number.parseInt(searchParams.get('limit') || '50', 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50;

    const allowedStatuses = ['pending', 'approved', 'rejected'] as const;
    const filters =
      statusParam === 'all' ||
      !allowedStatuses.includes(statusParam as (typeof allowedStatuses)[number])
        ? []
        : [eq(publishSubmissions.status, statusParam as (typeof allowedStatuses)[number])];

    let query = db
      .select({
        submission: publishSubmissions,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      })
      .from(publishSubmissions)
      .leftJoin(user, eq(user.id, publishSubmissions.userId));

    if (filters.length > 0) {
      query = query.where(and(...filters));
    }

    const rows = await query.orderBy(desc(publishSubmissions.createdAt)).limit(limit);

    return NextResponse.json({
      success: true,
      submissions: rows.map((row) => ({
        ...row.submission,
        user: row.user,
        categoryLabel:
          SHOWCASE_CATEGORIES.find((category) => category.id === row.submission.category)?.label ??
          'Showcase',
      })),
    });
  } catch (error) {
    console.error('Failed to fetch publish submissions:', error);
    return NextResponse.json({ error: 'Failed to load submissions' }, { status: 500 });
  }
}
