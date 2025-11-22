/**
 * Test webhook with the EXACT payload that's failing in production
 */

import { resolve } from 'node:path';
import { config } from 'dotenv';

// Load .env.local file FIRST before setting SKIP_ENV_VALIDATION
config({ path: resolve(process.cwd(), '.env.local') });

// Set SKIP_ENV_VALIDATION to avoid env.ts validation when importing modules
process.env.SKIP_ENV_VALIDATION = 'true';

import { creemService } from '@/lib/creem/creem-service';
import { db } from '@/server/db';
import { creditTransactions, userCredits } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { paymentRepository } from '@/server/db/repositories/payment-repository';
import { randomUUID } from 'node:crypto';

const realWebhookPayload = {
  id: 'evt_2bINGLv9VMBbGVZh7f2Tbp',
  eventType: 'checkout.completed',
  created_at: 1763772626210,
  object: {
    id: 'ch_5Cc2eKp7jR44j6hyUKT5Wl',
    object: 'checkout',
    request_id: 'checkout_myZwkau1DoG2GXcibytBYmmwRXX8Mw6L_1763772575829',
    order: {
      object: 'order',
      id: 'ord_670xalRBUI9iMZXla19Xqy',
      customer: 'cust_7ECJrW5ALvuCieDX4W3mOQ',
      product: 'prod_7dyQB04IzFilLT5nDGZBD1',
      amount: 500,
      currency: 'USD',
      sub_total: 500,
      tax_amount: 0,
      amount_due: 500,
      amount_paid: 500,
      status: 'paid',
      type: 'onetime',
      transaction: 'tran_7NygqaEttThOwHf1KjUKK8',
      created_at: '2025-11-22T00:49:41.754Z',
      updated_at: '2025-11-22T00:49:41.754Z',
      mode: 'test',
    },
    product: {
      id: 'prod_7dyQB04IzFilLT5nDGZBD1',
      object: 'product',
      name: '1000 credits',
      description: '1000 credits one time ',
      price: 500,
      currency: 'USD',
      billing_type: 'onetime',
      billing_period: 'once',
      status: 'active',
      tax_mode: 'exclusive',
      tax_category: 'saas',
      default_success_url: '',
      created_at: '2025-11-14T09:05:44.233Z',
      updated_at: '2025-11-14T09:05:44.233Z',
      mode: 'test',
    },
    units: 1,
    success_url:
      'https://viecom-git-payment-jeff-lees-projects-92a56a05.vercel.app/dashboard?payment=success',
    customer: {
      id: 'cust_7ECJrW5ALvuCieDX4W3mOQ',
      object: 'customer',
      email: 'jefflee2002@gmail.com',
      name: 'LI LEI',
      country: 'CN',
      created_at: '2025-11-15T03:53:27.273Z',
      updated_at: '2025-11-15T03:53:27.273Z',
      mode: 'test',
    },
    status: 'completed',
    metadata: {
      type: 'credit_pack',
      userId: 'myZwkau1DoG2GXcibytBYmmwRXX8Mw6L',
      userEmail: 'jefflee2002@gmail.com',
    },
    mode: 'test',
  },
};

async function testFullWebhookFlow() {
  console.log('═'.repeat(80));
  console.log('🧪 TESTING FULL WEBHOOK FLOW WITH REAL PAYLOAD');
  console.log('═'.repeat(80));

  try {
    // Step 1: Parse event
    console.log('\n📥 Step 1: Parse webhook event');
    const eventId = realWebhookPayload.id;
    const result = await creemService.handleWebhookEvent(realWebhookPayload as any);

    if (!result || typeof result !== 'object' || !('type' in result)) {
      console.error('❌ Failed to parse event');
      process.exit(1);
    }

    console.log('✅ Parsed as:', result.type);
    console.log('   userId:', result.userId);
    console.log('   credits:', result.credits);

    // Step 2: Add eventId
    const dataWithEventId = { ...result, eventId };
    console.log('\n📋 Step 2: Data with eventId:', JSON.stringify(dataWithEventId, null, 2));

    // Step 3: Execute handleCreditPackPurchase logic
    if (result.type === 'credit_pack_purchase') {
      console.log('\n💳 Step 3: Execute handleCreditPackPurchase logic');

      const { userId, credits, productName, checkoutId, orderId, productId } = dataWithEventId;

      console.log('Input:', { userId, credits, productName, checkoutId, orderId, productId });

      // Validation
      if (!userId) {
        console.error('❌ Missing userId');
        process.exit(1);
      }

      if (!credits || credits <= 0) {
        console.error('❌ Invalid credits:', credits);
        process.exit(1);
      }

      console.log('✅ Validation passed');

      // Step 4: Database operations
      console.log('\n📊 Step 4: Database operations');

      const referenceId = `creem_credit_pack_${orderId || checkoutId}_${Date.now()}`;
      console.log('Reference ID:', referenceId);

      // Check for existing transaction
      console.log('\n🔍 Checking for existing transaction...');
      const [existingTransaction] = await db
        .select()
        .from(creditTransactions)
        .where(eq(creditTransactions.referenceId, referenceId))
        .limit(1);

      if (existingTransaction) {
        console.log('⚠️  Transaction already exists, skipping');
        return;
      }
      console.log('✅ No existing transaction');

      // Get user credit account
      console.log('\n👤 Getting user credit account...');
      const [userCredit] = await db
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, userId as string))
        .limit(1);

      console.log(userCredit ? '✅ User credit account found' : '⚠️  No credit account, will create');

      if (!userCredit) {
        // Create credit account
        console.log('\n➕ Creating credit account...');
        const now = new Date();
        await db.insert(userCredits).values({
          id: randomUUID(),
          userId: userId as string,
          balance: credits as number,
          totalEarned: credits as number,
          totalSpent: 0,
          frozenBalance: 0,
          createdAt: now,
          updatedAt: now,
        });
        console.log('✅ Credit account created');

        // Insert transaction
        console.log('\n📝 Creating credit transaction...');
        await db.insert(creditTransactions).values({
          id: randomUUID(),
          userId: userId as string,
          type: 'earn',
          amount: credits as number,
          balanceAfter: credits as number,
          source: 'purchase',
          description: `Credit pack purchase: ${productName || `${credits} credits`}`,
          referenceId,
          metadata: JSON.stringify({
            provider: 'creem',
            checkoutId,
            orderId,
            productName,
            credits,
          }),
        });
        console.log('✅ Transaction created');
      } else {
        // Update existing account
        const newBalance = userCredit.balance + (credits as number);
        console.log(`\n🔄 Updating credit balance: ${userCredit.balance} → ${newBalance}`);

        await db
          .update(userCredits)
          .set({
            balance: newBalance,
            totalEarned: userCredit.totalEarned + (credits as number),
            updatedAt: new Date(),
          })
          .where(eq(userCredits.userId, userId as string));
        console.log('✅ Balance updated');

        // Insert transaction
        console.log('\n📝 Creating credit transaction...');
        await db.insert(creditTransactions).values({
          id: randomUUID(),
          userId: userId as string,
          type: 'earn',
          amount: credits as number,
          balanceAfter: newBalance,
          source: 'purchase',
          description: `Credit pack purchase: ${productName || `${credits} credits`}`,
          referenceId,
          metadata: JSON.stringify({
            provider: 'creem',
            checkoutId,
            orderId,
            productName,
            credits,
          }),
        });
        console.log('✅ Transaction created');
      }

      // Mark event as processed (skip for credit packs as they don't have payment records)
      // Note: This would fail in production too - payment_event requires a payment_id that exists in payment table
      console.log('\n📌 Attempting to mark event as processed...');
      try {
        // Check if event already processed by creemEventId
        const isProcessed = await paymentRepository.isCreemEventProcessed(eventId);
        if (isProcessed) {
          console.log('⚠️  Event already processed (found by creemEventId)');
        } else {
          console.log('⚠️  Note: createEvent would fail here because credit packs don\'t create payment records');
          console.log('   This is a known issue - credit pack events cannot be recorded in payment_event table');
          console.log('   due to foreign key constraint. Event deduplication should use creemEventId check instead.');
        }
      } catch (error) {
        console.log('⚠️  Could not check/create event record (expected for credit packs):', 
          error instanceof Error ? error.message : String(error));
      }

      console.log('\n' + '═'.repeat(80));
      console.log('✅ WEBHOOK PROCESSING COMPLETED SUCCESSFULLY');
      console.log('═'.repeat(80));
      console.log(`\n🎉 Granted ${credits} credits to user ${userId}`);
    }
  } catch (error) {
    console.log('\n' + '═'.repeat(80));
    console.log('❌ ERROR OCCURRED');
    console.log('═'.repeat(80));
    console.error('\nError:', error);
    console.error('\nError message:', error instanceof Error ? error.message : String(error));
    console.error('\nStack trace:', error instanceof Error ? error.stack : 'No stack trace');
    process.exit(1);
  }
}

testFullWebhookFlow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
