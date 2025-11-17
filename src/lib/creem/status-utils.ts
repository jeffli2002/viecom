import type { PaymentStatus } from '@/payment/types';

/**
 * Normalize Creem subscription statuses to the PaymentStatus union used internally.
 * Creem can return values like "trial", "trialling", "cancelled", etc.
 */
export function normalizeCreemStatus(status?: string | null): PaymentStatus {
  const value = (status || '').toString().trim().toLowerCase();

  if (!value) {
    return 'active';
  }

  if (value.includes('trial')) {
    return 'trialing';
  }

  if (value.includes('cancel')) {
    return 'canceled';
  }

  if (value.includes('past')) {
    return 'past_due';
  }

  if (value.includes('unpaid')) {
    return 'unpaid';
  }

  if (value.includes('incomplete') && value.includes('expired')) {
    return 'incomplete_expired';
  }

  if (value.includes('incomplete')) {
    return 'incomplete';
  }

  if (value.includes('paused')) {
    return 'paused';
  }

  if (value.includes('pending')) {
    return 'incomplete';
  }

  if (value.includes('expired') || value.includes('ended')) {
    return 'canceled';
  }

  if (value.includes('active')) {
    return 'active';
  }

  return 'active';
}
