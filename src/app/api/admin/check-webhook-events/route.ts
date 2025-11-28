import { db } from '@/server/db';
import { paymentEvent } from '@/server/db/schema';
import { desc, gte } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  const nov27Start = new Date('2025-11-27T00:00:00Z');

  const events = await db
    .select()
    .from(paymentEvent)
    .where(gte(paymentEvent.createdAt, nov27Start))
    .orderBy(desc(paymentEvent.createdAt))
    .limit(50);

  return NextResponse.json({
    total: events.length,
    events: events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      status: e.status,
      createdAt: e.createdAt,
      metadata: e.metadata,
    })),
  });
}
