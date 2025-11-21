export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'canceled'
  | 'past_due'
  | 'unpaid'
  | 'paused'
  | 'incomplete'
  | 'incomplete_expired';

export type BillingInterval = 'month' | 'year';

export interface Subscription {
  id: string;
  userId: string;
  customerId: string;
  subscriptionId: string;
  planId: string;
  productId?: string;
  priceId: string;
  status: SubscriptionStatus;
  interval: BillingInterval;
  periodStart?: Date;
  periodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  trialStart?: Date;
  trialEnd?: Date;
  scheduledPlanId?: string;
  scheduledInterval?: BillingInterval;
  scheduledPeriodStart?: Date;
  scheduledPeriodEnd?: Date;
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubscriptionParams {
  userId: string;
  userEmail: string;
  planId: string;
  interval: BillingInterval;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, unknown>;
}

export interface UpgradeSubscriptionParams {
  subscriptionId: string;
  newPlanId: string;
  newInterval: BillingInterval;
  useProration?: boolean;
}

export interface DowngradeSubscriptionParams {
  subscriptionId: string;
  newPlanId: string;
  newInterval: BillingInterval;
  scheduleAtPeriodEnd?: boolean;
}

export interface SubscriptionResult {
  success: boolean;
  subscription?: Subscription;
  error?: string;
}
