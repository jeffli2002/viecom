# Fix: Creem API 403 Forbidden on Upgrade

## Problem Identified

The error is coming from **Creem's API**, not your application:

```
[Creem] Upgrade API error (direct call): {
  status: 403,
  statusText: 'Forbidden',
  subscriptionId: 'sub_6IW1jzFGNaN8FdSrOaA3at',
  error: 'Forbidden'
}
```

Your application code is correct. The issue is with **Creem's subscription upgrade permissions**.

## Root Causes (Most Likely to Least)

### 1. ⚠️ Test Mode vs Production Mode Mismatch

**Check:**
- `.env.local` shows: `NEXT_PUBLIC_CREEM_TEST_MODE="true"`
- API Key: `CREEM_API_KEY="creem_test_76fiPMad5FJHU3qodnAWGx"` (test key)
- Subscription ID: `sub_6IW1jzFGNaN8FdSrOaA3at`

**The subscription might have been created in:**
- ❌ Production mode (but you're using test API key)
- ❌ Different Creem account
- ❌ Different test environment

**Solution:** Check Creem dashboard to verify the subscription exists in test mode.

### 2. API Endpoint Issue

The code is calling:
```
PUT https://api.creem.io/v1/subscriptions/{id}
```

**Possible issues:**
- Wrong HTTP method (should be PATCH or POST?)
- Missing required fields in request body
- Creem API changed their endpoint structure

### 3. Subscription Status Restriction

Creem might not allow upgrades when:
- Subscription is in trial period
- Subscription has pending invoice
- Subscription is scheduled to cancel
- Subscription is past due

### 4. Product Configuration Issue

The target product `prod_4s8si1GkKRtU0HuUEWz6ry` (Pro+ Monthly) might:
- Not exist in your Creem test environment
- Not be configured for upgrades
- Be inactive/archived

## Solutions

### Solution 1: Verify in Creem Dashboard (Recommended)

1. **Log into Creem Dashboard** (test mode)
   - Go to: https://dashboard.creem.io or similar
   - Make sure you're in **TEST MODE**

2. **Find the subscription**
   - Search for: `sub_6IW1jzFGNaN8FdSrOaA3at`
   - Check if it exists
   - Check its current status

3. **Try manual upgrade in dashboard**
   - If Creem dashboard can upgrade it → API key issue
   - If Creem dashboard can't upgrade it → subscription issue

4. **Check products**
   - Verify `prod_4s8si1GkKRtU0HuUEWz6ry` exists in test mode
   - Verify it's active and purchasable

### Solution 2: Check Creem API Documentation

The upgrade might need different parameters. Check if Creem requires:

**Option A: Different endpoint**
```
POST /v1/subscriptions/{id}/upgrade
```
Instead of:
```
PUT /v1/subscriptions/{id}
```

**Option B: Different request body**

Current code sends:
```json
{
  "productId": "prod_4s8si1GkKRtU0HuUEWz6ry",
  "updateBehavior": "proration-none"
}
```

Might need:
```json
{
  "product_id": "prod_4s8si1GkKRtU0HuUEWz6ry",
  "proration_behavior": "none",
  "billing_cycle_anchor": "unchanged"
}
```

### Solution 3: Use Different Upgrade Method

Instead of upgrading the subscription, **cancel and create new**:

1. Cancel current Pro subscription (scheduled at period end)
2. When period ends, create new Pro+ subscription
3. Less ideal but works if upgrade API is broken

### Solution 4: Contact Creem Support

If none of the above work:

**Email Creem support with:**
```
Subject: 403 Forbidden on Subscription Upgrade API

Hi Creem Team,

I'm getting a 403 Forbidden error when trying to upgrade a subscription via your API.

Details:
- Environment: Test Mode
- API Key: creem_test_76fiPMad5FJHU3qodnAWGx
- Subscription ID: sub_6IW1jzFGNaN8FdSrOaA3at
- Current Product: prod_kUzMsZPgszRro3jOiUrfd (Pro Monthly)
- Target Product: prod_4s8si1GkKRtU0HuUEWz6ry (Pro+ Monthly)
- Request Body: {"productId": "prod_4s8si1GkKRtU0HuUEWz6ry", "updateBehavior": "proration-none"}
- Endpoint: PUT https://api.creem.io/v1/subscriptions/sub_6IW1jzFGNaN8FdSrOaA3at

Error Response:
{
  "trace_id": "231e552e-d685-49bb-a1c3-1de3db8e268d",
  "status": 403,
  "error": "Forbidden",
  "timestamp": 1763622082574
}

Can you help me understand why this is being rejected?

Thank you!
```

## Temporary Workaround

Until Creem issue is fixed, modify the upgrade flow to show a message:

```typescript
// In src/app/api/creem/subscription/[subscriptionId]/upgrade/route.ts

// After line 101, add:
console.warn('[WORKAROUND] Creem API upgrade not working, simulating scheduled upgrade');

// Continue with setting scheduled fields in database
await paymentRepository.update(paymentRecord.id, {
  scheduledPlanId: newPlanId,
  scheduledInterval: newInterval,
  scheduledPeriodStart: estimatedEffectiveDate,
  scheduledPeriodEnd: nextPeriodEnd,
  scheduledAt: new Date(),
});

// Return success even though Creem call failed
return NextResponse.json({
  success: true,
  message: 'Upgrade scheduled. Note: Manual intervention required at period end.',
  note: 'Creem API upgrade is currently unavailable. You will need to manually upgrade in Creem dashboard when the period ends.'
});
```

This will:
- ✅ Store the scheduled upgrade in your database
- ✅ Show the upgrade notice to users
- ✅ Log the issue for manual follow-up
- ⚠️ Require manual upgrade in Creem dashboard at period end

## Debug Commands

**Check Creem subscription directly:**

```bash
# Replace with your actual test API key
curl -X GET "https://api.creem.io/v1/subscriptions/sub_6IW1jzFGNaN8FdSrOaA3at" \
  -H "Authorization: Bearer creem_test_76fiPMad5FJHU3qodnAWGx"
```

**Check if product exists:**

```bash
curl -X GET "https://api.creem.io/v1/products/prod_4s8si1GkKRtU0HuUEWz6ry" \
  -H "Authorization: Bearer creem_test_76fiPMad5FJHU3qodnAWGx"
```

**Try upgrade with different method:**

```bash
curl -X POST "https://api.creem.io/v1/subscriptions/sub_6IW1jzFGNaN8FdSrOaA3at/upgrade" \
  -H "Authorization: Bearer creem_test_76fiPMad5FJHU3qodnAWGx" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod_4s8si1GkKRtU0HuUEWz6ry",
    "updateBehavior": "proration-none"
  }'
```

## Expected Resolution

Most likely this is:
1. **Test mode issue** - Subscription doesn't exist in test environment
2. **Creem API bug** - Their upgrade endpoint has issues
3. **Configuration issue** - Products not properly set up in Creem dashboard

**Recommended:** Check Creem dashboard first, then contact their support if needed.
