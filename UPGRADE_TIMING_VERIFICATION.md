# Upgrade Timing Verification - Period End Requirement

## ✅ Confirmation: viecom Correctly Implements Delayed Upgrades

**Your Requirement**: Upgrades should take effect at the **beginning of next billing period** (not immediately).

**Status**: ✅ **CORRECTLY IMPLEMENTED** - Your implementation is correct and meets the requirement.

## How viecom Handles Upgrades (Step by Step)

### Step 1: User Clicks "Upgrade to Pro+"

**API Endpoint**: `/api/creem/subscription/[subscriptionId]/upgrade`

```typescript
// Line 104-108: Call Creem API with proration-none
const result = await creemService.upgradeSubscription(
  subscriptionId,
  newProductKey,
  false // useProration = false → updateBehavior: 'proration-none'
);

// Line 151-157: Set scheduled fields in database
await paymentRepository.update(paymentRecord.id, {
  scheduledPlanId: 'proplus',           // Target plan
  scheduledInterval: 'month',
  scheduledPeriodStart: '2025-12-19',   // When it takes effect
  scheduledPeriodEnd: '2026-01-19',     // End of new period
  scheduledAt: new Date(),
  // NOTE: priceId STAYS AS "pro" - NOT changed yet ✅
});
```

**Result**:
- ✅ Database still shows `priceId: "pro"` (current plan)
- ✅ Database has `scheduledPlanId: "proplus"` (future plan)
- ✅ No credits granted yet
- ✅ User's subscription capabilities remain at Pro level

### Step 2: Creem Sends Immediate Webhook

**Webhook**: `subscription.update` event arrives immediately after API call

**Webhook Payload**:
```json
{
  "eventType": "subscription.update",
  "object": {
    "product": {
      "id": "prod_kUzMsZPgszRro3jOiUrfd"  // Still Pro product
    },
    "metadata": {
      "planId": "proplus",     // Target plan
      "currentPlan": "pro"      // Current plan
    }
  }
}
```

**Webhook Handler Logic**:
```typescript
// Line 848: Extract planId from metadata (returns "proplus")
const planId = metadata?.planId || this.getPlanFromProduct(productId);

// Line 719-720: Detect plan change
const planChanged = oldPlanId !== newPlanId;  // "pro" !== "proplus" → true

// Line 724-726: Check if already scheduled
const alreadyScheduled = 
  targetSubscription.scheduledPlanId &&     // "proplus" exists
  targetSubscription.scheduledPlanId === newPlanId;  // "proplus" === "proplus" → true

// Line 728-733: Skip duplicate scheduling
if (alreadyScheduled) {
  console.log("Scheduled upgrade already set by API endpoint. Skipping duplicate scheduling.");
  // Don't set scheduled fields again - they're already set by the upgrade endpoint
}
```

**Result**:
- ✅ Webhook recognizes this is a scheduled upgrade notification
- ✅ No duplicate scheduled fields set
- ✅ No credits granted
- ✅ Database remains unchanged (priceId still "pro")

### Step 3: User Sees Notification

**Frontend**: Billing page displays purple alert

```typescript
// BillingClient.tsx reads subscription data
const subscription = {
  planId: "pro",                    // Current plan
  scheduledPlanId: "proplus",       // Future plan
  scheduledPeriodStart: "2025-12-19"  // When it takes effect
};

// UI displays:
// "Plan Upgrade Scheduled: Pro+ will take effect on Dec 19, 2025"
```

**Result**:
- ✅ User sees clear notification about future upgrade
- ✅ User still has Pro-level features (500 credits/month)
- ✅ No Pro+ credits granted yet

### Step 4: Period End - Upgrade Takes Effect

**Webhook**: At period end (Dec 19, 2025), Creem sends `subscription.update` or `subscription.paid` webhook

**Webhook Payload** (at renewal):
```json
{
  "eventType": "subscription.update",
  "object": {
    "product": {
      "id": "prod_NEW_PROPLUS_ID"  // NOW shows Pro+ product
    },
    "current_period_end_date": "2026-01-19",  // New period
    "metadata": {
      "planId": "proplus"
    }
  }
}
```

**Webhook Handler Logic**:
```typescript
// Line 849-865: Detect renewal + scheduled upgrade
const hasRenewed = 
  newStatus === 'active' &&
  nextPeriodEnd &&
  previousPeriodEnd &&
  nextPeriodEnd.getTime() - previousPeriodEnd.getTime() > 60 * 1000;

const hasScheduledUpgrade =
  targetSubscription.scheduledPlanId &&
  targetSubscription.scheduledPeriodStart &&
  nextPeriodEnd &&
  new Date(targetSubscription.scheduledPeriodStart).getTime() <= nextPeriodEnd.getTime();

if (hasRenewed && hasScheduledUpgrade) {
  // Line 867-873: Grant Pro+ credits for the new period
  await grantSubscriptionCredits(
    actualUserId,
    'proplus',      // Grant Pro+ credits (900)
    targetSubscription.id,
    'month',
    false           // Not a renewal, it's a plan upgrade
  );

  // Line 876-890: Update database to Pro+
  await paymentRepository.update(targetSubscription.id, {
    status: 'active',
    priceId: 'proplus',              // NOW update to Pro+ ✅
    interval: 'month',
    periodStart: '2025-12-19',
    periodEnd: '2026-01-19',
    // Clear scheduled fields
    scheduledPlanId: null,
    scheduledInterval: null,
    scheduledPeriodStart: null,
    scheduledPeriodEnd: null,
    scheduledAt: null,
  });
}
```

**Result**:
- ✅ Database updated to `priceId: "proplus"`
- ✅ User granted 900 Pro+ credits
- ✅ User now has Pro+ features (5 concurrent batch jobs)
- ✅ Scheduled fields cleared
- ✅ Upgrade complete!

## Timeline Summary

```
Nov 19, 2025 (Today)
├─ User clicks "Upgrade to Pro+"
├─ Database: priceId="pro", scheduledPlanId="proplus"
├─ Credits: 500 (Pro level)
├─ Features: Pro (3 concurrent jobs)
└─ UI: "Plan Upgrade Scheduled: Pro+"

[30 days pass - user still on Pro plan]

Dec 19, 2025 (Period End)
├─ Creem applies upgrade
├─ Webhook triggers renewal + scheduled upgrade logic
├─ Database: priceId="proplus", scheduledPlanId=null
├─ Credits: +900 granted (Pro+ level)
├─ Features: Pro+ (5 concurrent jobs)
└─ UI: "Current Plan: Pro+"
```

## Comparison with im2prompt (Incorrect Implementation)

### im2prompt Timeline (BROKEN)

```
Nov 19, 2025 (Today)
├─ User clicks "Upgrade to Pro+"
├─ Database: priceId="proplus" ❌ IMMEDIATELY CHANGED
├─ Credits: +900 granted ❌ IMMEDIATELY GRANTED
├─ Features: Pro+ (5 concurrent jobs) ❌ IMMEDIATE
└─ UI: "Subscription will be upgraded at period end" ❌ LIE

[Message says "period end" but upgrade already happened]
```

**im2prompt Bug**: Updates `priceId` immediately in the upgrade endpoint (line 88-91), defeating the purpose of `proration-none`.

## Conclusion

✅ **Your implementation is CORRECT and meets the requirement.**

- Upgrades are properly scheduled for period end
- Credits are NOT granted immediately
- Features remain at old plan level until period end
- Database correctly tracks both current and scheduled plans
- UI correctly shows future effective date

The fix I applied maintains this correct behavior while fixing the webhook 500 error.

## Files That Implement This Logic

1. **Upgrade Scheduling**: `src/app/api/creem/subscription/[subscriptionId]/upgrade/route.ts:151-157`
2. **Webhook Duplicate Check**: `src/app/api/webhooks/creem/route.ts:722-733`
3. **Renewal + Scheduled Upgrade**: `src/app/api/webhooks/creem/route.ts:849-900`
4. **Plan Resolution**: `src/lib/creem/creem-service.ts:846-848`
5. **UI Notification**: `src/components/billing/BillingClient.tsx` (reads scheduledPlanId)

All components work together to ensure upgrades happen at period end, not immediately.
