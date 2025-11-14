import { randomUUID } from 'node:crypto';
import type { PaymentInterval, PaymentRecord, PaymentStatus, PaymentType } from '@/payment/types';
import { db } from '@/server/db';
import { payment, paymentEvent } from '@/server/db/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';

export interface CreatePaymentData {
  id?: string;
  provider?: 'stripe' | 'creem';
  priceId: string;
  productId?: string;
  type: PaymentType;
  interval?: PaymentInterval;
  userId: string;
  customerId: string;
  subscriptionId?: string;
  status: PaymentStatus;
  periodStart?: Date;
  periodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  trialStart?: Date;
  trialEnd?: Date;
}

export interface UpdatePaymentData {
  priceId?: string;
  status?: PaymentStatus;
  subscriptionId?: string;
  periodStart?: Date;
  periodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  trialStart?: Date;
  trialEnd?: Date;
  interval?: PaymentInterval | null;
}

export interface CreatePaymentEventData {
  paymentId: string;
  eventType: string;
  stripeEventId?: string;
  creemEventId?: string;
  eventData?: string;
}

export class PaymentRepository {
  /**
   * Create payment record
   */
  async create(data: CreatePaymentData): Promise<PaymentRecord> {
    const paymentId = data.id || randomUUID();

    const [result] = await db
      .insert(payment)
      .values({
        id: paymentId,
        provider: data.provider || 'stripe',
        priceId: data.priceId,
        productId: data.productId || null,
        type: data.type,
        interval: data.interval || null,
        userId: data.userId,
        customerId: data.customerId,
        subscriptionId: data.subscriptionId || null,
        status: data.status,
        periodStart: data.periodStart || null,
        periodEnd: data.periodEnd || null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd || null,
        trialStart: data.trialStart || null,
        trialEnd: data.trialEnd || null,
      })
      .returning();

    if (!result) {
      throw new Error('Failed to create payment record');
    }

    return this.mapToPaymentRecord(result);
  }

  /**
   * Get payment record by ID
   */
  async findById(id: string): Promise<PaymentRecord | null> {
    const result = await db.select().from(payment).where(eq(payment.id, id)).limit(1);

    return result[0] ? this.mapToPaymentRecord(result[0]) : null;
  }

  /**
   * Get payment records by user ID
   */
  async findByUserId(userId: string): Promise<PaymentRecord[]> {
    const results = await db
      .select()
      .from(payment)
      .where(eq(payment.userId, userId))
      .orderBy(desc(payment.createdAt));

    return results.map(this.mapToPaymentRecord);
  }

  /**
   * 根据订阅 ID 获取支付记录
   */
  async findBySubscriptionId(subscriptionId: string): Promise<PaymentRecord | null> {
    const result = await db
      .select()
      .from(payment)
      .where(eq(payment.subscriptionId, subscriptionId))
      .limit(1);

    return result[0] ? this.mapToPaymentRecord(result[0]) : null;
  }

  /**
   * 根据客户 ID 获取支付记录
   */
  async findByCustomerId(customerId: string): Promise<PaymentRecord[]> {
    const results = await db
      .select()
      .from(payment)
      .where(eq(payment.customerId, customerId))
      .orderBy(desc(payment.createdAt));

    return results.map(this.mapToPaymentRecord);
  }

  /**
   * 获取用户的活跃订阅
   * Excludes subscriptions that are set to cancel at period end
   */
  async findActiveSubscriptionByUserId(userId: string): Promise<PaymentRecord | null> {
    const results = await db
      .select()
      .from(payment)
      .where(
        and(
          eq(payment.userId, userId),
          eq(payment.type, 'subscription'),
          inArray(payment.status, ['active', 'trialing', 'past_due'])
        )
      )
      .orderBy(desc(payment.createdAt));

    // Filter out subscriptions that are set to cancel at period end
    // and return the most recent truly active subscription
    const activeSubscription = results.find((sub) => !sub.cancelAtPeriodEnd);

    return activeSubscription ? this.mapToPaymentRecord(activeSubscription) : null;
  }

  /**
   * 更新支付记录
   */
  async update(id: string, data: UpdatePaymentData): Promise<PaymentRecord | null> {
    const updateData: Partial<typeof payment.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.priceId !== undefined) updateData.priceId = data.priceId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.subscriptionId !== undefined) updateData.subscriptionId = data.subscriptionId;
    if (data.periodStart !== undefined) updateData.periodStart = data.periodStart;
    if (data.periodEnd !== undefined) updateData.periodEnd = data.periodEnd;
    if (data.cancelAtPeriodEnd !== undefined) updateData.cancelAtPeriodEnd = data.cancelAtPeriodEnd;
    if (data.trialStart !== undefined) updateData.trialStart = data.trialStart;
    if (data.trialEnd !== undefined) updateData.trialEnd = data.trialEnd;
    if (data.interval !== undefined) updateData.interval = data.interval;

    const [result] = await db.update(payment).set(updateData).where(eq(payment.id, id)).returning();

    return result ? this.mapToPaymentRecord(result) : null;
  }

  /**
   * 删除支付记录
   */
  async delete(id: string): Promise<boolean> {
    const result = await db.delete(payment).where(eq(payment.id, id));

    return result.rowCount > 0;
  }

  /**
   * 创建支付事件记录
   */
  async createEvent(data: CreatePaymentEventData): Promise<void> {
    await db.insert(paymentEvent).values({
      id: randomUUID(),
      paymentId: data.paymentId,
      eventType: data.eventType,
      stripeEventId: data.stripeEventId || null,
      creemEventId: data.creemEventId || null,
      eventData: data.eventData || null,
    });
  }

  /**
   * 检查 Stripe 事件是否已处理
   */
  async isStripeEventProcessed(stripeEventId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(paymentEvent)
      .where(eq(paymentEvent.stripeEventId, stripeEventId))
      .limit(1);

    return result.length > 0;
  }

  /**
   * 检查 Creem 事件是否已处理
   */
  async isCreemEventProcessed(creemEventId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(paymentEvent)
      .where(eq(paymentEvent.creemEventId, creemEventId))
      .limit(1);

    return result.length > 0;
  }

  /**
   * Cancel all active subscriptions for a user
   */
  async cancelUserSubscriptions(userId: string): Promise<number> {
    const result = await db
      .update(payment)
      .set({
        status: 'canceled',
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      })
      .where(
        and(eq(payment.userId, userId), inArray(payment.status, ['active', 'trialing', 'past_due']))
      );

    return result.rowCount;
  }

  /**
   * Find subscription by user and status
   */
  async findSubscriptionByUserAndStatus(
    userId: string,
    statuses: PaymentStatus[]
  ): Promise<PaymentRecord[]> {
    const results = await db
      .select()
      .from(payment)
      .where(
        and(
          eq(payment.userId, userId),
          eq(payment.type, 'subscription'),
          inArray(payment.status, statuses)
        )
      )
      .orderBy(desc(payment.createdAt));

    return results.map(this.mapToPaymentRecord);
  }

  /**
   * Get subscription count by plan
   */
  async getSubscriptionCountByPlan(planId: string): Promise<number> {
    const result = await db
      .select()
      .from(payment)
      .where(
        and(
          eq(payment.priceId, planId),
          eq(payment.type, 'subscription'),
          inArray(payment.status, ['active', 'trialing'])
        )
      );

    return result.length;
  }

  /**
   * Check if user has any active subscription
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(payment)
      .where(
        and(
          eq(payment.userId, userId),
          eq(payment.type, 'subscription'),
          inArray(payment.status, ['active', 'trialing', 'past_due'])
        )
      )
      .limit(1);

    return result.length > 0;
  }

  /**
   * Update subscription status with state validation
   */
  async updateSubscriptionStatus(
    subscriptionId: string,
    newStatus: PaymentStatus,
    metadata?: Record<string, unknown>
  ): Promise<PaymentRecord | null> {
    const current = await this.findBySubscriptionId(subscriptionId);

    if (!current) {
      console.error(`[PaymentRepository] Subscription ${subscriptionId} not found`);
      return null;
    }

    // Validate state transition
    const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      incomplete: ['active', 'canceled', 'incomplete_expired'],
      incomplete_expired: ['active', 'canceled'],
      trialing: ['active', 'canceled', 'past_due'],
      active: ['canceled', 'past_due', 'unpaid', 'paused'],
      past_due: ['active', 'canceled', 'unpaid'],
      canceled: [], // Terminal state
      unpaid: ['active', 'canceled'],
      paused: ['active', 'canceled'],
    };

    const allowedTransitions = validTransitions[current.status] || [];

    if (!allowedTransitions.includes(newStatus) && current.status !== newStatus) {
      console.warn(
        `[PaymentRepository] Invalid status transition: ${current.status} → ${newStatus} for subscription ${subscriptionId}`
      );
    }

    return this.update(subscriptionId, {
      status: newStatus,
      ...metadata,
    });
  }

  /**
   * 映射数据库记录到 PaymentRecord
   */
  private mapToPaymentRecord(record: typeof payment.$inferSelect): PaymentRecord {
    return {
      id: record.id,
      priceId: record.priceId,
      type: record.type as PaymentType,
      interval: record.interval as PaymentInterval,
      userId: record.userId,
      customerId: record.customerId,
      subscriptionId: record.subscriptionId || undefined,
      status: record.status as PaymentStatus,
      periodStart: record.periodStart || undefined,
      periodEnd: record.periodEnd || undefined,
      cancelAtPeriodEnd: record.cancelAtPeriodEnd || undefined,
      trialStart: record.trialStart || undefined,
      trialEnd: record.trialEnd || undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      provider: record.provider as 'stripe' | 'creem' | undefined,
    };
  }
}

// Export singleton instance
export const paymentRepository = new PaymentRepository();
