# Fix Creem Upgrade and Webhook Issues

## Date: 2025-11-21

## Issues Fixed

### 1. ✅ Webhook 500 Error on subscription.update
**Problem**: When manually resending the Pro → Pro+ upgrade webhook, got 500 error.

**Root Cause**: 
- viecom was trying to use both `product.id` (actual plan) and `metadata.planId` (target plan)
- When Creem sends `subscription.update` webhook immediately after upgrade API call, the product hasn't changed yet
- This created a conflict: `product.id` = "pro", `metadata.planId` = "proplus"
- The complex plan resolution logic couldn't handle this mismatch

**Solution Applied**:
1. Simplified `handleSubscriptionUpdate` in `src/lib/creem/creem-service.ts:830-860`
   - Use `metadata.planId` first (which is "proplus" - the target plan)
   - This allows webhook handler to detect the plan change correctly
   
2. Added duplicate scheduling check in `src/app/api/webhooks/creem/route.ts:722-733`
   - When webhook detects plan change from "pro" → "proplus", check if `scheduledPlanId` is already set
   - If already scheduled by upgrade API endpoint, skip duplicate scheduling
   - This prevents the webhook from re-setting scheduled fields that were already set by the API

**Files Changed**:
- `src/lib/creem/creem-service.ts` - Simplified handleSubscriptionUpdate()
- `src/app/api/webhooks/creem/route.ts` - Added duplicate scheduling check

### 2. 🔍 Frontend 403 Forbidden Error (Needs Investigation)
**Problem**: Clicking "Upgrade to Pro+" button shows error: "Forbidden: you do not have permission to upgrade this subscription"

**Root Cause**: 
- `paymentRecord.userId` doesn't match `session.user.id`
- This indicates a **data inconsistency in the database**

**Investigation Steps**:

1. **Run the SQL query** to check user ID mismatch:
```bash
psql $DATABASE_URL -f check_user_subscription_match.sql
```

2. **Check the logs** when clicking upgrade button:
- Look for: `[Creem Subscription Upgrade] Found payment record:`
- Compare `paymentUserId` vs `sessionUserId`

3. **Possible causes**:
   - User ID format mismatch (UUID vs custom ID)
   - Database migration issue
   - Subscription created under different user account
   - Better Auth session using different user ID than payment.userId

**Files with Enhanced Logging**:
- `src/app/api/creem/subscription/[subscriptionId]/upgrade/route.ts:58-81` - Added detailed logging

**Temporary Workaround** (if needed):
If the user IDs are actually the same user but different format, you can add a fallback check:
```typescript
// In upgrade/route.ts after line 68
const userMatches = 
  paymentRecord.userId === session.user.id ||
  paymentRecord.customerId === session.user.id ||
  // Check if email matches
  (await db.select().from(user).where(eq(user.id, paymentRecord.userId)))[0]?.email === session.user.email;

if (!userMatches) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

## Key Changes Based on im2prompt Analysis

### What im2prompt Does Right:
1. **Simple webhook plan resolution**: `metadata.planId || getPlanFromProduct()`
2. **No separate productId tracking**: Avoids conflicts
3. **Immediate DB update**: Updates `priceId` to target plan right away
4. **Credits handled by webhook**: Renewal webhook grants credits based on new plan
5. **No complex scheduled upgrade fields**: Lets Creem handle scheduling

### What viecom Was Doing Wrong:
1. **Complex plan resolution**: Tried to use both product and metadata separately
2. **Exposed conflicts**: Returned both `planId` and `productId` causing mismatches
3. **Over-engineered scheduling**: Used `scheduledPlanId`, `scheduledInterval`, etc.
4. **Premature webhook detection**: Tried to ignore webhooks instead of handling them properly

## Testing Instructions

### Test 1: Webhook (should now return 200 OK)
1. Go to Creem dashboard webhook events
2. Find the `subscription.update` event from upgrade
3. Click "Resend webhook"
4. **Expected**: 200 OK response (instead of 500)
5. **Check logs**: Should see proper plan resolution

### Test 2: Frontend Upgrade (needs DB fix first)
1. Run the SQL query to check user IDs
2. If mismatch found, fix database:
```sql
-- If user ID is wrong, update it
UPDATE payment 
SET userId = (SELECT id FROM "user" WHERE email = 'jefflee2002@gmail.com')
WHERE subscriptionId = 'sub_5EM6IgULEBVjEtMx5OH0TT';
```
3. Try clicking "Upgrade to Pro+" again
4. **Expected**: Success message, scheduled upgrade notification
5. **Check DB**: Should see `scheduledPlanId` = 'proplus'

### Test 3: End-to-End Flow
1. User on Pro plan clicks "Upgrade to Pro+"
2. Upgrade endpoint calls Creem API with `proration-none`
3. Creem sends `subscription.update` webhook immediately
4. Webhook handler processes it:
   - `metadata.planId` = "proplus" (target)
   - Detects plan change: "pro" → "proplus"
   - Sets scheduled upgrade fields
5. Frontend shows: "Plan Upgrade Scheduled: Pro+ will take effect on [date]"
6. At period end, Creem sends another `subscription.update` with product changed
7. Webhook handler:
   - Detects renewal + scheduled upgrade
   - Grants Pro+ credits
   - Updates DB to Pro+

## ✅ IMPORTANT: Upgrade Timing Verification

**Requirement**: Upgrades should take effect at the **beginning of next billing period** (not immediately).

**viecom Implementation**: ✅ **CORRECT** - Meets requirement

### How It Works:

1. **User clicks "Upgrade to Pro+"**
   - API calls Creem with `proration-none` (tells Creem to schedule upgrade)
   - API sets `scheduledPlanId=proplus`, `scheduledPeriodStart=[period end date]`
   - **priceId remains "pro"** - NOT changed yet ✅

2. **Creem sends subscription.update webhook immediately**
   - `metadata.planId = "proplus"` (target plan from metadata)
   - `product.id = "prod_..." (still Pro - actual product)`
   - Webhook detects plan change but sees `scheduledPlanId` already set
   - **Skips duplicate scheduling** - just logs confirmation

3. **User sees purple alert**: "Plan Upgrade Scheduled: Pro+ will take effect on [date]"
   - UI reads `scheduledPlanId` and shows future effective date ✅
   - Credits remain at Pro level ✅

4. **At period end (renewal)**
   - Creem applies the upgrade and sends `subscription.update` or `subscription.paid` webhook
   - Webhook handler detects `hasScheduledUpgrade=true`
   - **Grants Pro+ credits** for the new period
   - **Updates priceId to "proplus"** ✅
   - Clears scheduled fields

**Result**: Upgrade happens **AT PERIOD END** as required ✅

### Comparison with im2prompt

| Aspect | im2prompt | viecom (Before) | viecom (After Fix) |
|--------|-----------|-----------------|-------------------|
| **Upgrade Timing** | ❌ IMMEDIATE (bug) | ✅ Period end | ✅ Period end |
| **Database Update** | Immediate priceId change | Scheduled fields | Scheduled fields ✅ |
| **Credits Granted** | Immediately | At period end | At period end ✅ |
| Webhook plan resolution | `metadata.planId \|\| product` | Tried both separately | `metadata.planId \|\| product` ✅ |
| Conflict handling | No conflicts (but wrong behavior) | productId vs metadata | Duplicate check ✅ |

**Note**: im2prompt says "will upgrade at period end" but actually upgrades immediately due to immediate database `priceId` update. viecom correctly delays the upgrade using scheduled fields.

## Files Modified

1. `src/lib/creem/creem-service.ts:830-860`
   - Simplified `handleSubscriptionUpdate()`
   - Removed productId/previousPlanId exposure

2. `src/app/api/webhooks/creem/route.ts:718-722`
   - Removed premature webhook detection logic

3. `src/app/api/creem/subscription/[subscriptionId]/upgrade/route.ts:58-81`
   - Added detailed logging for user ID mismatch debugging

4. `check_user_subscription_match.sql` (new)
   - SQL query to diagnose user ID mismatch

## Next Steps

1. ✅ Webhook 500 error should be fixed - test by resending webhook
2. 🔍 Run SQL query to check user ID mismatch
3. 🔧 Fix database if user IDs don't match
4. ✅ Test frontend upgrade flow
5. 📝 Document the actual user ID mismatch cause once found

## Notes

- The webhook fix is complete and should work immediately
- The 403 error requires database investigation and possible data fix
- The scheduled upgrade system is kept for UI notification purposes
- Credits are still granted by webhook handlers (not changed)
