import { db } from '@/server/db';
import { creditTransactions } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  const purchases = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.source, 'purchase'))
    .orderBy(creditTransactions.createdAt);

  return NextResponse.json({
    purchases: purchases.map((p) => ({
      id: p.id,
      credits: p.amount,
      createdAt: p.createdAt,
      metadata: p.metadata ? JSON.parse(p.metadata as string) : null,
    })),
  });
}
