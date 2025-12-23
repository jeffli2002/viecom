import { reportServerError } from '@/lib/monitoring/error-reporting';
import { db } from '@/server/db';
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await db.execute(sql`
      select
        to_regclass('public.verification') as verification,
        to_regclass('public."rateLimit"') as rate_limit
    `);

    const row = result.rows?.[0];
    const missing: string[] = [];

    if (!row?.verification) {
      missing.push('verification');
    }

    if (!row?.rate_limit) {
      missing.push('rateLimit');
    }

    if (missing.length > 0) {
      return NextResponse.json(
        { ok: false, missing },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    await reportServerError(error, { route: '/api/health/auth', method: 'GET' });
    return NextResponse.json(
      { ok: false, error: 'auth health check failed' },
      { status: 500 }
    );
  }
}
