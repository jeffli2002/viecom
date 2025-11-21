# Fix Pro+ Display Issue - Using Neon Console

## Quick Fix Using Neon Database Console

### Step 1: Open Neon Console

1. Go to **https://console.neon.tech/**
2. Login to your account
3. Select your project (the one with your DATABASE_URL)
4. Click on **"SQL Editor"** in the left sidebar

### Step 2: Check Current Subscription Data

Run this query to see your current subscription:

```sql
SELECT 
  id,
  user_id,
  subscription_id,
  product_id,
  price_id,
  status,
  provider,
  interval,
  created_at
FROM payment
WHERE status = 'active'
AND provider = 'creem'
ORDER BY created_at DESC;
```

**What to look for:**
- Note the `subscription_id` (starts with `sub_...`)
- Check the `product_id` - is it `prod_4s8si1GkKRtU0HuUEWz6ry`?
- If not, that's the problem!

### Step 3: Fix the Product ID

**Copy the `subscription_id` from Step 2**, then run:

```sql
UPDATE payment
SET product_id = 'prod_4s8si1GkKRtU0HuUEWz6ry'
WHERE subscription_id = 'sub_YOUR_SUBSCRIPTION_ID_HERE'  -- Replace with actual ID from Step 2
AND status = 'active'
AND provider = 'creem';
```

**Example:**
```sql
-- If your subscription_id is sub_abc123xyz, use:
UPDATE payment
SET product_id = 'prod_4s8si1GkKRtU0HuUEWz6ry'
WHERE subscription_id = 'sub_abc123xyz'
AND status = 'active'
AND provider = 'creem';
```

### Step 4: Verify the Update

Run this to confirm the change:

```sql
SELECT 
  subscription_id,
  product_id,
  status,
  interval
FROM payment
WHERE subscription_id = 'sub_YOUR_SUBSCRIPTION_ID_HERE';  -- Same ID as Step 3
```

You should see `product_id` is now `prod_4s8si1GkKRtU0HuUEWz6ry`

### Step 5: Test in Your App

1. Refresh your browser at `/billing` page
2. Should now show **"Pro+"** instead of "Pro"
3. Check browser console - should see:
   ```
   [Subscription API] Plan resolution: {
     resolvedByProduct: {planId: 'proplus', name: 'Pro+'}
   }
   ```

## Product ID Reference

From your `.env.local`:
- **Pro Monthly**: `prod_kUzMsZPgszRro3jOiUrfd`
- **Pro+ Monthly**: `prod_4s8si1GkKRtU0HuUEWz6ry` ✅ Use this
- **Pro Yearly**: `prod_7VQbOmypdWBKd8k1W4aiH2`
- **Pro+ Yearly**: `prod_4SM5v4tktYr2rNXZnH70Fh`

## Troubleshooting

**If UPDATE affects 0 rows:**
- The `subscription_id` doesn't match - check Step 2 again
- Or the subscription is not active - remove the `AND status = 'active'` condition

**If you have multiple active subscriptions:**
```sql
-- Check all active subscriptions
SELECT * FROM payment 
WHERE status IN ('active', 'trialing') 
AND provider = 'creem';
```

Then update the specific one by `id` instead:
```sql
UPDATE payment
SET product_id = 'prod_4s8si1GkKRtU0HuUEWz6ry'
WHERE id = 'the_payment_id_from_query_above';
```

---

**This method is faster than waiting for Drizzle Studio to load!** 🚀
