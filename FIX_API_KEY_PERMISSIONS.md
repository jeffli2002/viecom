# Fix: API Key Needs Write Permissions

## Problem Confirmed
- ✅ Manual upgrade works in Creem Dashboard
- ✅ Product ID is correct
- ✅ Subscription exists and is active
- ❌ API call returns 403 Forbidden

**This means:** Your API key doesn't have permission to modify subscriptions.

## Solution: Update API Key Permissions

### Step 1: Go to Creem Dashboard
1. Open Creem Dashboard
2. Make sure you're in **Test Mode** (toggle in top-right)
3. Go to **Settings** or **Developers** → **API Keys**

### Step 2: Check Your Current API Key

Find the API key that starts with `creem_test_...` (first 10 chars from your .env.local)

**Check its permissions:**
- Does it have **"Write"** access?
- Does it have **"Subscriptions"** permission?

**If permissions are limited (Read-only):**
- You need to create a new API key with write access
- Or update the existing key's permissions (if Creem allows)

### Step 3: Create New API Key with Full Permissions

1. **Click "Create API Key"** or "New API Key"
2. **Name it:** Something like "Dev Server - Full Access"
3. **Select permissions:**
   - ✅ **Read** - Subscriptions
   - ✅ **Write** - Subscriptions ← **This is critical\!**
   - ✅ Read/Write - Customers
   - ✅ Read/Write - Products
4. **Set mode:** Test Mode
5. **Click Create**
6. **Copy the API key** (you'll only see it once\!)

### Step 4: Update Your .env.local

```bash
# Replace with the new API key:
CREEM_API_KEY="creem_test_NEW_KEY_HERE"
```

### Step 5: Restart Dev Server

```powershell
# Stop current dev server (Ctrl+C)
# Restart:
pnpm dev
```

### Step 6: Test Upgrade Again

1. Refresh browser
2. Go to billing page
3. Click "Upgrade to Pro+"
4. **Should work now\!** ✅

## Expected Result After Fix

**Terminal logs:**
```
[Creem] Upgrading subscription: sub_5EM6IgULEBVjEtMx5OH0TT to proplus_monthly
[Creem] Upgrade scheduled
[Creem Subscription Upgrade] Scheduled upgrade set:
  currentPlan: pro
  scheduledPlan: proplus
  takesEffectAt: 2025-12-19T01:11:55.000Z
```

**Browser:**
- ✅ Success toast message
- ✅ Purple alert: "Plan Upgrade Scheduled: Pro+ will take effect on Dec 19, 2025"

**Database (in Drizzle Studio):**
- `scheduledPlanId` = "proplus"
- `scheduledPeriodStart` = "2025-12-19..."
- `priceId` still = "pro" (unchanged until period end)

## Common API Key Permission Issues

### Issue 1: Read-Only Key
Some API keys are created with read-only access by default.

**Symptoms:**
- ✅ Can fetch subscription data
- ❌ Can't upgrade/modify subscriptions (403)

**Fix:** Create key with write permissions

### Issue 2: Limited Scope
Key might have permissions for some resources but not subscriptions.

**Symptoms:**
- ✅ Can create customers
- ❌ Can't modify subscriptions (403)

**Fix:** Add "Subscriptions - Write" permission

### Issue 3: Test vs Production Key Mismatch
Using production key for test subscriptions (or vice versa).

**Symptoms:**
- API calls return 403 or 404
- Dashboard shows subscription but API can't find it

**Fix:** Ensure key mode matches subscription mode

## Verify Permissions

After updating the key, you can verify it works:

**Quick test in terminal:**
```bash
# Test API key by fetching subscription (should work with read permission)
curl -X GET "https://api.creem.io/v1/subscriptions/sub_5EM6IgULEBVjEtMx5OH0TT" \
  -H "Authorization: Bearer YOUR_NEW_API_KEY"

# Should return subscription data, not 403
```

## If Still 403 After New Key

1. **Double-check key was copied correctly** to .env.local
2. **Restart dev server** (env changes require restart)
3. **Clear browser cache** and refresh
4. **Contact Creem support** - might be account-level restriction

## Alternative: Use Creem SDK Method

If direct API calls keep failing, try using Creem's SDK upgrade method:

The code already has this as fallback (line 326-337 in creem-service.ts), but if SDK fails it falls back to direct API call.

Make sure `creem` npm package is installed:
```bash
pnpm add creem
```

Then the SDK will be used first, which might have better error handling.
