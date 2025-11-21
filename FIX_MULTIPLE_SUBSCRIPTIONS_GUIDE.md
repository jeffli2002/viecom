# Fix Multiple Active Subscriptions Issue

## Problem

Your database has multiple active subscription records for the same user with different statuses in Creem vs. your database. This causes:

1. **Status inversions**: Creem shows "active" but DB shows "canceled" (or vice versa)
2. **Multiple active subscriptions**: Users have more than one "active" subscription simultaneously
3. **Billing/credit issues**: Duplicate credit grants, incorrect plan access

## Root Causes

1. **Webhook race conditions**: Multiple webhooks processing simultaneously
2. **No status sync**: Database never verifies status with Creem API
3. **Weak enforcement**: `cancelOtherActiveSubscriptions()` runs but status might already be wrong
4. **Stale data accumulation**: Old canceled subscriptions never cleaned up

## Solution: Three-Step Fix

### Step 1: Run the Cleanup Script (IMMEDIATE)

This script will:
- Sync ALL subscriptions with Creem API
- Fix status mismatches
- Enforce "one active subscription per user" rule
- Cancel duplicate active subscriptions

```bash
pnpm tsx scripts/fix-multiple-active-subscriptions.ts
```

**What it does:**

1. Fetches all Creem subscriptions from your database
2. For each subscription, queries Creem API to get TRUE status
3. Updates database to match Creem's reality
4. Groups subscriptions by user
5. If user has >1 active subscription, keeps most recent, cancels others
6. Prints detailed report of all changes

**Expected output:**

```
🔧 Starting subscription cleanup and sync...

Found 21 total Creem subscriptions

Found 1 unique users with subscriptions

============================================================
Processing user: user_abc123
Total subscriptions: 21
============================================================

  Checking sub_6IW1jzFGNaN8FdSrOaA3at (DB: active)...
    Creem: active (normalized: active)
    ✓ Already in sync

  Checking sub_5EM6IgULEBVjEtMx5OH0TT (DB: canceled)...
    Creem: canceled (normalized: canceled)
    ✓ Already in sync

  ℹ️  No active subscriptions for this user

============================================================
📊 CLEANUP SUMMARY
============================================================
Total subscriptions processed: 21
✅ Synced: 5
❌ Canceled duplicates: 2
⚠️  Errors: 0
✓ No change: 14

📝 CHANGES MADE:
┌─────────┬──────────────────────┬──────────────────────┬────────────┬────────────┬──────────────────────────────┐
│  User   │     Subscription     │       Action         │ Old Status │ New Status │           Details            │
├─────────┼──────────────────────┼──────────────────────┼────────────┼────────────┼──────────────────────────────┤
│ user_ab │ sub_5EM6IgULEBVjEtMx │ synced               │ active     │ canceled   │ Status synced with Creem     │
│ user_ab │ sub_1z68uVY7AcLLorgz │ canceled_duplicate   │ active     │ canceled   │ Duplicate active subscription│
└─────────┴──────────────────────┴──────────────────────┴────────────┴────────────┴──────────────────────────────┘

✅ Cleanup complete!
```

### Step 2: Code Changes (DEPLOYED)

The following code improvements have been implemented:

#### A. Payment Repository Enhancements

**New methods:**

```typescript
// Get count of active subscriptions (should always be 0 or 1)
await paymentRepository.getActiveSubscriptionCount(userId);

// Enforce single active subscription rule
await paymentRepository.enforceSingleActiveSubscription(userId);
```

**Improved logging:**

`cancelOtherActiveSubscriptions()` now logs which subscriptions it's canceling for debugging.

#### B. Webhook Handler Improvements

**Before every subscription creation/update:**

```typescript
// Check for multiple active subscriptions and fix
const activeCount = await paymentRepository.getActiveSubscriptionCount(userId);
if (activeCount > 1) {
  await paymentRepository.enforceSingleActiveSubscription(userId);
}
```

This runs in:
- `handleCheckoutComplete()`
- `handleSubscriptionCreated()`

### Step 3: Monitoring & Prevention

#### Add Regular Health Checks

Run this query weekly to detect issues early:

```sql
-- Find users with multiple active subscriptions
SELECT 
  user_id,
  COUNT(*) as active_count,
  STRING_AGG(subscription_id, ', ') as subscription_ids,
  STRING_AGG(status, ', ') as statuses,
  STRING_AGG(price_id, ', ') as plans
FROM payment
WHERE 
  provider = 'creem' AND
  type = 'subscription' AND
  status IN ('active', 'trialing', 'past_due')
GROUP BY user_id
HAVING COUNT(*) > 1;
```

**If you find any:**

```bash
# Run the cleanup script again
pnpm tsx scripts/fix-multiple-active-subscriptions.ts
```

#### Monitor Webhook Logs

Look for these warning messages:

```
[Creem Webhook] User xxx has N active subscriptions - enforcing rule
[PaymentRepository] Enforcing single subscription rule for user xxx
```

If you see these frequently, investigate:
1. Is Creem sending duplicate webhooks?
2. Are webhooks arriving in wrong order?
3. Check webhook signature validation

## Testing the Fix

### 1. Check Current State

```sql
-- See all subscriptions for a specific user
SELECT 
  subscription_id,
  status,
  price_id,
  interval,
  created_at,
  updated_at,
  cancel_at_period_end
FROM payment
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

### 2. Run Cleanup Script

```bash
pnpm tsx scripts/fix-multiple-active-subscriptions.ts
```

### 3. Verify Results

```sql
-- Should return 0 or 1 row per user
SELECT 
  user_id,
  COUNT(*) as active_count
FROM payment
WHERE 
  provider = 'creem' AND
  status IN ('active', 'trialing', 'past_due')
GROUP BY user_id
HAVING COUNT(*) > 1;
```

**Expected:** Empty result set (no users with multiple active subscriptions)

### 4. Test New Subscription Flow

1. Have a user subscribe to Pro plan
2. Check database - should have 1 active subscription
3. Have same user upgrade to Pro+ immediately
4. Check database - should still have 1 active subscription (Pro+)
5. Verify old Pro subscription is marked as canceled

## Rollback Plan

If the fix causes issues:

### 1. Database Restore Point

Before running the cleanup script, create a backup:

```bash
# Export payment table
pg_dump -h YOUR_HOST -U YOUR_USER -d YOUR_DB -t payment > payment_backup.sql

# Restore if needed
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB < payment_backup.sql
```

### 2. Code Rollback

The enforcement logic can be disabled by commenting out these lines in `/src/app/api/webhooks/creem/route.ts`:

```typescript
// In handleCheckoutComplete() around line 405
// const activeCount = await paymentRepository.getActiveSubscriptionCount(userId);
// if (activeCount > 1) {
//   console.warn(`[Creem Webhook] User ${userId} has ${activeCount} active subscriptions - enforcing rule`);
//   await paymentRepository.enforceSingleActiveSubscription(userId);
// }

// In handleSubscriptionCreated() around line 562
// const activeCount = await paymentRepository.getActiveSubscriptionCount(ownerUserId);
// if (activeCount > 0) {
//   console.warn(`[Creem Webhook] User ${ownerUserId} already has ${activeCount} active subscription(s) - enforcing rule`);
//   await paymentRepository.enforceSingleActiveSubscription(ownerUserId);
// }
```

Then redeploy.

## FAQ

**Q: Will this affect active paying customers?**

A: The script only cancels duplicate/stale subscriptions. It keeps the most recent active subscription. Active users won't lose access.

**Q: What if Creem API is down when I run the script?**

A: The script will log errors for subscriptions it can't verify, but won't modify them. Run it again when Creem is accessible.

**Q: Will this fix future issues?**

A: Yes, the webhook improvements enforce the single-subscription rule automatically. However, run the cleanup script monthly as a precaution.

**Q: Can I run the cleanup script on production?**

A: Yes, but:
1. Take a database backup first
2. Run during low-traffic hours
3. Monitor logs after execution

**Q: What about canceled subscriptions?**

A: The script doesn't delete canceled subscriptions. They remain in the database for historical records. Only active/trialing/past_due subscriptions are affected.

## Next Steps

1. ✅ Run cleanup script: `pnpm tsx scripts/fix-multiple-active-subscriptions.ts`
2. ✅ Verify results with SQL queries above
3. ✅ Code changes are already deployed
4. 📅 Schedule weekly health check query
5. 📅 Set reminder to run cleanup script monthly

## Support

If you encounter issues:

1. Check script output for error details
2. Review webhook logs: `[Creem Webhook]` messages
3. Query database to see current state
4. Contact Creem support if API issues persist

## Files Modified

- ✅ `scripts/fix-multiple-active-subscriptions.ts` (NEW)
- ✅ `src/server/db/repositories/payment-repository.ts` (ENHANCED)
- ✅ `src/app/api/webhooks/creem/route.ts` (IMPROVED)
