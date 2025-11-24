# Contact Creem Support with Trace ID

## The Issue

Your code is working perfectly, but Creem's API is returning 403 Forbidden when trying to upgrade a subscription via API, even though:
- ✅ Manual upgrade works in Creem Dashboard
- ✅ Product ID is correct
- ✅ Subscription is active
- ✅ API key is for test mode
- ✅ All configuration is correct

## Creem's Response

```json
{
  "trace_id": "7fbb7127-bd43-4185-ab1d-d591cd5982e4",
  "status": 403,
  "error": "Forbidden"
}
```

## What to Do

### Option 1: Check Creem Dashboard Logs

1. Go to Creem Dashboard
2. Look for **"Logs"** or **"API Logs"** or **"Events"** section
3. Search for trace ID: `7fbb7127-bd43-4185-ab1d-d591cd5982e4`
4. Click on that log entry
5. **It should show the actual reason** for the 403 error

Common reasons shown in logs:
- "API key does not have permission to modify subscriptions"
- "Subscription already has pending changes"
- "Product not compatible with current subscription"
- "Account in restricted mode"

### Option 2: Contact Creem Support

Since manual upgrade works but API doesn't, this might be an account restriction.

**Email Creem Support with:**

```
Subject: API Returns 403 for Subscription Upgrade (Works in Dashboard)

Hi Creem Support,

I'm trying to upgrade a test subscription via your API but getting 403 Forbidden, 
even though the same upgrade works when done manually in the dashboard.

Details:
- Subscription ID: sub_5EM6IgULEBVjEtMx5OH0TT
- Target Product ID: prod_4s8si1GkKRtU0HuUEWz6ry
- API Key: creem_test_... (test mode)
- Trace ID: 7fbb7127-bd43-4185-ab1d-d591cd5982e4
- Endpoint: POST /v1/subscriptions/{id}/upgrade
- Request Body: { product_id: "prod_4s8si1GkKRtU0HuUEWz6ry", update_behavior: "proration-none" }

Error Response: 403 Forbidden

Questions:
1. Why does manual upgrade work but API upgrade returns 403?
2. Does my API key need special permissions?
3. Is there an account-level restriction?

Please check the trace_id above in your logs for the actual reason.

Thank you\!
```

### Option 3: Try Alternative - Cancel Current & Create New

If API upgrade is blocked, you could implement an alternative flow:

**For users upgrading from Pro to Pro+:**
1. Keep current Pro subscription running until period end
2. At period end, cancel Pro and create new Pro+ subscription
3. This avoids the upgrade API entirely

**Code already handles this with `scheduledPlanId` fields**, but instead of calling Creem upgrade API, you would:
- Set scheduled fields in your database
- At period end, call Creem cancel + create new subscription
- This is more complex but bypasses the upgrade API

### Option 4: Check if Account is in Testing/Restricted Mode

Some payment providers restrict certain API operations during:
- Account setup phase
- First X days of account creation
- While account is being reviewed
- If account verification is incomplete

**Check:**
1. Creem Dashboard → Account Settings
2. Look for any warnings, restrictions, or "verify account" messages
3. Check if there's an account status indicator

## Most Likely Solutions

Based on similar issues with payment APIs:

**Solution A: Regenerate API Key**
Even though you can't see permissions, try creating a fresh API key:
1. Creem Dashboard → API Keys
2. Click "Create New Key" or "Generate Key"
3. Copy the new key
4. Update .env.local with new key
5. Restart dev server
6. Test again

Sometimes keys get into a weird state even though they look fine.

**Solution B: Use Different Endpoint**

Creem might have multiple ways to upgrade:
- `/subscriptions/{id}/upgrade` (current - returns 403)
- `/subscriptions/{id}/update` (try this instead)
- `/subscriptions/{id}/items` (update subscription items)

Let me know if you want me to try implementing an alternative API call method.

## Quick Test: Can You Create/Cancel via API?

Let's verify your API key works for other operations:

**Test in browser console (on your app page):**
```javascript
// Test: Can you fetch subscription? (read permission)
fetch('/api/creem/subscription')
  .then(r => r.json())
  .then(console.log)
// Expected: Should return subscription data ✅

// If that works, read permission is fine
// Problem is specifically with write/upgrade permission
```

If read works but write doesn't, it's definitely a permission issue that Creem support needs to resolve.
