import { randomUUID } from 'node:crypto';
import { env } from '@/env';
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
    let skippedDuplicate = 0;
    const details: Array<{
      orderId: string;
      credits: number;
      amount: number;
      date: Date;
    }> = [];
    const processedOrderIds = new Set<string>();

    for (const transaction of purchaseTransactions) {
      const metadata = transaction.metadata ? JSON.parse(transaction.metadata as string) : {};

      const orderId = metadata.orderId || null;
      const checkoutId = metadata.checkoutId || null;

      if (!orderId) {
        console.log('Skipping transaction without orderId:', transaction.id);
        continue;
      }

      if (processedOrderIds.has(orderId)) {
        console.log('Skipping duplicate orderId:', orderId);
        skippedDuplicate++;
        continue;
      }
      processedOrderIds.add(orderId);

      const testOrderIds = ['ord_670xalRBUI9iMZXla19Xqy', 'ord_2lpCdbTAyqb1Utf2CUU8Yg'];

      const isTestMode =
        orderId.startsWith('ord_test_') ||
        checkoutId?.startsWith('ch_test_') ||
        testOrderIds.includes(orderId);

      if (isTestMode) {
        console.log('Marking as test mode purchase:', orderId);
        skippedTest++;
      }

      const _productName = metadata.productName || `${transaction.amount} credits`;
      const credits = transaction.amount;
      const currency = metadata.currency || 'USD';

      const amountCents =
        credits === 10000
          ? 27000
          : credits === 5000
            ? 13500
            : credits === 2000
              ? 6000
              : credits === 1000
                ? 3000
                : credits === 300
                  ? 449
                  : credits === 100
                    ? 330
                    : 0;

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
        testMode: isTestMode,
        createdAt: transaction.createdAt,
      });

      details.push({
        orderId,
        credits,
        amount: amountCents / 100,
        date: transaction.createdAt,
      });

      backfilled++;
    }

    return NextResponse.json({
      success: true,
      message: `Backfilled ${backfilled} credit pack purchases (skipped ${skippedTest} test mode, ${skippedDuplicate} duplicates)`,
      backfilled,
      skippedTest,
      skippedDuplicate,
      details,
    });
  } catch (error) {
    console.error('Fix amounts error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
