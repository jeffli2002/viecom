import { randomUUID } from 'node:crypto';
import { getAffiliateProgramConfig } from '@/lib/affiliate/affiliate-program';
import { db } from '@/server/db';
import { affiliate, affiliateCommission, affiliateWalletLedger } from '@/server/db/schema';
import { and, eq } from 'drizzle-orm';

type RecordCommissionParams = {
  affiliateCode: string;
  buyerUserId?: string | null;
  provider: 'creem' | 'stripe';
  providerEventId: string;
  sourceType: 'credit_pack_purchase' | 'subscription_initial' | 'subscription_renewal';
  sourceId?: string | null;
  baseAmountCents: number;
  currency: string;
};

export async function recordAffiliateCommission(params: RecordCommissionParams): Promise<{
  recorded: boolean;
  affiliateId?: string;
  commissionId?: string;
}> {
  const program = await getAffiliateProgramConfig();
  if (!program.enabled) {
    return { recorded: false };
  }

  const [affiliateRow] = await db
    .select({
      id: affiliate.id,
      code: affiliate.code,
      status: affiliate.status,
    })
    .from(affiliate)
    .where(and(eq(affiliate.code, params.affiliateCode), eq(affiliate.status, 'active')))
    .limit(1);

  if (!affiliateRow) {
    return { recorded: false };
  }

  const commissionBps = program.defaultCommissionBps;
  const commissionAmountCents = Math.round((params.baseAmountCents * commissionBps) / 10_000);

  const commissionId = randomUUID();
  const availableAt = new Date(Date.now() + program.settlementDelayDays * 24 * 60 * 60 * 1000);

  const inserted = await db
    .insert(affiliateCommission)
    .values({
      id: commissionId,
      affiliateId: affiliateRow.id,
      buyerUserId: params.buyerUserId ?? null,
      sourceType: params.sourceType,
      sourceId: params.sourceId ?? null,
      provider: params.provider,
      providerEventId: params.providerEventId,
      currency: params.currency,
      baseAmountCents: params.baseAmountCents,
      commissionBps,
      commissionAmountCents,
      status: 'pending',
      availableAt,
      createdAt: new Date(),
    })
    .onConflictDoNothing()
    .returning({ id: affiliateCommission.id });

  const insertedId = inserted[0]?.id;
  if (!insertedId) {
    return { recorded: false, affiliateId: affiliateRow.id };
  }

  return { recorded: true, affiliateId: affiliateRow.id, commissionId: insertedId };
}
