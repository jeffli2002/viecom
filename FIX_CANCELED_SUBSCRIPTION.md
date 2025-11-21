# Fix: Canceled Subscription Blocking Upgrade

## Problem
The subscription `sub_6IW1jzFGNaN8FdSrOaA3at` is **canceled in Creem**, which causes the 403 Forbidden error.

Creem API won't allow upgrades on canceled subscriptions.

## Immediate Solution

### Option 1: Clean Up Database & Create New Subscription (Recommended)

**Step 1: Update database to remove canceled subscription**

Run in Neon SQL Editor:

```sql
-- Option A: Mark as canceled in your database
UPDATE payment
SET status = 'canceled'
WHERE subscription_id = 'sub_6IW1jzFGNaN8FdSrOaA3at';

-- Verify
SELECT 
    id,
    subscription_id,
    status,
    price_id
FROM payment
WHERE subscription_id = 'sub_6IW1jzFGNaN8FdSrOaA3at';
```

**Step 2: Create a new Pro subscription**

1. Go to your app: `http://localhost:3000/pricing`
2. Click **"Choose Pro"** plan
3. Complete the checkout flow in Creem
4. This will create a NEW active subscription

**Step 3: Test upgrade**

1. Go to `/settings/billing`
2. Click **"Upgrade to Pro+"**
3. Should work now! ✅

---

### Option 2: Reactivate the Subscription in Creem (If Possible)

**If the subscription just canceled:**

1. Go to Creem Dashboard
2. Find subscription `sub_6IW1jzFGNaN8FdSrOaA3at`
3. Look for "Reactivate" or "Uncancel" button
4. Click it to make subscription active again
5. Try upgrade again

**Note**: This only works if:
- Subscription just canceled (within grace period)
- Creem supports reactivation
- Subscription hasn't expired yet

---

### Option 3: Quick Test - Create Subscription Directly in Database

**For testing purposes only** - create a fake active subscription:

```sql
-- Create a test subscription record
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
    'test_sub_' || gen_random_uuid()::text,
    'test_sub_' || gen_random_uuid()::text,  -- Use same ID for testing
    'creem',
    'pro',
    'prod_kUzMsZPgszRro3jOiUrfd',
    'subscription',
    'month',
    'myZwkau1DoG2GXcibytBYmmwRXX8Mw6L',  -- Your user ID
    'test_customer_123',
    'active',
    NOW(),
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW()
);

-- Verify it was created
SELECT 
    id,
    subscription_id,
    status,
    price_id,
    period_end
FROM payment
WHERE user_id = 'myZwkau1DoG2GXcibytBYmmwRXX8Mw6L'
ORDER BY created_at DESC
LIMIT 1;
```

**⚠️ Warning**: This creates a fake subscription in your database only. It won't work with Creem's actual API, but you can test the UI flow.

---

## Why This Happened

The subscription was canceled in Creem but your database still shows it as `active`. This causes a mismatch.

### Prevent This in Future

Add webhook handling to sync cancellation status:

**File**: `src/app/api/webhooks/creem/route.ts`

Make sure it handles these events:
- `subscription.canceled`
- `subscription.expired`
- `subscription.paused`

And updates your database:

```typescript
case 'subscription.canceled':
  await paymentRepository.update(paymentRecord.id, {
    status: 'canceled',
    cancelAtPeriodEnd: false,
  });
  break;
```

---

## Recommended Steps (In Order)

1. **Clean up the database**:
   ```sql
   UPDATE payment
   SET status = 'canceled'
   WHERE subscription_id = 'sub_6IW1jzFGNaN8FdSrOaA3at';
   ```

2. **Go to pricing page**: `http://localhost:3000/pricing`

3. **Subscribe to Pro plan**:
   - Click "Choose Pro"
   - Complete Creem checkout
   - Make sure to use **test mode** credit card (Creem provides test cards)

4. **Verify new subscription created**:
   ```sql
   SELECT 
       subscription_id,
       status,
       price_id,
       created_at
   FROM payment
   WHERE user_id = 'myZwkau1DoG2GXcibytBYmmwRXX8Mw6L'
     AND status = 'active'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

5. **Test upgrade**:
   - Go to `/settings/billing`
   - Click "Upgrade to Pro+"
   - Check for purple notice: "Plan Upgrade Scheduled: Pro+"

---

## Expected Result After Creating New Subscription

✅ Database shows new active subscription with new `subscription_id`
✅ Billing page shows Pro plan as current
✅ Upgrade to Pro+ button works
✅ Purple scheduled upgrade notice appears
✅ Database `scheduled_plan_id` = 'proplus'

---

## Test Card for Creem (If Needed)

Creem usually provides test cards like:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

Check Creem docs for their specific test card numbers.
