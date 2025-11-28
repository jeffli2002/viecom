import { randomUUID } from 'node:crypto';
import { requireAdmin } from '@/lib/admin/auth';
import { db } from '@/server/db';
import { creditPackPurchase, creditTransactions, userCredits } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin();

    const body = await request.json();
    const { userId, credits, orderId, checkoutId, amountCents } = body;

    if (!userId || !credits || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, credits, orderId' },
        { status: 400 }
      );
    }

    const [existingTransaction] = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.referenceId, `creem_credit_pack_${orderId}`))
      .limit(1);

    if (existingTransaction) {
      return NextResponse.json(
        { error: 'Purchase with this orderId already exists' },
        { status: 400 }
      );
    }

    const [userCredit] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .limit(1);

    if (!userCredit) {
      return NextResponse.json({ error: 'User credit account not found' }, { status: 404 });
    }

    const newBalance = userCredit.balance + credits;
    const referenceId = `creem_credit_pack_${orderId}`;

    await db
      .update(userCredits)
      .set({
        balance: newBalance,
        totalEarned: userCredit.totalEarned + credits,
        updatedAt: new Date(),
      })
      .where(eq(userCredits.userId, userId));

    const [transactionRecord] = await db
      .insert(creditTransactions)
      .values({
        id: randomUUID(),
        userId,
        type: 'earn',
        amount: credits,
        balanceAfter: newBalance,
        source: 'purchase',
        description: `Credit pack purchase: ${credits} credits (manual)`,
        referenceId,
        metadata: JSON.stringify({
          provider: 'creem',
          checkoutId,
          orderId,
          credits,
          amount: amountCents / 100,
          currency: 'USD',
          manual: true,
        }),
        createdAt: new Date(),
      })
      .returning({ id: creditTransactions.id });

    await db.insert(creditPackPurchase).values({
      id: randomUUID(),
      userId,
      creditPackId: `pack_${credits}`,
      credits,
      amountCents,
      currency: 'USD',
      provider: 'creem',
      orderId,
      checkoutId: checkoutId || null,
      creditTransactionId: transactionRecord?.id || null,
      metadata: {
        provider: 'creem',
        orderId,
        checkoutId,
        credits,
        amount: amountCents / 100,
        manual: true,
      },
      testMode: false,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Purchase added successfully',
      newBalance,
    });
  } catch (error) {
    console.error('Manual purchase error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
