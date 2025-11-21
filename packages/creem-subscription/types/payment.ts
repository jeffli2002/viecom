export interface PaymentRecord {
  id: string;
  provider: 'creem' | 'stripe';
  userId: string;
  customerId: string;
  subscriptionId?: string;
  priceId: string;
  productId?: string;
  planId?: string;
  status: string;
  interval?: 'month' | 'year';
  periodStart?: Date;
  periodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  trialStart?: Date;
  trialEnd?: Date;
  scheduledPlanId?: string;
  scheduledInterval?: 'month' | 'year';
  scheduledPeriodStart?: Date;
  scheduledPeriodEnd?: Date;
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentInput {
  id?: string;
  provider: 'creem' | 'stripe';
  userId: string;
  customerId: string;
  subscriptionId?: string;
  priceId: string;
  productId?: string;
  planId?: string;
  status: string;
  interval?: 'month' | 'year';
  periodStart?: Date;
  periodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  trialStart?: Date;
  trialEnd?: Date;
}

export interface UpdatePaymentInput {
  priceId?: string;
  productId?: string;
  planId?: string;
  status?: string;
  interval?: 'month' | 'year';
  periodStart?: Date;
  periodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  trialStart?: Date;
  trialEnd?: Date;
  scheduledPlanId?: string | null;
  scheduledInterval?: 'month' | 'year' | null;
  scheduledPeriodStart?: Date | null;
  scheduledPeriodEnd?: Date | null;
  scheduledAt?: Date | null;
}

export interface PaymentEvent {
  id: string;
  paymentId: string;
  eventType: string;
  eventId: string;
  provider: 'creem' | 'stripe';
  eventData?: string;
  createdAt: Date;
}

export interface CreatePaymentEventInput {
  paymentId: string;
  eventType: string;
  eventId: string;
  provider: 'creem' | 'stripe';
  eventData?: string;
}
