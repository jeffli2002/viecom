# Webhook Issue Diagnosis - Credit Pack Purchase Failed

## Incident Details
- **User**: promodkc@gmail.com (Pramod)
- **Purchase**: 200 credit pack ($9.9 USD)
- **Status in Creem**: ✅ Successful
- **Status in Database**: ❌ Not recorded
- **Resolution**: Manual credit grant + email sent

---

## Root Cause Investigation

### Potential Failure Points

#### 1. **Webhook Signature Verification**
**Location**: `src/app/api/webhooks/creem/route.ts:175-179`

```typescript
const isValid = creemService.verifyWebhookSignature(body, signature);
if (!isValid) {
  console.error('[Creem Webhook] Invalid signature', { requestId, forwardedFor, userAgent });
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

**Possible Issues**:
- Signature header mismatch (`x-creem-signature` vs `creem-signature`)
- Webhook secret mismatch
- Body parsing issue

---

#### 2. **Event Processing Logic**
**Location**: `src/app/api/webhooks/creem/route.ts:218-220`

```typescript
case 'credit_pack_purchase':
  await handleCreditPackPurchase(result);
  break;
```

**Flow**:
1. Creem sends `checkout.completed` event
2. CreemService.handleWebhookEvent() parses it
3. Returns `{ type: 'credit_pack_purchase', ... }`
4. Route handler calls `handleCreditPackPurchase()`

**Possible Issues**:
- Event type not correctly identified as credit pack purchase
- Missing userId or credits in webhook payload
- Handler threw exception before completing

---

#### 3. **Credit Pack Identification**
**Location**: `src/app/api/webhooks/creem/route.ts:320-327`

```typescript
const creditPack = getCreditPackByIdentifier(productId, credits);

if (!creditPack) {
  console.warn(
    `[Creem Webhook] Credit pack not found for product ${productId} or ${credits} credits, using provided values`
  );
}
```

**Possible Issues**:
- Product ID doesn't match `NEXT_PUBLIC_CREEM_PRICE_PACK_200` env var
- Credit amount parsing failed from product name
- Configuration mismatch

---

#### 4. **Database Transaction**
**Location**: `src/app/api/webhooks/creem/route.ts:428-485`

**Possible Issues**:
- Database connection timeout
- Duplicate referenceId constraint violation
- Transaction rollback due to error

---

#### 5. **Duplicate Prevention**
**Location**: `src/app/api/webhooks/creem/route.ts:185-201`

```typescript
const isProcessed = await paymentRepository.isCreemEventProcessed(eventId);

if (isProcessed) {
  console.log('[Creem Webhook] Event already processed', { eventType, eventId, requestId });
  return NextResponse.json({ received: true });
}
```

**Note**: This should not be the issue for first-time processing, but could prevent retries.

---

## Diagnostic Checklist

### Environment Configuration
- [ ] Verify `NEXT_PUBLIC_CREEM_PRICE_PACK_200` env var matches Creem product key
- [ ] Verify `CREEM_WEBHOOK_SECRET` is correctly set
- [ ] Check if webhook endpoint is publicly accessible
- [ ] Confirm `DATABASE_URL` is working

### Creem Dashboard
- [ ] Check if webhook URL is correctly configured
- [ ] Verify webhook secret matches
- [ ] Check webhook delivery logs for this event
- [ ] Look for any error messages or retry attempts

### Application Logs
- [ ] Search for webhook event ID in logs
- [ ] Check for error messages around purchase timestamp
- [ ] Look for database connection errors
- [ ] Check for any 401/500 responses

### Database
- [ ] Query `credit_transactions` table for any failed attempts
- [ ] Check `creditPackPurchase` table for partial records
- [ ] Look for any transaction logs around the time

---

## Prevention Measures

### 1. **Enhanced Webhook Logging**

Add more detailed logging at each step:

```typescript
export async function handleCreditPackPurchase(data: CreemWebhookData) {
  console.log('[Creem Webhook] START handleCreditPackPurchase', {
    timestamp: new Date().toISOString(),
    userId: data.userId,
    credits: data.credits,
    productId: data.productId,
    orderId: data.orderId,
    checkoutId: data.checkoutId,
    fullData: JSON.stringify(data),
  });

  try {
    // ... existing logic ...
    
    console.log('[Creem Webhook] SUCCESS handleCreditPackPurchase', {
      timestamp: new Date().toISOString(),
      userId: data.userId,
      credits: data.credits,
      newBalance,
    });
  } catch (error) {
    console.error('[Creem Webhook] FAILED handleCreditPackPurchase', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : String(error),
      data,
    });
    throw error;
  }
}
```

### 2. **Webhook Monitoring Dashboard**

Create admin endpoint to view webhook status:
- Recent webhook events
- Failed webhooks
- Retry status
- Processing time metrics

### 3. **Webhook Retry Mechanism**

If webhook fails:
1. Log to database with error details
2. Send alert to admin
3. Allow manual retry from admin panel
4. Auto-retry with exponential backoff

### 4. **Health Check Endpoint**

Add `/api/webhooks/creem/health` endpoint:
- Test signature verification
- Test database connection
- Test email service
- Return diagnostic info

### 5. **Alerting System**

Set up alerts for:
- Webhook failures (>5% failure rate)
- Database errors
- Email sending failures
- Credit pack purchases not processed within 5 minutes

---

## Immediate Actions Needed

### 1. Check Creem Dashboard
```
1. Go to Creem Dashboard → Settings → Webhooks
2. Find recent webhook deliveries
3. Look for promodkc@gmail.com purchase
4. Check delivery status and response code
5. Copy webhook event ID and payload
```

### 2. Search Application Logs
```bash
# If using Vercel
vercel logs --since 1d | grep -i "promodkc\|credit_pack"

# If using local logs
grep -r "promodkc" logs/
grep -r "credit_pack_purchase" logs/
```

### 3. Verify Environment Variables
```bash
# Check if CREEM_PRICE_PACK_200 is set
echo $NEXT_PUBLIC_CREEM_PRICE_PACK_200

# Verify webhook secret is set
# (Don't echo the secret, just check if it exists)
[ -n "$CREEM_WEBHOOK_SECRET" ] && echo "Secret is set" || echo "Secret is missing"
```

### 4. Test Webhook Endpoint
```bash
# From your local machine or Vercel logs
curl -X POST https://your-domain.com/api/webhooks/creem \
  -H "Content-Type: application/json" \
  -H "x-creem-signature: test" \
  -d '{"type":"test"}'

# Should get 401 if signature verification works
# Should not get 404 or 500
```

---

## Configuration Verification

### 1. Payment Config
Check `src/config/payment.config.ts`:

```typescript
creditPacks: [
  {
    id: 'pack-200',
    name: '200 Credits',
    credits: 200,
    price: 9.9,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PACK_200 || 'price_pack_200',
    creemProductKey: process.env.NEXT_PUBLIC_CREEM_PRICE_PACK_200 || '',
    badge: 'Starter',
  },
]
```

**Action**: Verify `process.env.NEXT_PUBLIC_CREEM_PRICE_PACK_200` matches Creem product ID

### 2. Webhook Secret
Check `.env.local` or production environment:

```bash
CREEM_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

**Action**: Ensure this matches the secret in Creem Dashboard

### 3. Webhook URL
In Creem Dashboard:

```
https://your-domain.com/api/webhooks/creem
```

**Action**: Ensure this URL is publicly accessible and not behind authentication

---

## Testing Strategy

### 1. Create Test Webhook Script

```typescript
// test-credit-pack-webhook.ts
import { POST } from './src/app/api/webhooks/creem/route';

const mockRequest = {
  text: async () => JSON.stringify({
    id: 'evt_test',
    eventType: 'checkout.completed',
    data: {
      checkout: {
        customer: { id: 'cus_test', email: 'test@example.com' },
        metadata: { userId: 'test_user_id', type: 'credit_pack' },
        order: {
          id: 'ord_test',
          amount_paid: 990,
          currency: 'USD',
          product: {
            id: 'prod_test',
            name: '200 credits',
          },
        },
      },
    },
  }),
  headers: new Headers({
    'x-creem-signature': 'test_signature',
  }),
};

// Test the endpoint
await POST(mockRequest as any);
```

### 2. Monitor Next Webhook

After fixing, monitor the next credit pack purchase closely:
1. Check logs immediately after purchase
2. Verify database records
3. Confirm email is sent
4. Check user sees updated balance

---

## Recommended Next Steps

1. **Immediate**: Check Creem Dashboard webhook delivery logs
2. **Short-term**: Add enhanced logging to webhook handler
3. **Medium-term**: Create webhook monitoring dashboard
4. **Long-term**: Implement automated alerting and retry system

---

## Related Files

- `src/app/api/webhooks/creem/route.ts` - Main webhook handler
- `src/lib/creem/creem-service.ts` - Creem service with signature verification
- `src/config/payment.config.ts` - Credit pack configuration
- `src/lib/email/index.ts` - Email sending service
- `src/server/db/repositories/payment-repository.ts` - Database operations

---

**Date**: December 5, 2025
**Status**: Issue Resolved (Manual Intervention)
**Next Action**: Investigate webhook delivery logs

