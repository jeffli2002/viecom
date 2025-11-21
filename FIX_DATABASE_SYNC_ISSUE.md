# Fix: Database/Creem Sync Issue

## Problem Identified

**Database State**: `sub_6IW1jzFGNaN8FdSrOaA3at` shows as `active`  
**Creem State**: `sub_6IW1jzFGNaN8FdSrOaA3at` is `canceled`

This mismatch happens when:
1. Subscription was canceled in Creem dashboard directly
2. Webhook wasn't received or processed
3. Manual cancellation without updating database

## Immediate Fix

### Step 1: Sync Database with Creem Reality

Run this in Neon SQL Editor:

```sql
-- Mark the subscription as canceled to match Creem
UPDATE payment
SET 
    status = 'canceled',
    cancel_at_period_end = false,
    updated_at = NOW()
WHERE subscription_id = 'sub_6IW1jzFGNaN8FdSrOaA3at';

-- Verify it's updated
SELECT 
    subscription_id,
    status,
    price_id,
    updated_at
FROM payment
WHERE subscription_id = 'sub_6IW1jzFGNaN8FdSrOaA3at';
```

Expected result: `status` should now be `'canceled'`

### Step 2: Create a New Active Subscription

Now you need an active subscription to test upgrades.

**Option A: Via Application (Recommended)**

1. Go to: `http://localhost:3000/pricing`
2. Click **"Choose Pro"** ($14.9/month)
3. Complete Creem checkout with test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/30` (any future date)
   - CVC: `123`
   - ZIP: `12345`
4. After successful payment, you'll be redirected back
5. New subscription will be created in database

**Option B: Check Creem Dashboard First**

If there's already an active Pro subscription in Creem that's not in your database:

1. Go to Creem Dashboard → Subscriptions
2. Find any active Pro subscription
3. Copy its subscription ID (e.g., `sub_xyz123...`)
4. Create record in database:

```sql
-- Insert existing Creem subscription into database
INSERT INTO payment (
    id,
    subscription_id,
    provider,
    price_id,
    product_id,
    type,
    interval,
    user_id,
    customer_id,
    status,
    period_start,
    period_end,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid()::text,
    'ACTUAL_CREEM_SUBSCRIPTION_ID',  -- Replace with real ID from Creem dashboard
    'creem',
    'pro',
    'prod_kUzMsZPgszRro3jOiUrfd',
    'subscription',
    'month',
    'myZwkau1DoG2GXcibytBYmmwRXX8Mw6L',
    'CREEM_CUSTOMER_ID',  -- Get from Creem dashboard
    'active',
    NOW(),
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW()
);
```

### Step 3: Verify New Subscription

```sql
-- Check for active subscriptions
SELECT 
    subscription_id,
    status,
    price_id,
    provider,
    created_at,
    period_end
FROM payment
WHERE user_id = 'myZwkau1DoG2GXcibytBYmmwRXX8Mw6L'
  AND status IN ('active', 'trialing')
ORDER BY created_at DESC;
```

Expected: 1 row with `status = 'active'` and new `subscription_id`

### Step 4: Test Upgrade Flow

1. Refresh `/settings/billing`
2. Should show Pro as current plan
3. Click **"Upgrade to Pro+"**
4. Should succeed and show purple notice

---

## Root Cause: Webhook Not Processed

The subscription was canceled but webhook didn't update your database.

### Check Webhook Logs

Look for Creem webhook events in your logs:

```bash
# In your terminal, search for:
grep -r "subscription.canceled" .
grep -r "Creem.*webhook" .
```

### Verify Webhook Endpoint

1. **Check Creem Dashboard**:
   - Go to Settings → Webhooks
   - Verify endpoint: `http://localhost:3000/api/webhooks/creem` (for dev)
   - Production should be: `https://yourdomain.com/api/webhooks/creem`

2. **Test webhook locally**:
   ```bash
   # Use ngrok to expose localhost
   ngrok http 3000
   
   # Update Creem webhook URL to ngrok URL:
   # https://abc123.ngrok.io/api/webhooks/creem
   ```

### Check Webhook Handler

File: `src/app/api/webhooks/creem/route.ts`

Make sure it handles cancellation:

```typescript
case 'subscription.canceled':
case 'subscription.cancelled':  // Both spellings
  await paymentRepository.update(payment.id, {
    status: 'canceled',
    cancelAtPeriodEnd: false,
  });
  break;
```

---

## Prevention: Auto-Sync Script

Create a script to periodically sync subscription status:

**File**: `scripts/sync-creem-subscriptions.ts`

```typescript
import { paymentRepository } from '@/server/db/repositories/payment-repository';
import { creemService } from '@/lib/creem/creem-service';

async function syncSubscriptions() {
  // Get all active subscriptions from database
  const dbSubscriptions = await paymentRepository.findSubscriptionByUserAndStatus(
    'all', 
    ['active', 'trialing']
  );

  for (const dbSub of dbSubscriptions) {
    if (!dbSub.subscriptionId) continue;

    // Check status in Creem
    const creemResult = await creemService.getSubscription(dbSub.subscriptionId);
    
    if (!creemResult.success) {
      console.log(`Failed to fetch ${dbSub.subscriptionId} from Creem`);
      continue;
    }

    const creemStatus = creemResult.subscription?.status;
    
    // If Creem says canceled but DB says active
    if (creemStatus === 'canceled' && dbSub.status === 'active') {
      console.log(`Syncing ${dbSub.subscriptionId}: active → canceled`);
      await paymentRepository.update(dbSub.id, {
        status: 'canceled',
      });
    }
  }
}

syncSubscriptions().catch(console.error);
```

Run it occasionally:
```bash
pnpm tsx scripts/sync-creem-subscriptions.ts
```

---

## Summary of Actions

1. ✅ **Mark old subscription as canceled** in database
2. ⏳ **Create new active subscription** via pricing page
3. ⏳ **Test upgrade** to Pro+
4. ⏳ **Verify webhook endpoint** is configured correctly
5. ⏳ **Check webhook handler** processes cancellation events

After Step 2, the upgrade flow will work perfectly! 🚀

---

## Quick Commands Reference

**Mark as canceled:**
```sql
UPDATE payment SET status = 'canceled' 
WHERE subscription_id = 'sub_6IW1jzFGNaN8FdSrOaA3at';
```

**Check active subscriptions:**
```sql
SELECT subscription_id, status, price_id 
FROM payment 
WHERE user_id = 'myZwkau1DoG2GXcibytBYmmwRXX8Mw6L' 
  AND status = 'active';
```

**Create new subscription:**
Go to `http://localhost:3000/pricing` → Choose Pro → Checkout
