import { randomUUID } from 'node:crypto';
import { db } from '@/server/db';
import { creditPackPurchase, creditTransactions } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await db.delete(creditPackPurchase);

    const purchaseTransactions = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.source, 'purchase'))
      .orderBy(creditTransactions.createdAt);

    let backfilled = 0;
    let skippedTest = 0;

    for (const transaction of purchaseTransactions) {
      const metadata = transaction.metadata ? JSON.parse(transaction.metadata as string) : {};

      const orderId = metadata.orderId || null;
      const checkoutId = metadata.checkoutId || null;

      if (!orderId) {
        console.log('Skipping transaction without orderId:', transaction.id);
        continue;
      }

      if (orderId.startsWith('ord_test_') || checkoutId?.startsWith('ch_test_')) {
        console.log('Skipping test mode purchase:', orderId);
        skippedTest++;
        continue;
      }

      const _productName = metadata.productName || `${transaction.amount} credits`;
      const credits = transaction.amount;
      const currency = metadata.currency || 'USD';

      const amountCents =
        credits === 1000 ? 4900 : credits === 300 ? 1490 : credits === 100 ? 490 : 0;

      await db.insert(creditPackPurchase).values({
        id: randomUUID(),
        userId: transaction.userId,
        creditPackId: `pack_${credits}`,
        credits,
        amountCents,
        currency,
        provider: 'creem',
        orderId,
        checkoutId,
        creditTransactionId: transaction.id,
        metadata,
        createdAt: transaction.createdAt,
      });

      backfilled++;
    }

    return NextResponse.json({
      success: true,
      message: `Backfilled ${backfilled} credit pack purchases (skipped ${skippedTest} test mode)`,
      backfilled,
      skippedTest,
    });
  } catch (error) {
    console.error('Backfill error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
