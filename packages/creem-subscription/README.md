# @viecom/creem-subscription

Modular Creem subscription management for SaaS applications.

## Features

- ✅ **Framework-agnostic** core API client
- ✅ **Type-safe** with full TypeScript support
- ✅ **Automatic fallback** from SDK to direct API calls
- ✅ **Webhook signature verification**
- ✅ **Test/production mode auto-detection**
- ✅ **Configurable timeout and logging**

## Installation

```bash
npm install @viecom/creem-subscription
# or
pnpm add @viecom/creem-subscription
```

## Quick Start

```typescript
import { CreemApiClient } from '@viecom/creem-subscription';

// Initialize the client
const creem = new CreemApiClient({
  apiKey: process.env.CREEM_API_KEY!,
  webhookSecret: process.env.CREEM_WEBHOOK_SECRET!,
  // testMode: true,  // Optional: auto-detected from API key
  // timeout: 30000,   // Optional: request timeout in ms
});

// Create a checkout session
const result = await creem.createCheckout({
  productId: 'prod_xxx',
  successUrl: 'https://yourapp.com/success',
  customer: {
    email: 'user@example.com',
  },
  metadata: {
    userId: 'user_123',
    planId: 'pro',
  },
});

if (result.success) {
  // Redirect user to result.url
  console.log('Checkout URL:', result.url);
}

// Get subscription details
const subscription = await creem.getSubscription('sub_xxx');

// Cancel subscription
await creem.cancelSubscription('sub_xxx');

// Upgrade subscription
await creem.upgradeSubscription('sub_xxx', 'prod_new', {
  useProration: false,
});

// Generate customer portal link
const portal = await creem.generateCustomerPortalLink('cus_xxx', 'https://yourapp.com/billing');
```

## Webhook Handling

```typescript
import { CreemApiClient } from '@viecom/creem-subscription';

const creem = new CreemApiClient({
  apiKey: process.env.CREEM_API_KEY!,
  webhookSecret: process.env.CREEM_WEBHOOK_SECRET!,
});

// In your webhook endpoint
export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get('x-creem-signature') || '';

  // Verify signature
  if (!creem.verifyWebhookSignature(payload, signature)) {
    return new Response('Invalid signature', { status: 400 });
  }

  // Parse event
  const event = creem.parseWebhookEvent(payload);

  // Handle event
  switch (event.type) {
    case 'checkout.completed':
      // Handle checkout completion
      break;
    case 'subscription.created':
      // Handle subscription creation
      break;
    // ... other event types
  }

  return new Response('OK', { status: 200 });
}
```

## Configuration

### API Config

```typescript
interface CreemApiConfig {
  apiKey: string;              // Required: Your Creem API key
  webhookSecret: string;       // Required: Webhook signature secret
  testMode?: boolean;          // Optional: Auto-detected from API key
  baseUrl?: string;            // Optional: Custom API URL
  timeout?: number;            // Optional: Request timeout (default: 30000ms)
}
```

### Custom Logger

```typescript
import { CreemApiClient, Logger } from '@viecom/creem-subscription';

class MyLogger implements Logger {
  debug(message: string, ...args: unknown[]): void {
    // Custom debug logging
  }
  info(message: string, ...args: unknown[]): void {
    // Custom info logging
  }
  warn(message: string, ...args: unknown[]): void {
    // Custom warn logging
  }
  error(message: string, ...args: unknown[]): void {
    // Custom error logging
  }
}

const creem = new CreemApiClient(config, new MyLogger());
```

## API Reference

### `createCheckout(request: CheckoutRequest): Promise<CheckoutResult>`

Create a checkout session for subscription or one-time payment.

**Parameters:**
- `request.productId` - Creem product ID
- `request.successUrl` - Redirect URL after successful payment
- `request.cancelUrl` - (Optional) Redirect URL if user cancels
- `request.customer` - Customer information
- `request.metadata` - (Optional) Custom metadata

**Returns:**
- `success` - Boolean indicating success
- `sessionId` - Checkout session ID (if successful)
- `url` - Checkout URL to redirect user (if successful)
- `error` - Error message (if failed)

### `getSubscription(subscriptionId: string): Promise<ApiResult>`

Fetch subscription details by ID.

### `cancelSubscription(subscriptionId: string): Promise<ApiResult>`

Cancel an active subscription. Sets `cancel_at_period_end=true` in Creem.

### `upgradeSubscription(subscriptionId: string, newProductId: string, options?: { useProration?: boolean }): Promise<ApiResult>`

Upgrade subscription to a new product.

### `generateCustomerPortalLink(customerId: string, returnUrl: string): Promise<ApiResult<{ url: string }>>`

Generate a link to the customer portal where users can manage their subscription.

### `verifyWebhookSignature(payload: string, signature: string): boolean`

Verify webhook signature for security.

### `parseWebhookEvent(rawEvent: string): Record<string, unknown>`

Parse webhook event payload.

## Test Mode

The client automatically detects test mode from your API key:
- Keys starting with `creem_test_` → Test mode (uses `https://test-api.creem.io`)
- Keys starting with `creem_` (without `test_`) → Production mode (uses `https://api.creem.io`)

You can also explicitly set `testMode: true` in the configuration.

## Error Handling

All API methods return a result object with `success` boolean and optional `error` message:

```typescript
const result = await creem.createCheckout(request);

if (!result.success) {
  console.error('Error:', result.error);
  // Handle error
} else {
  console.log('Success:', result.sessionId, result.url);
}
```

For more detailed error information, catch `CreemApiError`:

```typescript
import { CreemApiError } from '@viecom/creem-subscription';

try {
  const result = await creem.createCheckout(request);
  if (!result.success) {
    throw new Error(result.error);
  }
} catch (error) {
  if (error instanceof CreemApiError) {
    console.error('Status:', error.statusCode);
    console.error('Response:', error.response);
  }
}
```

## License

MIT

## Support

For issues and feature requests, please open an issue on GitHub.
