# Fix Pro+ Subscription Mapping Issue

## Problem
Creem shows Pro+ subscription is active, but frontend displays "Pro" instead of "Pro+".

## Root Cause
The `payment` table likely has incorrect `product_id` or `price_id` that doesn't match the Pro+ product key.

## Expected Values
- **Pro+ Monthly Product Key**: `prod_4s8si1GkKRtU0HuUEWz6ry`  
- **Pro+ Yearly Product Key**: `prod_4SM5v4tktYr2rNXZnH70Fh`

## Diagnosis Steps

### 1. Check the current subscription data
```sql
SELECT 
  id,
  user_id,
  subscription_id,
  price_id,
  product_id,
  status,
  interval,
  provider
FROM payment
WHERE status IN ('active', 'trialing')
AND provider = 'creem'
ORDER BY created_at DESC;
```

### 2. Check what the API is resolving
Check the browser console logs when visiting `/billing` page. Look for:
```
[Subscription API] Plan resolution: {
  productId: "...",
  resolvedByProduct: {...}
}
```

## Fix Options

### Option A: Update the database directly
If the `product_id` is wrong in the database:

```sql
UPDATE payment
SET product_id = 'prod_4s8si1GkKRtU0HuUEWz6ry'  -- Pro+ Monthly
WHERE subscription_id = 'sub_...'  -- Replace with actual subscription ID
AND status = 'active';
```

### Option B: Re-sync from Creem
Call the sync endpoint to fetch latest data from Creem and update the database.

## Prevention
After webhook events update subscriptions, verify that:
1. `product_id` matches one of the configured product keys
2. Plan resolution returns the correct plan ('proplus')
3. Frontend displays "Pro+" not "Pro"

## Verification
After fixing, verify:
1. Billing page shows "Pro+" plan
2. Console logs show `planId: 'proplus'`
3. Features match Pro+ limits (900 credits/month, 10 concurrent batch)
