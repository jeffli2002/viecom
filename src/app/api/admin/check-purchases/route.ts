import { db } from '@/server/db';
import { creditPackPurchase, creditTransactions } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const purchases = await db
      .select()
      .from(creditPackPurchase)
      .orderBy(creditPackPurchase.createdAt);

    const purchaseTransactions = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.source, 'purchase'))
      .orderBy(creditTransactions.createdAt);

    return NextResponse.json({
      creditPackPurchases: purchases,
      purchaseTransactions: purchaseTransactions,
    });
  } catch (error) {
    console.error('Check purchases error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
