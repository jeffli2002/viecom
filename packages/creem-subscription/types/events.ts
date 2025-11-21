export type CreemEventType =
  | 'checkout.completed'
  | 'subscription.created'
  | 'subscription.active'
  | 'subscription.update'
  | 'subscription.canceled'
  | 'subscription.paid'
  | 'subscription.expired'
  | 'subscription.trial_will_end'
  | 'subscription.trial_ended'
  | 'subscription.paused'
  | 'payment.failed'
  | 'refund.created'
  | 'dispute.created';

export interface CreemWebhookEvent {
  id: string;
  type: CreemEventType;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface WebhookResult {
  success: boolean;
  message?: string;
  error?: string;
}
