import { randomUUID } from 'node:crypto';
import type { PaymentInterval, PaymentRecord, PaymentStatus, PaymentType } from '@/payment/types';
import { db } from '@/server/db';
import { payment, paymentEvent } from '@/server/db/schema';
import { and, desc, eq, inArray, not, sql } from 'drizzle-orm';

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
  productId?: string;
  status?: PaymentStatus;
  subscriptionId?: string;
  periodStart?: Date;
  periodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  trialStart?: Date;
  trialEnd?: Date;
  interval?: PaymentInterval | null;
  // Scheduled upgrade fields (方案2: 单条记录+字段)
  scheduledPlanId?: string | null;
  scheduledInterval?: PaymentInterval | null;
  scheduledPeriodStart?: Date | null;
  scheduledPeriodEnd?: Date | null;
  scheduledAt?: Date | null;
}

export interface CreatePaymentEventData {
  paymentId: string;
  eventType: string;
  stripeEventId?: string;
  creemEventId?: string;
  eventData?: string;
}

export interface PaymentEventRecord {
  id: string;
  paymentId: string;
  eventType: string;
  eventData: string | null;
  stripeEventId?: string | null;
  creemEventId?: string | null;
  createdAt: Date;
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
    // Explicitly select columns to avoid errors if scheduled columns don't exist yet
    const result = await db
      .select({
        id: payment.id,
        provider: payment.provider,
        priceId: payment.priceId,
        productId: payment.productId,
        type: payment.type,
        interval: payment.interval,
        userId: payment.userId,
        customerId: payment.customerId,
        subscriptionId: payment.subscriptionId,
        status: payment.status,
        periodStart: payment.periodStart,
        periodEnd: payment.periodEnd,
        cancelAtPeriodEnd: payment.cancelAtPeriodEnd,
        trialStart: payment.trialStart,
        trialEnd: payment.trialEnd,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        // Scheduled fields
        scheduledPlanId: payment.scheduledPlanId,
        scheduledInterval: payment.scheduledInterval,
        scheduledPeriodStart: payment.scheduledPeriodStart,
        scheduledPeriodEnd: payment.scheduledPeriodEnd,
        scheduledAt: payment.scheduledAt,
      })
      .from(payment)
      .where(eq(payment.id, id))
      .limit(1);

    return result[0] ? this.mapToPaymentRecord(result[0]) : null;
  }

  /**
   * Get payment records by user ID
   */
  async findByUserId(userId: string): Promise<PaymentRecord[]> {
    // Explicitly select columns to avoid errors if scheduled columns don't exist yet
    const results = await db
      .select({
        id: payment.id,
        provider: payment.provider,
        priceId: payment.priceId,
        productId: payment.productId,
        type: payment.type,
        interval: payment.interval,
        userId: payment.userId,
        customerId: payment.customerId,
        subscriptionId: payment.subscriptionId,
        status: payment.status,
        periodStart: payment.periodStart,
        periodEnd: payment.periodEnd,
        cancelAtPeriodEnd: payment.cancelAtPeriodEnd,
        trialStart: payment.trialStart,
        trialEnd: payment.trialEnd,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        // Scheduled fields
        scheduledPlanId: payment.scheduledPlanId,
        scheduledInterval: payment.scheduledInterval,
        scheduledPeriodStart: payment.scheduledPeriodStart,
        scheduledPeriodEnd: payment.scheduledPeriodEnd,
        scheduledAt: payment.scheduledAt,
      })
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
    // Explicitly select columns to avoid errors if scheduled columns don't exist yet
    const results = await db
      .select({
        id: payment.id,
        provider: payment.provider,
        priceId: payment.priceId,
        productId: payment.productId,
        type: payment.type,
        interval: payment.interval,
        userId: payment.userId,
        customerId: payment.customerId,
        subscriptionId: payment.subscriptionId,
        status: payment.status,
        periodStart: payment.periodStart,
        periodEnd: payment.periodEnd,
        cancelAtPeriodEnd: payment.cancelAtPeriodEnd,
        trialStart: payment.trialStart,
        trialEnd: payment.trialEnd,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        // Scheduled fields
        scheduledPlanId: payment.scheduledPlanId,
        scheduledInterval: payment.scheduledInterval,
        scheduledPeriodStart: payment.scheduledPeriodStart,
        scheduledPeriodEnd: payment.scheduledPeriodEnd,
        scheduledAt: payment.scheduledAt,
      })
      .from(payment)
      .where(eq(payment.customerId, customerId))
      .orderBy(desc(payment.createdAt));

    return results.map(this.mapToPaymentRecord);
  }

  /**
   * 获取用户的活跃订阅
   * Returns active subscriptions even if cancelAtPeriodEnd is true,
   * as the user still has access until the period ends
   */
  async findActiveSubscriptionByUserId(userId: string): Promise<PaymentRecord | null> {
    // Explicitly select columns to avoid errors if scheduled columns don't exist yet
    const results = await db
      .select({
        id: payment.id,
        provider: payment.provider,
        priceId: payment.priceId,
        productId: payment.productId,
        type: payment.type,
        interval: payment.interval,
        userId: payment.userId,
        customerId: payment.customerId,
        subscriptionId: payment.subscriptionId,
        status: payment.status,
        periodStart: payment.periodStart,
        periodEnd: payment.periodEnd,
        cancelAtPeriodEnd: payment.cancelAtPeriodEnd,
        trialStart: payment.trialStart,
        trialEnd: payment.trialEnd,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        // Scheduled fields
        scheduledPlanId: payment.scheduledPlanId,
        scheduledInterval: payment.scheduledInterval,
        scheduledPeriodStart: payment.scheduledPeriodStart,
        scheduledPeriodEnd: payment.scheduledPeriodEnd,
        scheduledAt: payment.scheduledAt,
      })
      .from(payment)
      .where(
        and(
          eq(payment.userId, userId),
          eq(payment.type, 'subscription'),
          inArray(payment.status, ['active', 'trialing', 'past_due'])
        )
      )
      .orderBy(desc(payment.createdAt));

    // Return the most recent active subscription, even if cancelAtPeriodEnd is true
    // because the user still has access until the period ends
    const activeSubscription = results[0];

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
    if (data.productId !== undefined) updateData.productId = data.productId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.subscriptionId !== undefined) updateData.subscriptionId = data.subscriptionId;
    if (data.periodStart !== undefined) updateData.periodStart = data.periodStart;
    if (data.periodEnd !== undefined) updateData.periodEnd = data.periodEnd;
    if (data.cancelAtPeriodEnd !== undefined) updateData.cancelAtPeriodEnd = data.cancelAtPeriodEnd;
    if (data.trialStart !== undefined) updateData.trialStart = data.trialStart;
    if (data.trialEnd !== undefined) updateData.trialEnd = data.trialEnd;
    if (data.interval !== undefined) updateData.interval = data.interval;
    // Scheduled upgrade fields (方案2: 单条记录+字段)
    if (data.scheduledPlanId !== undefined) updateData.scheduledPlanId = data.scheduledPlanId;
    if (data.scheduledInterval !== undefined) updateData.scheduledInterval = data.scheduledInterval;
    if (data.scheduledPeriodStart !== undefined)
      updateData.scheduledPeriodStart = data.scheduledPeriodStart;
    if (data.scheduledPeriodEnd !== undefined)
      updateData.scheduledPeriodEnd = data.scheduledPeriodEnd;
    if (data.scheduledAt !== undefined) updateData.scheduledAt = data.scheduledAt;

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
   * Checks both payment_event table (for subscriptions) and credit_transactions table (for credit packs)
   */
  async isCreemEventProcessed(creemEventId: string): Promise<boolean> {
    try {
      // Check payment_event table (for subscription events)
      const paymentEventResult = await db
        .select()
        .from(paymentEvent)
        .where(eq(paymentEvent.creemEventId, creemEventId))
        .limit(1);

      if (paymentEventResult.length > 0) {
        return true;
      }

      // Check credit_transactions table (for credit pack purchases)
      // Credit pack purchases store creemEventId in metadata JSON
      // metadata is stored as text (JSON string), so we can search directly
      const { creditTransactions } = await import('@/server/db/schema');

      // Escape special characters in creemEventId for LIKE pattern
      const escapedEventId = creemEventId.replace(/[%_\\]/g, '\\$&');
      const searchPattern = `%"creemEventId":"${escapedEventId}"%`;

      try {
        const creditTransactionResult = await db
          .select()
          .from(creditTransactions)
          .where(sql`${creditTransactions.metadata} LIKE ${searchPattern}`)
          .limit(1);

        return creditTransactionResult.length > 0;
      } catch (queryError) {
        // If query fails, log but don't throw - allow webhook to proceed
        console.error('[PaymentRepository] Error querying credit_transactions for creemEventId:', {
          creemEventId,
          error: queryError instanceof Error ? queryError.message : String(queryError),
        });
        return false;
      }
    } catch (error) {
      // If there's an error checking credit_transactions, log it but don't fail
      // This allows the webhook to proceed even if the check fails
      console.error('[PaymentRepository] Error checking isCreemEventProcessed:', {
        creemEventId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Return false to allow processing (fail open for credit pack purchases)
      // The duplicate check in handleCreditPackPurchase will catch duplicates
      return false;
    }
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
   * Cancel all other active subscriptions for a user except the specified payment ID
   * This ensures only ONE active subscription per user at any time
   */
  async cancelOtherActiveSubscriptions(userId: string, keepPaymentId: string): Promise<void> {
    const otherSubs = await db
      .select()
      .from(payment)
      .where(
        and(
          eq(payment.userId, userId),
          eq(payment.type, 'subscription'),
          not(eq(payment.id, keepPaymentId)),
          inArray(payment.status, ['active', 'trialing', 'past_due'])
        )
      );

    if (otherSubs.length > 0) {
      console.log(
        `[PaymentRepository] Canceling ${otherSubs.length} other active subscription(s) for user ${userId}`
      );

      for (const sub of otherSubs) {
        console.log(
          `  - Canceling ${sub.subscriptionId || sub.id} (${sub.priceId}, status: ${sub.status})`
        );
      }
    }

    await db
      .update(payment)
      .set({
        status: 'canceled',
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(payment.userId, userId),
          eq(payment.type, 'subscription'),
          not(eq(payment.id, keepPaymentId)),
          inArray(payment.status, ['active', 'trialing', 'past_due'])
        )
      );
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
    // Only select id for counting
    const result = await db
      .select({ id: payment.id })
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
    // Only select id for existence check
    const result = await db
      .select({ id: payment.id })
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
   * Get count of active subscriptions for a user
   * Should always return 0 or 1 - if > 1, there's a data integrity issue
   */
  async getActiveSubscriptionCount(userId: string): Promise<number> {
    const result = await db
      .select({ id: payment.id })
      .from(payment)
      .where(
        and(
          eq(payment.userId, userId),
          eq(payment.type, 'subscription'),
          inArray(payment.status, ['active', 'trialing', 'past_due'])
        )
      );

    if (result.length > 1) {
      console.error(
        `[PaymentRepository] DATA INTEGRITY ISSUE: User ${userId} has ${result.length} active subscriptions!`
      );
    }

    return result.length;
  }

  /**
   * Enforce single active subscription rule
   * Returns true if enforcement was needed and applied
   */
  async enforceSingleActiveSubscription(userId: string): Promise<boolean> {
    const activeSubs = await db
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

    if (activeSubs.length <= 1) {
      return false;
    }

    console.warn(
      `[PaymentRepository] Enforcing single subscription rule for user ${userId}: found ${activeSubs.length} active subscriptions`
    );

    const keepSub = activeSubs[0];
    if (!keepSub) {
      console.warn(`[PaymentRepository] No active subscription to keep for user ${userId}`);
      return false;
    }
    const cancelSubs = activeSubs.slice(1);

    console.log(`  - Keeping: ${keepSub.subscriptionId} (${keepSub.priceId})`);

    for (const sub of cancelSubs) {
      console.log(`  - Canceling: ${sub.subscriptionId} (${sub.priceId})`);
      await this.update(sub.id, {
        status: 'canceled',
        cancelAtPeriodEnd: false,
      });
    }

    return true;
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

  async findLatestPlanChangeEvent(paymentId: string): Promise<PaymentEventRecord | null> {
    const result = await db
      .select()
      .from(paymentEvent)
      .where(
        and(
          eq(paymentEvent.paymentId, paymentId),
          inArray(paymentEvent.eventType, ['upgraded', 'updated', 'downgraded'])
        )
      )
      .orderBy(desc(paymentEvent.createdAt))
      .limit(1);

    return result[0] ? this.mapToPaymentEvent(result[0]) : null;
  }

  /**
   * 映射数据库记录到 PaymentRecord
   */
  private mapToPaymentRecord(record: typeof payment.$inferSelect): PaymentRecord {
    return {
      id: record.id,
      priceId: record.priceId,
      productId: record.productId || undefined,
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
      // Scheduled upgrade fields (方案2: 单条记录+字段)
      scheduledPlanId: record.scheduledPlanId || undefined,
      scheduledInterval: (record.scheduledInterval as PaymentInterval) || undefined,
      scheduledPeriodStart: record.scheduledPeriodStart || undefined,
      scheduledPeriodEnd: record.scheduledPeriodEnd || undefined,
      scheduledAt: record.scheduledAt || undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      provider: record.provider as 'stripe' | 'creem' | undefined,
    };
  }

  private mapToPaymentEvent(event: typeof paymentEvent.$inferSelect): PaymentEventRecord {
    return {
      id: event.id,
      paymentId: event.paymentId,
      eventType: event.eventType,
      eventData: event.eventData || null,
      stripeEventId: event.stripeEventId || null,
      creemEventId: event.creemEventId || null,
      createdAt: event.createdAt || new Date(0),
    };
  }
}

// Export singleton instance
export const paymentRepository = new PaymentRepository();
