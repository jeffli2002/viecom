import { db } from '@/server/db';
import { sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    const tableCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'credit_pack_purchase';
    `);

    if (tableCheck.rows.length === 0) {
      await db.execute(sql`
      CREATE TABLE "credit_pack_purchase" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "credit_pack_id" text NOT NULL,
        "credits" integer NOT NULL,
        "amount_cents" integer NOT NULL,
        "currency" text DEFAULT 'USD' NOT NULL,
        "provider" text DEFAULT 'creem' NOT NULL,
        "order_id" text,
        "checkout_id" text,
        "credit_transaction_id" text,
        "metadata" jsonb,
        "created_at" timestamp NOT NULL
      );
    `);

      await db.execute(sql`
      ALTER TABLE "credit_pack_purchase" 
      ADD CONSTRAINT "credit_pack_purchase_user_id_user_id_fk" 
      FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") 
      ON DELETE cascade ON UPDATE no action;
    `);

      await db.execute(sql`
      ALTER TABLE "credit_pack_purchase" 
      ADD CONSTRAINT "credit_pack_purchase_credit_transaction_id_credit_transactions_id_fk" 
      FOREIGN KEY ("credit_transaction_id") REFERENCES "public"."credit_transactions"("id") 
      ON DELETE set null ON UPDATE no action;
    `);
    }

    const columnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'credit_pack_purchase' 
      AND column_name = 'test_mode';
    `);

    if (columnCheck.rows.length === 0) {
      await db.execute(sql`
        ALTER TABLE "credit_pack_purchase" 
        ADD COLUMN "test_mode" boolean DEFAULT false NOT NULL;
      `);
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
