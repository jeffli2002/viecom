import { db } from '@/server/db';
import { affiliateProgram } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export type AffiliateProgramConfig = {
  enabled: boolean;
  attributionWindowDays: number;
  settlementDelayDays: number;
  negativeBalanceLimitCents: number;
  defaultCommissionBps: number;
};

const DEFAULT_PROGRAM_ID = 'default';

export async function getAffiliateProgramConfig(): Promise<AffiliateProgramConfig> {
  const [row] = await db
    .select({
      enabled: affiliateProgram.enabled,
      attributionWindowDays: affiliateProgram.attributionWindowDays,
      settlementDelayDays: affiliateProgram.settlementDelayDays,
      negativeBalanceLimitCents: affiliateProgram.negativeBalanceLimitCents,
      defaultCommissionBps: affiliateProgram.defaultCommissionBps,
    })
    .from(affiliateProgram)
    .where(eq(affiliateProgram.id, DEFAULT_PROGRAM_ID))
    .limit(1);

  return {
    enabled: row?.enabled ?? true,
    attributionWindowDays: row?.attributionWindowDays ?? 30,
    settlementDelayDays: row?.settlementDelayDays ?? 7,
    negativeBalanceLimitCents: row?.negativeBalanceLimitCents ?? 10000,
    defaultCommissionBps: row?.defaultCommissionBps ?? 1000,
  };
}
