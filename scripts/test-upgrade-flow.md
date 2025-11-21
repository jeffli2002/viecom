# Test Upgrade Flow

## Prerequisites
- Database migration 0003 has been run
- You have a test user with an active Pro subscription
- You're logged in as that user

## Test Steps

### 1. Initial State Check

```sql
-- Check user's current subscription
SELECT 
  id,
  price_id,
  interval,
  status,
  period_end,
  scheduled_plan_id,
  scheduled_period_start
FROM payment
WHERE user_id = 'YOUR_USER_ID'
  AND status IN ('active', 'trialing')
ORDER BY created_at DESC
LIMIT 1;
```

Expected:
- `price_id` contains 'pro' (not 'proplus')
- `scheduled_plan_id` is NULL
- `scheduled_period_start` is NULL

### 2. Perform Upgrade

1. Navigate to `/[locale]/settings/billing` or `/[locale]/pricing`
2. Click "Upgrade to Pro+" button
3. Observe the toast notification: "Your plan will upgrade at the end of the current period"

### 3. Verify Database Update

```sql
-- Check scheduled fields were set
SELECT 
  id,
  price_id as current_plan,
  scheduled_plan_id,
  scheduled_interval,
  scheduled_period_start,
  scheduled_period_end,
  period_end,
  scheduled_at,
  updated_at
FROM payment
WHERE user_id = 'YOUR_USER_ID'
ORDER BY updated_at DESC
LIMIT 1;
```

Expected:
- `scheduled_plan_id` = `'proplus'`
- `scheduled_interval` = `'month'` or `'year'`
- `scheduled_period_start` ≈ `period_end` (when current period ends)
- `scheduled_at` = current timestamp

### 4. Verify API Response

Open browser DevTools console and look for:

```
[Billing] Subscription data received: {
  upcomingPlan: {
    planId: 'proplus',
    interval: 'month',
    takesEffectAt: '2025-12-20T...',
    changeType: 'upgrade'
  },
  hasUpcomingPlan: true
}
```

Or manually test API:

```bash
# Using curl (requires session cookie)
curl 'http://localhost:3000/api/creem/subscription' \
  -H 'Cookie: better-auth.session_token=YOUR_TOKEN' \
  | jq '.subscription.upcomingPlan'
```

Expected output:
```json
{
  "planId": "proplus",
  "interval": "month",
  "takesEffectAt": "2025-12-20T00:00:00.000Z",
  "changeType": "upgrade"
}
```

### 5. Verify UI Display

Check `/[locale]/settings/billing` page:

**Expected UI Elements:**

1. **Upgrade Alert Banner** (top of page):
   - Purple gradient background
   - Title: "Plan Upgrade Scheduled: Pro+"
   - Shows effective date with calendar icon
   - Lists billing cycle, price, credits

2. **Current Subscription Card**:
   - Still shows "Pro" as current plan
   - Next renewal date shown
   - "Keep current plan" button available (cancels scheduled upgrade)

3. **Available Plans Section**:
   - Pro+ plan shows "Current plan" (disabled) if user is viewing from their current interval

### 6. Test Cancel Scheduled Upgrade

1. Click "Keep current plan" button in the subscription card
2. Verify database:

```sql
SELECT scheduled_plan_id, scheduled_period_start
FROM payment  
WHERE user_id = 'YOUR_USER_ID'
ORDER BY updated_at DESC
LIMIT 1;
```

Expected:
- `scheduled_plan_id` should be NULL (cleared)
- `scheduled_period_start` should be NULL (cleared)

3. Verify UI: Upgrade alert banner should disappear

## Common Issues

### Issue: scheduled_plan_id stays NULL after upgrade

**Debug Steps:**

1. Check upgrade API logs:
```bash
# Look for these logs in your terminal where dev server is running
[Creem Subscription Upgrade] Processing upgrade request
[Creem Subscription Upgrade] Scheduled upgrade set
```

2. If "Scheduled upgrade set" doesn't appear:
   - Check if `paymentRepository.update()` is throwing an error
   - Verify columns exist: `pnpm db:studio` → Open `payment` table

3. Check API response:
```bash
# The upgrade endpoint should return
{
  "success": true,
  "message": "Subscription will be upgraded at the end of current period"
}
```

### Issue: UI doesn't show upgrade notice

**Debug Steps:**

1. Check browser console for `[Billing]` logs
2. Verify `upcomingPlan` in subscription data
3. Check component logic at `BillingClient.tsx:660`
4. Ensure `scheduledPlanDetails` is computed correctly (line 569)

### Issue: Date shows as invalid or "—"

**Debug Steps:**

1. Check `scheduled_period_start` format in database (should be ISO timestamp)
2. Verify `formatDate()` function at `BillingClient.tsx:69`
3. Check that `takesEffectAt` is being passed correctly

## Success Criteria

✅ Database `scheduled_plan_id` is set to target plan
✅ Database `scheduled_period_start` matches expected effective date  
✅ API returns `upcomingPlan` object
✅ Billing page shows purple upgrade alert banner
✅ Banner displays correct effective date
✅ "Keep current plan" button cancels the upgrade
✅ Toast notifications work correctly

## Cleanup After Test

```sql
-- Reset scheduled upgrade for test user
UPDATE payment
SET 
  scheduled_plan_id = NULL,
  scheduled_interval = NULL,
  scheduled_period_start = NULL,
  scheduled_period_end = NULL,
  scheduled_at = NULL
WHERE user_id = 'YOUR_USER_ID';
```
