import { randomUUID } from 'node:crypto';
import { generateAffiliateCode } from '@/lib/affiliate/affiliate-code';
import { db } from '@/server/db';
import {
  affiliate,
  affiliateClick,
  affiliateCommission,
  affiliateWalletLedger,
} from '@/server/db/schema';
import { and, desc, eq, sql } from 'drizzle-orm';

export type AffiliateRecord = {
  id: string;
  userId: string;
  code: string;
  status: 'pending' | 'active' | 'suspended' | 'banned';
  createdAt: Date;
  updatedAt: Date;
};

export type AffiliateOverview = {
  affiliate: AffiliateRecord;
  clicks: number;
  commissionTotalCents: number;
  pendingCommissionCents: number;
  availableBalanceCents: number;
  recentCommissions: Array<{
    id: string;
    sourceType: string;
    sourceId: string | null;
    currency: string;
    baseAmountCents: number;
    commissionAmountCents: number;
    status: string;
    createdAt: Date;
  }>;
};

export class AffiliateRepository {
  async findByUserId(userId: string): Promise<AffiliateRecord | null> {
    const [row] = await db.select().from(affiliate).where(eq(affiliate.userId, userId)).limit(1);

    return row
      ? {
          id: row.id,
          userId: row.userId,
          code: row.code,
          status: row.status as AffiliateRecord['status'],
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }
      : null;
  }

  async findActiveByCode(
    code: string
  ): Promise<Pick<AffiliateRecord, 'id' | 'code' | 'userId'> | null> {
    const [row] = await db
      .select({ id: affiliate.id, code: affiliate.code, userId: affiliate.userId })
      .from(affiliate)
      .where(and(eq(affiliate.code, code), eq(affiliate.status, 'active')))
      .limit(1);
    return row ?? null;
  }

  async createForUser(userId: string): Promise<AffiliateRecord> {
    const existing = await this.findByUserId(userId);
    if (existing) return existing;

    for (let attempt = 0; attempt < 5; attempt++) {
      const id = randomUUID();
      const code = generateAffiliateCode(8);

      try {
        const [row] = await db
          .insert(affiliate)
          .values({
            id,
            userId,
            code,
            status: 'active',
            parentAffiliateId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        if (!row) {
          throw new Error('Failed to create affiliate record');
        }

        return {
          id: row.id,
          userId: row.userId,
          code: row.code,
          status: row.status as AffiliateRecord['status'],
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('affiliate_code_unique') || message.includes('duplicate key')) {
          continue;
        }
        throw error;
      }
    }

    throw new Error('Failed to allocate a unique affiliate code');
  }

  async getOverview(affiliateId: string): Promise<Omit<AffiliateOverview, 'affiliate'> | null> {
    const [clickRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(affiliateClick)
      .where(eq(affiliateClick.affiliateId, affiliateId));

    const [commissionRow] = await db
      .select({
        total: sql<number>`coalesce(sum(${affiliateCommission.commissionAmountCents}), 0)::int`,
      })
      .from(affiliateCommission)
      .where(eq(affiliateCommission.affiliateId, affiliateId));

    const [pendingRow] = await db
      .select({
        total: sql<number>`coalesce(sum(${affiliateCommission.commissionAmountCents}), 0)::int`,
      })
      .from(affiliateCommission)
      .where(
        and(
          eq(affiliateCommission.affiliateId, affiliateId),
          eq(affiliateCommission.status, 'pending')
        )
      );

    const [balanceRow] = await db
      .select({
        balance: sql<number>`coalesce(sum(${affiliateWalletLedger.amountCents}), 0)::int`,
      })
      .from(affiliateWalletLedger)
      .where(eq(affiliateWalletLedger.affiliateId, affiliateId));

    const recent = await db
      .select({
        id: affiliateCommission.id,
        sourceType: affiliateCommission.sourceType,
        sourceId: affiliateCommission.sourceId,
        currency: affiliateCommission.currency,
        baseAmountCents: affiliateCommission.baseAmountCents,
        commissionAmountCents: affiliateCommission.commissionAmountCents,
        status: affiliateCommission.status,
        createdAt: affiliateCommission.createdAt,
      })
      .from(affiliateCommission)
      .where(eq(affiliateCommission.affiliateId, affiliateId))
      .orderBy(desc(affiliateCommission.createdAt))
      .limit(20);

    return {
      clicks: clickRow?.count ?? 0,
      commissionTotalCents: commissionRow?.total ?? 0,
      pendingCommissionCents: pendingRow?.total ?? 0,
      availableBalanceCents: balanceRow?.balance ?? 0,
      recentCommissions: recent.map((row) => ({
        id: row.id,
        sourceType: row.sourceType,
        sourceId: row.sourceId,
        currency: row.currency,
        baseAmountCents: row.baseAmountCents,
        commissionAmountCents: row.commissionAmountCents,
        status: row.status,
        createdAt: row.createdAt,
      })),
    };
  }
}

export const affiliateRepository = new AffiliateRepository();
