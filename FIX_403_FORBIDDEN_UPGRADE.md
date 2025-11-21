# Fix: 403 Forbidden on Upgrade

## Error
```
Forbidden, you do not have permission to upgrade this subscription. 
Please check your subscription status or contact support.
```

## Root Cause

The API is rejecting the upgrade because:

```typescript
// Line 57-63 in upgrade/route.ts
if (paymentRecord.userId !== session.user.id) {
  return 403 Forbidden
}
```

This happens when:
1. The `subscription_id` in payment table is **NULL**, **wrong**, or **points to wrong user**
2. The frontend is sending the wrong subscription ID

## Debug Steps

### Step 1: Check what the frontend is sending

Open browser DevTools Console and run:

```javascript
// Get subscription data
fetch('/api/creem/subscription', {credentials: 'include'})
  .then(r => r.json())
  .then(data => {
    console.log('=== FRONTEND DATA ===');
    console.log('Payment ID:', data.subscription?.id);
    console.log('Subscription ID:', data.subscription?.subscriptionId);
    console.log('User can upgrade?', !!data.subscription?.subscriptionId);
  });
```

**If `subscriptionId` is NULL or undefined** → That's the problem!

### Step 2: Check database records

Run in Neon SQL Editor (replace `YOUR_USER_EMAIL`):

```sql
-- Find user's payment records
SELECT 
    p.id as payment_id,
    p.subscription_id,
    p.user_id,
    p.price_id,
    p.status,
    p.provider,
    u.email
FROM payment p
JOIN "user" u ON u.id = p.user_id
WHERE u.email = 'YOUR_USER_EMAIL'
  AND p.status IN ('active', 'trialing')
ORDER BY p.created_at DESC;
```

**Check the output:**
- Is `subscription_id` NULL? → **Problem 1**
- Is `subscription_id` same as `payment_id`? → **Problem 2** (wrong value)
- Does `user_id` match your actual user ID? → **Problem 3**

## Fix Based on Problem

### Problem 1: subscription_id is NULL

**Cause**: The payment record was created without a Creem subscription ID.

**Solution**: You need to get the actual subscription ID from Creem and update it.

**Option A: If you know the Creem subscription ID**

```sql
-- Update with the real Creem subscription ID from Creem dashboard
UPDATE payment
SET subscription_id = 'sub_actual_creem_id_here'
WHERE id = 'payment_record_id_here'
  AND user_id = 'user_id_here';
```

**Option B: If you don't have the Creem subscription ID**

You'll need to:
1. Check Creem dashboard for the subscription
2. OR re-create the subscription through checkout flow
3. OR use the payment record ID as a temporary fix:

```sql
-- TEMPORARY FIX: Use payment.id as subscription_id
-- This works if you're using payment.id to track subscriptions
UPDATE payment
SET subscription_id = id
WHERE subscription_id IS NULL
  AND status IN ('active', 'trialing')
  AND provider = 'creem';
```

### Problem 2: subscription_id points to wrong user

**Cause**: Data corruption or wrong assignment during subscription creation.

**Solution**: Fix the user_id:

```sql
-- Check which user should own this subscription
SELECT 
    p.id,
    p.subscription_id,
    p.user_id,
    p.customerId,
    u.email
FROM payment p
JOIN "user" u ON u.id = p.user_id
WHERE p.subscription_id = 'problematic_subscription_id';

-- If wrong user, update it (BE VERY CAREFUL)
UPDATE payment
SET user_id = 'correct_user_id'
WHERE subscription_id = 'problematic_subscription_id';
```

### Problem 3: Frontend sending wrong subscription ID

**Debug**: Check the API response structure.

The frontend expects:
```javascript
{
  subscription: {
    id: "payment_record_id",
    subscriptionId: "sub_creem_id",  // ← This is used for upgrade
    // ...
  }
}
```

**Check the subscription API** (`src/app/api/creem/subscription/route.ts:256`):

```typescript
return NextResponse.json({
  subscription: {
    id: activeSubscription.id,
    subscriptionId: activeSubscription.subscriptionId,  // ← Must not be null
    // ...
  }
});
```

If `activeSubscription.subscriptionId` is null, the frontend will fail.

## Quick Fix: Use Payment ID as Subscription ID

If you're not integrating deeply with Creem's subscription management, you can use the payment record ID:

```sql
-- Quick fix: Make subscription_id same as payment.id
UPDATE payment
SET subscription_id = id
WHERE subscription_id IS NULL
  AND status IN ('active', 'trialing')
  AND provider = 'creem';

-- Verify the fix
SELECT id, subscription_id, user_id, status
FROM payment
WHERE status IN ('active', 'trialing')
  AND provider = 'creem';
```

After this:
1. Refresh the billing page
2. Try upgrading again
3. Should work! ✅

## Alternative: Change API to Use Payment ID

If you don't need Creem's subscription ID, modify the upgrade route to accept payment ID instead:

**File: `src/app/api/creem/subscription/[subscriptionId]/upgrade/route.ts`**

Change line 47 from:
```typescript
const paymentRecord = await paymentRepository.findBySubscriptionId(subscriptionId);
```

To:
```typescript
// Try subscription_id first, fall back to payment.id
let paymentRecord = await paymentRepository.findBySubscriptionId(subscriptionId);
if (!paymentRecord) {
  paymentRecord = await paymentRepository.findById(subscriptionId);
}
```

This makes the API accept either subscription_id OR payment.id.

## Verify the Fix

After fixing, test:

1. **Browser console**:
```javascript
fetch('/api/creem/subscription', {credentials: 'include'})
  .then(r => r.json())
  .then(d => console.log('subscriptionId:', d.subscription?.subscriptionId));
```
Should print a valid ID (not null).

2. **Try upgrade again** from billing page

3. **Check server logs**:
```
[Creem Subscription Upgrade] Processing upgrade request: { subscriptionId: '...' }
[Creem Subscription Upgrade] Scheduled upgrade set: { ... }
```

Should NOT see "User mismatch" or "Subscription not found".

## Prevention

When creating subscriptions in the future, always:

1. **Set subscription_id during creation**:
```typescript
await paymentRepository.create({
  subscriptionId: creemSubscription.id,  // ← Don't forget this!
  // ... other fields
});
```

2. **Validate in webhook handler**:
```typescript
if (!subscriptionId) {
  console.error('Missing subscription ID in webhook!');
  return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 });
}
```

3. **Add database constraint** (optional):
```sql
-- Make subscription_id NOT NULL for subscriptions
ALTER TABLE payment
ADD CONSTRAINT subscription_id_required 
CHECK (
  type != 'subscription' OR subscription_id IS NOT NULL
);
```
