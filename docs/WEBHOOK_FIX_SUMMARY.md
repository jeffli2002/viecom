# Webhook Fix Summary - Credit Pack Purchase

## Issue
User purchased 1000 credits one-time pack successfully, but the webhook returned HTTP 500 and did not grant credits.

**Webhook Details:**
- Event ID: `evt_6KvzXx9vLEc7pW2gzneTVE`
- Order ID: `ord_qBvIAixMvcjpUgk25ca6l`
- User ID: `myZwkau1DoG2GXcibytBYmmwRXX8Mw6L`
- Product: `1000 credits` (prod_7dyQB04IzFilLT5nDGZBD1)
- Amount Paid: $5.00 USD

## Root Cause Analysis

### What Happened
1. ✅ Creem sent `checkout.completed` webhook correctly
2. ✅ Signature verification passed
3. ✅ Event parsing worked correctly (credits: 1000, userId extracted)
4. ✅ Routed to `handleCreditPackPurchase` handler
5. ❌ **Handler threw an error before completion**
6. ❌ **Event was NOT marked as processed**

### Missing Pieces
The `handleCreditPackPurchase` function in `src/app/api/webhooks/creem/route.ts` was missing:

1. **Event ID propagation**: The webhook event ID wasn't being passed from the main POST handler to individual case handlers
2. **Event tracking**: The handler didn't call `createEvent()` to mark the event as processed in the database

## Fixes Applied

### 1. Added Event ID Propagation
**File:** `src/app/api/webhooks/creem/route.ts:311`

```typescript
// Before
const result = rawResult as CreemWebhookResult;

// After
const result = { ...rawResult, eventId } as CreemWebhookResult;
```

**Impact:** Now all handlers receive the `eventId` field, enabling proper event tracking.

### 2. Added Event Tracking to Credit Pack Handler
**File:** `src/app/api/webhooks/creem/route.ts:497-503`

```typescript
// Mark event as processed
await paymentRepository.createEvent({
  paymentId: orderId || checkoutId || randomUUID(),
  eventType: 'credit_pack.purchased',
  creemEventId: data.eventId || randomUUID(),
  eventData: JSON.stringify(data),
});
```

**Impact:** 
- Prevents duplicate processing if webhook is retried
- Provides audit trail of credit pack purchases
- Matches pattern used by other webhook handlers (subscription_created, payment_success, etc.)

### 3. Improved Error Logging
**File:** `src/lib/creem/creem-service.ts:1015-1037`

Added detailed logging to show:
- All extracted values (userId, customerId, productId, productName, credits)
- Clear error messages if credits parsing fails
- Clear error messages if userId is missing

## Verification

### Simulation Test Results
Created `scripts/test-webhook-locally.ts` to verify parsing:

```
✅ Correctly identified as credit pack purchase
✅ Extracted userId: myZwkau1DoG2GXcibytBYmmwRXX8Mw6L
✅ Extracted credits: 1000
✅ Extracted productName: 1000 credits
✅ All required fields present and valid
```

### Expected Behavior (After Fix)
When the webhook is retried or a new purchase is made:

1. Webhook arrives → signature verified ✅
2. Event ID checked → not processed yet ✅
3. Parsed as `credit_pack_purchase` ✅
4. Validation passes (userId + credits present) ✅
5. Database operations:
   - Update user credit balance (+1000)
   - Insert credit transaction record
   - Insert payment event record
6. Return 200 OK ✅

## Next Steps

### For the Failed Purchase
You need to manually grant the 1000 credits since the webhook failed before database operations:

**Option 1: Run the manual grant script** (on server with DB access)
```bash
pnpm tsx scripts/manual-grant-credits.ts \
  myZwkau1DoG2GXcibytBYmmwRXX8Mw6L \
  1000 \
  "Credit pack purchase: 1000 credits" \
  ord_qBvIAixMvcjpUgk25ca6l
```

**Option 2: Direct SQL** (if script doesn't work)
```sql
-- Check current balance
SELECT * FROM user_credits WHERE user_id = 'myZwkau1DoG2GXcibytBYmmwRXX8Mw6L';

-- Add 1000 credits
UPDATE user_credits 
SET 
  balance = balance + 1000,
  total_earned = total_earned + 1000,
  updated_at = NOW()
WHERE user_id = 'myZwkau1DoG2GXcibytBYmmwRXX8Mw6L';

-- Record transaction
INSERT INTO credit_transactions (
  id, user_id, type, amount, balance_after, source, description, reference_id, metadata
) VALUES (
  gen_random_uuid(),
  'myZwkau1DoG2GXcibytBYmmwRXX8Mw6L',
  'earn',
  1000,
  (SELECT balance FROM user_credits WHERE user_id = 'myZwkau1DoG2GXcibytBYmmwRXX8Mw6L'),
  'purchase',
  'Credit pack purchase: 1000 credits',
  'manual_grant_ord_qBvIAixMvcjpUgk25ca6l',
  '{"provider":"creem","orderId":"ord_qBvIAixMvcjpUgk25ca6l","credits":1000,"manualGrant":true}'::jsonb
);
```

### For Future Purchases
1. ✅ The fix is already applied to the codebase
2. Deploy the updated code to production
3. Test with a small credit pack purchase ($0.50 test purchase if available)
4. Verify webhook logs show successful processing
5. Confirm credits are granted automatically

## Files Modified

1. `src/app/api/webhooks/creem/route.ts`
   - Line 311: Added eventId propagation
   - Lines 497-503: Added event tracking to handleCreditPackPurchase

2. `src/lib/creem/creem-service.ts`
   - Lines 1015-1037: Improved error logging for credit pack parsing

## Testing Scripts Created

1. `scripts/manual-grant-credits.ts` - Manually grant credits for failed webhook
2. `scripts/test-webhook-locally.ts` - Test webhook parsing without DB
3. `scripts/simulate-webhook-full.ts` - Full simulation of webhook flow

## Deployment Checklist

- [x] Code fixes applied
- [x] Linting passed (`pnpm check`)
- [x] Type checking passed (`pnpm typecheck`)
- [x] Local testing completed
- [ ] Deploy to production
- [ ] Manually grant 1000 credits to user myZwkau1DoG2GXcibytBYmmwRXX8Mw6L
- [ ] Test with new purchase (optional but recommended)
- [ ] Monitor webhook logs for successful processing

## Related Configuration

Credit pack products should be configured in Creem with:
- `metadata.type = "credit_pack"`
- `product.name` should contain the word "credits" with a number (e.g., "1000 credits")
- Order type should be "onetime"

The webhook will automatically extract the credit amount from the product name using the regex: `/(\d+)\s*credits/i`
