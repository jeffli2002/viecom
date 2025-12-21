import { randomUUID } from 'node:crypto';
import { env } from '@/env';
import { db } from '@/server/db';
import { affiliateCommission, affiliateWalletLedger, cronJobExecutions } from '@/server/db/schema';
import { and, eq, lte } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const executionId = randomUUID();
  const startedAt = new Date();

  await db.insert(cronJobExecutions).values({
    id: executionId,
    jobName: 'release-affiliate-commissions',
    status: 'running',
    startedAt,
    completedAt: null,
    duration: null,
    results: null,
    errorMessage: null,
    createdAt: startedAt,
  });

  try {
    const now = new Date();

    const pending = await db
      .select({
        id: affiliateCommission.id,
        affiliateId: affiliateCommission.affiliateId,
        currency: affiliateCommission.currency,
        amountCents: affiliateCommission.commissionAmountCents,
        sourceType: affiliateCommission.sourceType,
        sourceId: affiliateCommission.sourceId,
        provider: affiliateCommission.provider,
        providerEventId: affiliateCommission.providerEventId,
      })
      .from(affiliateCommission)
      .where(
        and(eq(affiliateCommission.status, 'pending'), lte(affiliateCommission.availableAt, now))
      )
      .limit(500);

    let released = 0;

    for (const commission of pending) {
      const updated = await db
        .update(affiliateCommission)
        .set({ status: 'available' })
        .where(
          and(eq(affiliateCommission.id, commission.id), eq(affiliateCommission.status, 'pending'))
        )
        .returning({ id: affiliateCommission.id });

      if (updated.length === 0) {
        continue;
      }

      await db
        .insert(affiliateWalletLedger)
        .values({
          id: randomUUID(),
          affiliateId: commission.affiliateId,
          type: 'commission',
          amountCents: commission.amountCents,
          currency: commission.currency,
          referenceType: 'commission',
          referenceId: commission.id,
          metadata: {
            sourceType: commission.sourceType,
            sourceId: commission.sourceId,
            provider: commission.provider,
            providerEventId: commission.providerEventId,
          },
          createdAt: new Date(),
        })
        .onConflictDoNothing();

      released++;
    }

    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    await db
      .update(cronJobExecutions)
      .set({
        status: 'completed',
        completedAt,
        duration,
        results: { released },
        errorMessage: null,
      })
      .where(eq(cronJobExecutions.id, executionId));

    return NextResponse.json({ success: true, released });
  } catch (error) {
    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    await db
      .update(cronJobExecutions)
      .set({
        status: 'failed',
        completedAt,
        duration,
        errorMessage: error instanceof Error ? error.message : String(error),
        results: null,
      })
      .where(eq(cronJobExecutions.id, executionId));

    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
