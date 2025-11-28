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

  const nov27 = purchases.filter((p) => {
    const date = new Date(p.createdAt);
    return date.getUTCDate() === 27 && date.getUTCMonth() === 10;
  });

  return NextResponse.json({
    total: purchases.length,
    nov27Total: nov27.length,
    uniqueOrders: new Set(
      purchases
        .map((p) => {
          const meta = p.metadata ? JSON.parse(p.metadata as string) : {};
          return meta.orderId;
        })
        .filter(Boolean)
    ).size,
    allPurchases: purchases.map((p) => {
      const meta = p.metadata ? JSON.parse(p.metadata as string) : {};
      return {
        transactionId: p.id,
        orderId: meta.orderId,
        checkoutId: meta.checkoutId,
        credits: p.amount,
        createdAt: p.createdAt,
        productName: meta.productName,
      };
    }),
    nov27Purchases: nov27.map((p) => {
      const meta = p.metadata ? JSON.parse(p.metadata as string) : {};
      return {
        transactionId: p.id,
        orderId: meta.orderId,
        checkoutId: meta.checkoutId,
        credits: p.amount,
        createdAt: p.createdAt,
        productName: meta.productName,
      };
    }),
  });
}
