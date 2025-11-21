# Diagnose Pro+ Display Issue

## Problem
Creem dashboard shows Pro+ subscription is active, but your frontend displays "Pro".

## Quick Diagnosis Steps

### Step 1: Check Browser Console Logs

1. Open your app at `http://localhost:3000`
2. Login and navigate to `/billing` page  
3. Open Browser DevTools (F12) → Console tab
4. Look for these log messages:

```
[Subscription API] All subscriptions for user: {...}
[Subscription API] Found active subscription: {...}
[Subscription API] Debug: {priceId: ..., productId: ..., candidateProductId: ...}
[Subscription API] Plan resolution: {...}
```

**Key things to check:**
- `productId`: Should be `prod_4s8si1GkKRtU0HuUEWz6ry` for Pro+ Monthly
- `resolvedByProduct`: Should show `{planId: 'proplus', name: 'Pro+'}`
- If `resolvedByProduct` is `null`, the product_id doesn't match your config

### Step 2: Check Database Using Drizzle Studio

**Open Drizzle Studio** (works with Neon database):
```bash
pnpm db:studio
```

This will start Drizzle Studio. Open your browser to:
**https://local.drizzle.studio**

**Steps to check your subscription**:

1. In the left sidebar, click on **`payment`** table
2. Look for the row where:
   - `status` = `'active'`
   - `provider` = `'creem'`
3. Check these columns:
   - **`subscription_id`**: The Creem subscription ID (starts with `sub_...`)
   - **`product_id`**: Should be `prod_4s8si1GkKRtU0HuUEWz6ry` for Pro+ Monthly
   - **`price_id`**: May contain product_id or price_id
   - **`status`**: Should be `active`
   - **`provider`**: Should be `creem`

**Screenshot guide**:
- Drizzle Studio shows a spreadsheet-like view
- Each row is a subscription record
- You can click on any cell to edit it inline

### Step 3: Fix the Data

If `product_id` is wrong or missing:

**Option A - Use Drizzle Studio** (Easiest - works with Neon):

1. In Drizzle Studio, find your active subscription row
2. Click on the **`product_id`** cell for that row
3. Type: `prod_4s8si1GkKRtU0HuUEWz6ry` (for Pro+ Monthly)
4. Press **Enter** or click outside the cell to save
5. You should see a confirmation that the data was updated

**Visual guide**:
```
payment table
┌─────────┬────────────────┬────────────────────────────────┬────────┐
│ id      │ subscription_id│ product_id                     │ status │
├─────────┼────────────────┼────────────────────────────────┼────────┤
│ abc123  │ sub_xyz789     │ prod_4s8si1GkKRtU0HuUEWz6ry   │ active │ ← Click here to edit
└─────────┴────────────────┴────────────────────────────────┴────────┘
```

**Option B - SQL Update**:
```sql
UPDATE payment
SET product_id = 'prod_4s8si1GkKRtU0HuUEWz6ry'
WHERE subscription_id = 'sub_YOUR_ACTUAL_SUBSCRIPTION_ID'
AND status = 'active';
```

### Step 4: Verify the Fix

1. Refresh `/billing` page
2. Should now show "Pro+" instead of "Pro"
3. Check console logs again - should show:
   ```
   [Subscription API] Plan resolution: {
     ...,
     resolvedByProduct: {planId: 'proplus', name: 'Pro+'}
   }
   ```

## Product IDs Reference

From your `.env.local`:
- **Pro Monthly**: `prod_kUzMsZPgszRro3jOiUrfd`
- **Pro+ Monthly**: `prod_4s8si1GkKRtU0HuUEWz6ry` ← This is what you need
- **Pro Yearly**: `prod_7VQbOmypdWBKd8k1W4aiH2`
- **Pro+ Yearly**: `prod_4SM5v4tktYr2rNXZnH70Fh`

## Why This Happens

When a subscription is created/upgraded via Creem webhook, the webhook handler saves the subscription data to your database. If there's a mismatch, possible causes:

1. **Webhook data incomplete**: The webhook didn't include `product_id`
2. **Old migration data**: Subscription was migrated from old system
3. **Manual database edit**: Someone manually changed the data
4. **Creem product key changed**: The product_id in Creem changed but wasn't updated in your `.env`

## Prevention

After fixing, ensure future webhook events update correctly by checking:
- `src/app/api/webhooks/creem/route.ts` properly extracts `product_id`
- All Creem product keys in `.env.local` match your Creem dashboard

## Need More Help?

If the issue persists:
1. Share the console logs from Step 1
2. Share the database record from Step 2  
3. Confirm which product key Creem dashboard shows for the subscription
