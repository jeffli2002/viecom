export interface CreemApiConfig {
  apiKey: string;
  webhookSecret: string;
  testMode?: boolean;
  baseUrl?: string;
  timeout?: number;
}

export interface CheckoutRequest {
  productId: string;
  requestId?: string;
  successUrl: string;
  cancelUrl?: string;
  metadata?: Record<string, unknown>;
  customer?: {
    email: string;
    name?: string;
  };
}

export interface CheckoutResult {
  success: boolean;
  sessionId?: string;
  url?: string;
  error?: string;
}

export interface ApiResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
