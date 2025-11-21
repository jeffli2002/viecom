# Debug Webhook 500 Error

## ✅ Your Configuration is Correct
```bash
CREEM_WEBHOOK_SECRET="whsec_1Fjrs44z8YRXHr0DKiA9z3"  # Correct format
```

## Possible Causes for 500 Error Still Happening

### 1. Dev Server Not Restarted ⚠️
The code changes are saved but **server is still running old code**.

**Solution:**
```bash
# Kill the dev server
pkill -f "next dev"

# Wait a moment
sleep 2

# Restart
pnpm dev

# OR use your PowerShell script:
.\start-dev.ps1
```

### 2. Different Error After Code Changes
The 500 might now be a **different error**. Need to see actual error logs.

**Check server console** when webhook arrives. Look for:
```
[Creem Webhook] handleSubscriptionUpdate called with: ...
[Creem Webhook] Error in handleSubscriptionUpdate: ...
```

### 3. Database Issue
The webhook might be failing when trying to query/update database.

**Common issues:**
- `targetSubscription` not found
- `scheduledPlanId` field doesn't exist in database
- User ID mismatch

### 4. Missing Subscription in Database
The webhook references `sub_5EM6IgULEBVjEtMx5OH0TT` but it might not exist in your `payment` table.

**Check:**
```sql
SELECT * FROM payment 
WHERE subscriptionId = 'sub_5EM6IgULEBVjEtMx5OH0TT';
```

## Step-by-Step Debug

### Step 1: Restart Dev Server (REQUIRED)
```bash
pkill -f "next dev" && sleep 2 && pnpm dev
```

### Step 2: Watch Server Logs
Keep terminal visible to see logs when webhook arrives.

### Step 3: Resend Webhook
From Creem dashboard, resend the subscription.update event.

### Step 4: Check What Logs Appear

**If you see:**
```
[SECURITY] Invalid webhook signature detected
```
→ Webhook secret mismatch (but yours looks correct)

**If you see:**
```
[Creem Webhook] handleSubscriptionUpdate called with: ...
```
→ Code changes applied ✅, but failing later

**If you see:**
```
[Creem Webhook] Error in handleSubscriptionUpdate: ...
```
→ Share this full error message for diagnosis

**If you see nothing:**
→ Webhook not reaching your server (check ngrok/URL)

## Most Likely Issue

Based on your situation: **Dev server needs restart**.

The files are updated but Next.js hasn't hot-reloaded the API routes.

## Quick Test Checklist

After restarting server, webhook should show different behavior:

- ❌ Before: Generic 500, no helpful logs
- ✅ After: Specific error message, or 200 OK with logs

If still 500 with **no new logs**, the webhook might not be reaching the updated code.

## Next Step

**Restart server and share the actual error logs** from terminal when webhook hits.
