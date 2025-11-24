# Frontend Upgrade Test Guide

## Problem
Getting 403 Forbidden error when clicking "Upgrade to Pro+" button.

## Root Cause
The `payment.userId` in database doesn't match the logged-in user's `session.user.id`.

## Step-by-Step Fix

### Option 1: Use Drizzle Studio (Recommended - Visual)

1. **Open Drizzle Studio**:
   ```bash
   pnpm db:studio
   ```
   This opens a web UI at `http://localhost:4983` or similar

2. **Check the payment table**:
   - Find the row where `subscriptionId = 'sub_5EM6IgULEBVjEtMx5OH0TT'`
   - Look at the `userId` column
   - Write down this userId value

3. **Check the user table**:
   - Find the row where `email = 'jefflee2002@gmail.com'`
   - Look at the `id` column
   - Write down this id value

4. **Compare the IDs**:
   - If `payment.userId` ≠ `user.id` → This is the problem\!
   - If they match → The problem is something else (maybe you're not logged in as this user)

5. **Fix if they don't match**:
   In Drizzle Studio:
   - Go to payment table
   - Find the subscription row
   - Edit the `userId` field
   - Change it to match the user table's `id`
   - Save

### Option 2: Direct Database Access (If you have database client)

Connect to your Neon database using any PostgreSQL client and run:

```sql
-- Check what's in the database
SELECT 
  p.userId as payment_userId,
  p.subscriptionId,
  u.id as user_table_id,
  u.email
FROM payment p
LEFT JOIN "user" u ON p.userId = u.id
WHERE p.subscriptionId = 'sub_5EM6IgULEBVjEtMx5OH0TT';

-- If user IDs don't match, fix it:
UPDATE payment 
SET "userId" = (SELECT id FROM "user" WHERE email = 'jefflee2002@gmail.com')
WHERE "subscriptionId" = 'sub_5EM6IgULEBVjEtMx5OH0TT';
```

### Option 3: Check via Application Code

Add temporary logging to see what's happening:

1. **Check who you're logged in as**:
   - Open your app in browser: `http://localhost:3000`
   - Open browser DevTools → Console
   - Type: `document.cookie`
   - Look for Better Auth session cookie

2. **Check the upgrade endpoint logs**:
   - When you click "Upgrade to Pro+", check terminal logs
   - Should see:
     ```
     [Creem Subscription Upgrade] Found payment record:
     paymentUserId: xxx
     sessionUserId: yyy
     ```
   - If xxx ≠ yyy → That's the mismatch

## Expected Results After Fix

Once user IDs match:

1. **Click "Upgrade to Pro+" button**
2. **Should see success message**: "Subscription will be upgraded at the end of current period"
3. **Purple alert appears**: "Plan Upgrade Scheduled: Pro+ will take effect on Dec 19, 2025"
4. **Database shows**:
   - `priceId` = "pro" (unchanged)
   - `scheduledPlanId` = "proplus" (new)
   - `scheduledPeriodStart` = "2025-12-19" (when it takes effect)

## Common Issues

### Issue 1: Not logged in as the right user
**Symptom**: User IDs match in database, but still get 403

**Solution**: 
- Log out from the app
- Log in as `jefflee2002@gmail.com`
- Try upgrade again

### Issue 2: Subscription doesn't exist
**Symptom**: Can't find subscription in database

**Solution**:
- The subscription needs to be created first
- Check if you've completed checkout/signup flow
- Or manually create subscription record in database

### Issue 3: Multiple active subscriptions
**Symptom**: Database has multiple rows with same userId

**Solution**:
- Only one subscription should have `status = 'active'`
- Cancel other subscriptions
- Or fix the data to have single active subscription

## Test Plan

After fixing user ID mismatch:

1. ✅ Log in as `jefflee2002@gmail.com`
2. ✅ Navigate to `/billing` or `/settings/billing`
3. ✅ Should see current plan: "Pro" 
4. ✅ Click "Upgrade to Pro+" button
5. ✅ Should NOT get 403 error
6. ✅ Should see purple alert with scheduled upgrade date
7. ✅ Check database: `scheduledPlanId = 'proplus'`

## Quick Start

**Easiest approach**: Use Drizzle Studio

```bash
# Terminal 1: Keep dev server running
pnpm dev

# Terminal 2: Open Drizzle Studio
pnpm db:studio

# Then follow Option 1 steps above
```
