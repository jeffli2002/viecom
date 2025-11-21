# Fix: Inverted Subscription Status

## Problem Discovery

ALL subscriptions have **opposite status** between database and Creem:

| Subscription | Database Status | Creem Status |
|--------------|-----------------|--------------|
| `sub_6IW1jzFGNaN8FdSrOaA3at` | `active` | `canceled` |
| `sub_5EM6IgULEBVjEtMx5OH0TT` | `canceled` | `active` |

This is a **critical data sync issue** affecting all subscription operations.

## Root Cause

Possible causes:
1. **Webhook events not processing** - Webhooks from Creem aren't reaching your app
2. **Status mapping bug** - `normalizeCreemStatus()` function has inverse logic
3. **Manual database edits** - Someone manually flipped statuses
4. **Test/Production mismatch** - Database points to production subscriptions but using test API key

## Solution: Sync All Subscriptions with Creem

### Option 1: Automated Sync Script (Recommended)

We created a script to automatically sync all subscriptions:

```bash
# This will:
# 1. Fetch each subscription from Creem
# 2. Compare statuses
# 3. Update database to match Creem
# 4. Show you a summary of changes

pnpm tsx scripts/sync-all-subscriptions-with-creem.ts
```

**Expected Output:**
```
🔄 Starting subscription sync with Creem...

Found 5 Creem subscriptions in database

Checking sub_6IW1jzFGNaN8FdSrOaA3at...
  DB: active | Creem: canceled (normalized: canceled)
  🔧 MISMATCH DETECTED - Updating sub_6IW1jzFGNaN8FdSrOaA3at
     active → canceled
  ✅ Updated successfully

Checking sub_5EM6IgULEBVjEtMx5OH0TT...
  DB: canceled | Creem: active (normalized: active)
  🔧 MISMATCH DETECTED - Updating sub_5EM6IgULEBVjEtMx5OH0TT
     canceled → active
  ✅ Updated successfully

============================================================
📊 SYNC SUMMARY
============================================================
Total subscriptions: 5
✅ Synced: 2
❌ Errors: 0
✓ Already in sync: 3

📝 CHANGES MADE:
┌─────────┬──────────────────────────────┬───────────┬─────────────┬──────────┐
│ (index) │      subscriptionId          │ dbStatus  │ creemStatus │  action  │
├─────────┼──────────────────────────────┼───────────┼─────────────┼──────────┤
│    0    │ 'sub_6IW1jzFGNaN8FdSrOaA3at' │ 'active'  │ 'canceled'  │ 'updated'│
│    1    │ 'sub_5EM6IgULEBVjEtMx5OH0TT' │ 'canceled'│ 'active'    │ 'updated'│
└─────────┴──────────────────────────────┴───────────┴─────────────┴──────────┘

✅ Sync complete!
```

### Option 2: Manual SQL Fix

If you can't run the script, manually flip the statuses:

```sql
-- Check current state
SELECT 
    subscription_id,
    status as db_status,
    'OPPOSITE' as creem_status_is
FROM payment
WHERE provider = 'creem'
ORDER BY created_at DESC;

-- Flip all statuses
UPDATE payment
SET 
    status = CASE 
        WHEN status = 'active' THEN 'canceled'
        WHEN status = 'canceled' THEN 'active'
        WHEN status = 'trialing' THEN 'canceled'  -- if you have any trialing that are actually canceled
        ELSE status
    END,
    updated_at = NOW()
WHERE provider = 'creem';

-- Verify the flip
SELECT 
    subscription_id,
    status as new_db_status
FROM payment
WHERE provider = 'creem'
ORDER BY created_at DESC;
```

**⚠️ DANGER**: This assumes ALL statuses are inverted. Use Option 1 (script) instead if possible.

### Option 3: Query Creem API Directly

Check what Creem actually says:

```bash
# Check sub_6IW1jzFGNaN8FdSrOaA3at
curl -X GET "https://api.creem.io/v1/subscriptions/sub_6IW1jzFGNaN8FdSrOaA3at" \
  -H "Authorization: Bearer creem_test_76fiPMad5FJHU3qodnAWGx"

# Check sub_5EM6IgULEBVjEtMx5OH0TT
curl -X GET "https://api.creem.io/v1/subscriptions/sub_5EM6IgULEBVjEtMx5OH0TT" \
  -H "Authorization: Bearer creem_test_76fiPMad5FJHU3qodnAWGx"
```

Look for `"status": "active"` or `"status": "canceled"` in the response.

---

## After Syncing

### Step 1: Verify Active Subscription

```sql
-- Should show the subscription that's actually active in Creem
SELECT 
    subscription_id,
    status,
    price_id,
    user_id
FROM payment
WHERE status = 'active' 
  AND provider = 'creem'
ORDER BY created_at DESC;
```

### Step 2: Test Upgrade

1. Go to `/settings/billing`
2. Should now show correct active subscription
3. Click "Upgrade to Pro+"
4. Should work! ✅

---

## Root Cause Investigation

After syncing, investigate why this happened:

### Check 1: Webhook Configuration

**In Creem Dashboard:**
1. Go to Settings → Webhooks
2. Verify webhook URL: `https://yourdomain.com/api/webhooks/creem`
3. Check webhook logs - are events being sent?
4. Check webhook signing secret matches `.env.local`

**In Your Code:**
- Check webhook handler logs: `grep "Creem Webhook" logs/*`
- Verify signature validation is working
- Check if events are being processed

### Check 2: Status Normalization

File: `src/lib/creem/status-utils.ts`

The function looks correct:
```typescript
if (value.includes('cancel')) {
  return 'canceled';  // ✅ Correct
}
if (value.includes('active')) {
  return 'active';    // ✅ Correct
}
```

No inversion bug here.

### Check 3: Test Mode Mismatch

Check if subscriptions were created in **production** but you're using **test** API key:

```sql
-- Check when subscriptions were created
SELECT 
    subscription_id,
    status,
    created_at,
    provider
FROM payment
WHERE provider = 'creem'
ORDER BY created_at;
```

If created long ago, they might be production subscriptions.

**Solution**: Either:
- Switch to production API key in `.env.local`
- OR delete old subscriptions and create new test ones

### Check 4: Manual Database Edits

Check audit logs or git history:
```bash
git log --all --grep="status" --grep="canceled" --grep="active" --oneline
```

Someone may have manually flipped statuses.

---

## Prevention

### 1. Set Up Webhook Monitoring

Add logging to webhook handler:

```typescript
// In webhook route
console.log('[Creem Webhook] Status change:', {
  subscriptionId,
  oldStatus: dbRecord.status,
  newStatus: normalizedStatus,
  source: 'webhook'
});
```

### 2. Add Health Check

Create endpoint to verify sync:

**File**: `src/app/api/admin/check-subscription-sync/route.ts`

```typescript
export async function GET() {
  const payments = await paymentRepository.findAll();
  const mismatches = [];

  for (const pay of payments) {
    const creemResult = await creemService.getSubscription(pay.subscriptionId);
    if (creemResult.success) {
      const creemStatus = normalizeCreemStatus(creemResult.subscription.status);
      if (pay.status !== creemStatus) {
        mismatches.push({
          subscriptionId: pay.subscriptionId,
          dbStatus: pay.status,
          creemStatus,
        });
      }
    }
  }

  return NextResponse.json({
    totalSubscriptions: payments.length,
    mismatches: mismatches.length,
    details: mismatches,
  });
}
```

Run daily: `curl https://yourdomain.com/api/admin/check-subscription-sync`

### 3. Auto-Sync Cron Job

Run the sync script daily:

```bash
# Add to crontab
0 2 * * * cd /path/to/app && pnpm tsx scripts/sync-all-subscriptions-with-creem.ts >> logs/sync.log 2>&1
```

---

## Summary

1. ✅ **Run sync script**: `pnpm tsx scripts/sync-all-subscriptions-with-creem.ts`
2. ✅ **Verify statuses match** Creem dashboard
3. ✅ **Test upgrade** to Pro+
4. ⏳ **Investigate** why it happened (webhooks? manual edit?)
5. ⏳ **Set up monitoring** to prevent future mismatches

The sync script will fix everything automatically! 🚀
