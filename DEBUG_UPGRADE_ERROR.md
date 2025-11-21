# Debug Upgrade Error

## The Error You're Seeing

Next.js is showing you line 427 in `BillingClient.tsx` because an error occurred during the upgrade process. This line is just logging the error - it's not the cause.

## Find the Real Error

### Step 1: Check Browser Console

Open DevTools Console and look for:

```
[Billing] Upgrade/downgrade failed (manual): {
  status: 404,  // or 403, 401, 500
  statusText: "Not Found",
  error: "Subscription not found",
  data: { ... }
}
```

**Tell me**:
- What is the `status` number?
- What is the `error` message?

### Step 2: Check Network Tab

1. Open DevTools → Network tab
2. Filter by "subscription"
3. Find the failed request to `/api/creem/subscription/{id}/upgrade`
4. Click it → Response tab

**Tell me**:
- What's the response body?
- What's the status code?

### Step 3: Check Subscription Data

In the browser console, type:

```javascript
// Check if subscription has the required ID
console.log('Subscription check:', {
  hasSubscription: !!window.subscription,
  subscriptionId: window.subscription?.subscriptionId
});
```

## Common Errors & Solutions

### Error 1: `subscriptionId is missing`

**Symptoms**:
```
[Billing] WARNING: subscriptionId is missing! This will cause upgrade/downgrade to fail.
```

**Root Cause**: The `payment` table record doesn't have a `subscription_id` value.

**Solution**:
```sql
-- Check your subscription record
SELECT 
  id,
  subscription_id,
  price_id,
  status,
  provider
FROM payment
WHERE user_id = 'YOUR_USER_ID'
  AND status IN ('active', 'trialing')
ORDER BY created_at DESC
LIMIT 1;
```

If `subscription_id` is NULL:
- This means the subscription was created incorrectly
- You need to populate it with the Creem subscription ID
- Check webhook logs or Creem dashboard for the subscription ID

### Error 2: `404 Subscription not found`

**Root Cause**: The API can't find the payment record by `subscription_id`.

**Debug**:
```sql
-- Find what subscription_id the payment table has
SELECT subscription_id, id, user_id, status
FROM payment
WHERE user_id = 'YOUR_USER_ID';
```

**Check**: Does the `subscription_id` match what's in Creem dashboard?

### Error 3: `403 Forbidden`

**Root Cause**: The subscription belongs to a different user.

**Solution**: Check that you're logged in as the correct user who owns the subscription.

### Error 4: `401 Unauthorized`

**Root Cause**: Session expired.

**Solution**: Log out and log back in.

### Error 5: Network error / No response

**Root Cause**: API route not responding or crashed.

**Check server logs**:
```bash
# In your terminal where dev server is running, look for:
[Creem Subscription Upgrade] Processing upgrade request
[Creem Subscription Upgrade] Scheduled upgrade set
```

If you don't see these logs, the route isn't being called.

## Detailed Debug Steps

### 1. Check Current Subscription State

Run in Neon SQL Editor:

```sql
-- Get full subscription details
SELECT 
  p.id as payment_id,
  p.subscription_id,
  p.user_id,
  p.price_id,
  p.status,
  p.provider,
  p.period_end,
  p.scheduled_plan_id,
  p.scheduled_period_start,
  u.email
FROM payment p
JOIN "user" u ON u.id = p.user_id
WHERE p.status IN ('active', 'trialing')
  AND p.provider = 'creem'
ORDER BY p.created_at DESC
LIMIT 5;
```

**Expected**:
- `subscription_id` should NOT be NULL
- `provider` should be 'creem'
- `status` should be 'active' or 'trialing'

### 2. Check API Response in Browser

Open DevTools Console and run:

```javascript
// Fetch subscription data
fetch('/api/creem/subscription', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => {
  console.log('Subscription API Response:', data);
  if (data.subscription) {
    console.log('Has subscriptionId?', !!data.subscription.subscriptionId);
    console.log('SubscriptionId value:', data.subscription.subscriptionId);
    console.log('Status:', data.subscription.status);
  }
});
```

**Expected output**:
```javascript
{
  subscription: {
    id: "payment_record_id",
    subscriptionId: "sub_...",  // ← MUST NOT BE NULL
    status: "active",
    planId: "pro",
    // ... other fields
  }
}
```

### 3. Test the Upgrade API Directly

In DevTools Console:

```javascript
// Get current subscription
const subResponse = await fetch('/api/creem/subscription', { credentials: 'include' });
const subData = await subResponse.json();
const subscriptionId = subData.subscription?.subscriptionId;

console.log('Testing upgrade with subscriptionId:', subscriptionId);

// Try to upgrade
const upgradeResponse = await fetch(`/api/creem/subscription/${subscriptionId}/upgrade`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    newPlanId: 'proplus',
    newInterval: 'month',
    useProration: false
  })
});

const upgradeData = await upgradeResponse.json();
console.log('Upgrade response:', {
  ok: upgradeResponse.ok,
  status: upgradeResponse.status,
  data: upgradeData
});
```

This will show the exact error from the API.

## Next Steps

After you identify the error:

1. **If `subscription_id` is NULL**: Need to fix the subscription record
2. **If 404**: Need to verify the subscription ID is correct
3. **If 403/401**: Need to check authentication
4. **If 500**: Need to check server logs for the actual error

**Please share**:
1. The error message from browser console
2. The network response
3. The result from the SQL query above

Then I can provide the exact fix!
