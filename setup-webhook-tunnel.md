# Fix: Webhook Not Reaching Dev Server

## Problem
Your dev server is running on `localhost:3000`, but Creem webhooks are trying to reach a public URL that isn't forwarding to your local server.

## Solution: Start ngrok Tunnel

### Step 1: Start ngrok
```bash
# In a NEW terminal window (keep pnpm dev running in the other)
ngrok http 3000
```

You should see output like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

### Step 2: Update Creem Webhook URL

1. Copy the `https://abc123.ngrok.io` URL from ngrok
2. Go to Creem Dashboard → Developers → Webhooks
3. Update your webhook endpoint URL to:
   ```
   https://abc123.ngrok.io/api/webhooks/creem
   ```
4. Save the webhook settings

### Step 3: Test Webhook Again

Now when you resend the webhook from Creem dashboard:
- ✅ It will go to: `https://abc123.ngrok.io/api/webhooks/creem`
- ✅ ngrok forwards to: `http://localhost:3000/api/webhooks/creem`
- ✅ Your dev server processes it
- ✅ You'll see logs in your `pnpm dev` terminal

## Alternative: Skip Webhook Testing, Test Frontend Instead

If you don't want to set up ngrok right now, you can skip webhook testing and go straight to testing the frontend upgrade button (Step 2):

1. **First, fix the 403 error** by running the SQL query:
   ```bash
   psql $DATABASE_URL -f check-subscription-exists.sql
   ```

2. **Check if user IDs match**
   - Compare `payment.userId` with user table `id`
   - If they don't match, update the database

3. **Test frontend upgrade**
   - Click "Upgrade to Pro+" button
   - Should show purple alert with scheduled date

## Why Webhooks Work in Production

In production (deployed to Vercel/similar):
- Your app has a public URL: `https://yourdomain.com`
- Creem sends webhooks to: `https://yourdomain.com/api/webhooks/creem`
- No tunnel needed ✅

In development:
- Your app is on `localhost:3000` (not accessible from internet)
- Need ngrok to create a tunnel from public internet to localhost
- Creem sends to: `https://abc123.ngrok.io/api/webhooks/creem` → ngrok → `localhost:3000`

## Current Status

- ✅ Code fixes applied correctly
- ✅ Dev server running
- ❌ ngrok tunnel NOT running (this is why webhooks fail)
- ❌ Creem can't reach localhost:3000 from the internet

## Quick Decision

**Option A**: Set up ngrok (5 minutes) → Test webhooks work
**Option B**: Skip webhooks for now → Test frontend upgrade directly

I recommend **Option B** - test the frontend upgrade button instead, since that's what you actually care about working.
