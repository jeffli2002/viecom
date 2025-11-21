# Fix: Scheduled Upgrade Columns Missing

## Problem
When a Pro user upgrades to Pro+, the billing page doesn't show a notice like "Pro+ will take effect on ...". The database fields `scheduled_plan_id` and `scheduled_period_start` are empty.

## Root Cause
The migration adding the scheduled upgrade columns (`drizzle/0003_lethal_menace.sql`) exists but hasn't been run in your database.

## Solution

### Step 1: Check Current Database State

Run this SQL query to check if columns exist:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payment'
  AND column_name IN ('scheduled_plan_id', 'scheduled_interval', 'scheduled_period_start', 'scheduled_period_end', 'scheduled_at')
ORDER BY column_name;
```

Or use the provided script:
```bash
# You'll need to run this in your database client
cat scripts/check-scheduled-columns-simple.sql
```

### Step 2: Run Migration

**Option A: Using Drizzle Kit (Recommended)**

```bash
# Run pending migrations
pnpm db:migrate
```

**Option B: Manual SQL (If migration doesn't work)**

Connect to your database and run:

```sql
ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "scheduled_plan_id" text;
ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "scheduled_interval" text;
ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "scheduled_period_start" timestamp;
ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "scheduled_period_end" timestamp;
ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "scheduled_at" timestamp;
```

**Option C: Using Drizzle Studio**

```bash
# Open Drizzle Studio
pnpm db:studio

# Then manually add the columns through the UI
```

### Step 3: Verify Columns Exist

After running the migration, verify:

```sql
-- Should return 5 rows
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'payment'
  AND column_name LIKE 'scheduled_%';
```

### Step 4: Test the Upgrade Flow

1. **Create a test subscription** (or use existing Pro subscription)
2. **Upgrade to Pro+** from the billing page
3. **Check the database**:

```sql
SELECT 
  id,
  user_id,
  price_id as current_plan,
  scheduled_plan_id,
  scheduled_interval,
  scheduled_period_start,
  scheduled_period_end,
  period_end,
  status
FROM payment
WHERE user_id = 'YOUR_USER_ID'
ORDER BY updated_at DESC
LIMIT 1;
```

Expected result:
- `scheduled_plan_id` should be `'proplus'`
- `scheduled_interval` should be `'month'` or `'year'`
- `scheduled_period_start` should match `period_end` (when upgrade takes effect)

4. **Check the billing page** - Should now show:
   - Alert banner: "Plan Upgrade Scheduled: Pro+"
   - Effective date
   - Price and credits information

### Step 5: Verify API Response

Check what the API returns:

```bash
# Get subscription data (requires authentication cookie)
curl -X GET http://localhost:3000/api/creem/subscription \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -H "Content-Type: application/json" | jq
```

Should include:
```json
{
  "subscription": {
    "upcomingPlan": {
      "planId": "proplus",
      "interval": "month",
      "takesEffectAt": "2025-12-20T00:00:00.000Z",
      "changeType": "upgrade"
    }
  }
}
```

## Code Flow (For Reference)

1. **User clicks upgrade** → `BillingClient.tsx:handleUpgrade()`
2. **API call** → `POST /api/creem/subscription/{id}/upgrade`
3. **Database update** → Sets `scheduled_plan_id`, `scheduled_period_start`, etc.
4. **Billing page refresh** → Fetches subscription via `GET /api/creem/subscription`
5. **API reads scheduled fields** → `subscription/route.ts:160-199`
6. **Returns `upcomingPlan`** → `BillingClient.tsx:568` uses it
7. **Shows alert** → Lines 660-705 in `BillingClient.tsx`

## Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution**: Columns were added manually. Run:
```sql
-- Verify all 5 columns exist
SELECT COUNT(*) FROM information_schema.columns
WHERE table_name = 'payment' AND column_name LIKE 'scheduled_%';
-- Should return 5
```

### Issue: Upgrade API succeeds but scheduled fields still NULL
**Solution**: Check the upgrade route logs:
```bash
# In your application logs, look for:
[Creem Subscription Upgrade] Scheduled upgrade set:
```

If not logging, the update might be failing silently. Check:
1. Database connection is working
2. User has permission to update the payment table
3. The `paymentRepository.update()` call is succeeding

### Issue: Billing page doesn't show notice even with scheduled fields set
**Problem**: Frontend not detecting `upcomingPlan` from API

**Debug**:
1. Open browser console
2. Look for: `[Billing] Subscription data received:` log
3. Check if `upcomingPlan` is present and `hasUpcomingPlan: true`

If `upcomingPlan` is null but database has scheduled fields:
- Check `subscription/route.ts:160-199` - scheduled field reading logic
- Verify `activeSubscription.scheduledPlanId` is not undefined
- Check date comparison: `takesEffectTime > Date.now()` (line 179)

## Prevention

To prevent this issue in the future:

1. **Always run migrations in production** after deploying schema changes
2. **Use a migration checklist** (see CLAUDE.md)
3. **Add monitoring** for scheduled upgrades
4. **Test upgrade flow** in staging before production

## Files Modified

- ✅ `drizzle/0003_lethal_menace.sql` - Migration file (already exists)
- ✅ `src/server/db/schema.ts:147-151` - Schema definition
- ✅ `src/app/api/creem/subscription/[subscriptionId]/upgrade/route.ts:134-140` - Sets scheduled fields
- ✅ `src/app/api/creem/subscription/route.ts:160-199` - Reads scheduled fields
- ✅ `src/components/billing/BillingClient.tsx:660-705` - Displays upgrade notice

No code changes needed - just run the migration!
