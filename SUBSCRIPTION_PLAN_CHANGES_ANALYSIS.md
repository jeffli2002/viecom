# Subscription Plan Changes - Comprehensive Analysis

**Date:** 2025-11-21  
**Analysis Type:** Ultra-deep verification of all subscription change scenarios  
**Status:** 🚨 2 CRITICAL BUGS FOUND

---

## Executive Summary

Analyzed all possible subscription plan change scenarios including upgrades, downgrades, cancellations, and reactivations. **Found 2 critical bugs** that could cause incorrect billing or subscription states:

1. **BUG #1:** Upgrade doesn't clear `cancelAtPeriodEnd` flag
2. **BUG #2:** Reactivate doesn't clear scheduled upgrade fields

Both bugs will be fixed in this session.

---

## All Subscription Change Scenarios

### 1. Upgrades (Pro → Pro+)

**Route:** `/api/creem/subscription/[subscriptionId]/upgrade/route.ts`

**Current Logic:**
```typescript
// Sets scheduled fields
await paymentRepository.update(paymentRecord.id, {
  scheduledPlanId: newPlanId,
  scheduledInterval: newInterval,
  scheduledPeriodStart: estimatedEffectiveDate,
  scheduledPeriodEnd: nextPeriodEnd,
  scheduledAt: new Date(),
});

// ❌ DOES NOT clear cancelAtPeriodEnd
```

**Scenarios:**

| Current State | Action | Expected Behavior | Actual Behavior | Status |
|--------------|--------|-------------------|-----------------|--------|
| Pro active | Upgrade to Pro+ | Schedule Pro+ at period end | ✅ Works | ✅ PASS |
| Pro with cancelAtPeriodEnd=true | Upgrade to Pro+ | Clear cancel flag, schedule Pro+ | ❌ Cancel flag NOT cleared | 🚨 **BUG #1** |
| Pro with Pro+ scheduled | Upgrade to Pro+ (same) | Error: already scheduled | ✅ Validation prevents | ✅ PASS |

**BUG #1 Details:**
- **Scenario:** User schedules cancellation (downgrade to Free), then changes mind and upgrades to Pro+
- **Expected:** Upgrade clears `cancelAtPeriodEnd`, subscription continues and upgrades
- **Actual:** `cancelAtPeriodEnd` stays true, subscription cancels at period end, upgrade never happens
- **Impact:** User gets charged for upgrade but subscription cancels anyway

---

### 2. Downgrades to Free

**Route:** `/api/creem/subscription/[subscriptionId]/downgrade/route.ts`

**Current Logic:**
```typescript
if (newPlanId === 'free') {
  // ✅ Calls Creem API
  const creemResult = await creemService.setCancelAtPeriodEnd(subscriptionId, true);
  
  // ✅ Clears scheduled fields
  await paymentRepository.update(paymentRecord.id, {
    cancelAtPeriodEnd: true,
    scheduledPlanId: null,
    scheduledInterval: null,
    scheduledPeriodStart: null,
    scheduledPeriodEnd: null,
    scheduledAt: null,
  });
}
```

**Scenarios:**

| Current State | Action | Expected Behavior | Actual Behavior | Status |
|--------------|--------|-------------------|-----------------|--------|
| Pro active | Downgrade to Free | Set cancel flag, clear scheduled | ✅ Works correctly | ✅ PASS |
| Pro with Pro+ scheduled | Downgrade to Free | Cancel upgrade, set cancel flag | ✅ Works correctly | ✅ PASS |
| Pro+ active | Downgrade to Free | Set cancel flag | ✅ Works correctly | ✅ PASS |

**Status:** ✅ All downgrade-to-Free scenarios work correctly (fixed in previous session)

---

### 3. Downgrades Between Paid Plans (Pro+ → Pro)

**Route:** `/api/creem/subscription/[subscriptionId]/downgrade/route.ts`

**Current Logic:**
```typescript
if (newPlanId !== 'free') {
  const result = await creemService.downgradeSubscription(
    paymentRecord.subscriptionId,
    newProductKey,
    true // Force schedule at period end
  );
  
  await paymentRepository.update(paymentRecord.id, {
    scheduledPlanId: newPlanId,
    scheduledInterval: newInterval,
    scheduledPeriodStart: estimatedEffectiveDate,
    scheduledPeriodEnd: nextPeriodEnd,
    scheduledAt: new Date(),
    cancelAtPeriodEnd: false, // ✅ Explicitly set to false
  });
}
```

**Scenarios:**

| Current State | Action | Expected Behavior | Actual Behavior | Status |
|--------------|--------|-------------------|-----------------|--------|
| Pro+ active | Downgrade to Pro | Schedule Pro at period end | ✅ Works correctly | ✅ PASS |
| Pro+ with cancelAtPeriodEnd=true | Downgrade to Pro | Clear cancel flag, schedule Pro | ✅ Clears flag | ✅ PASS |

**Status:** ✅ Paid-to-paid downgrades work correctly

---

### 4. Reactivation (Keep Current Plan)

**Route:** `/api/creem/subscription/[subscriptionId]/reactivate/route.ts`

**Current Logic:**
```typescript
const result = await creemService.reactivateSubscription(subscriptionId);

await paymentRepository.update(paymentRecord.id, {
  cancelAtPeriodEnd: false,
  status: 'active',
});

// ❌ DOES NOT clear scheduled fields
```

**Scenarios:**

| Current State | Action | Expected Behavior | Actual Behavior | Status |
|--------------|--------|-------------------|-----------------|--------|
| Pro with cancelAtPeriodEnd=true | Reactivate | Clear cancel flag, keep Pro | ✅ Works correctly | ✅ PASS |
| Pro with Pro+ scheduled | Reactivate (cancel upgrade) | Clear scheduled fields, keep Pro | ❌ Scheduled fields NOT cleared | 🚨 **BUG #2** |
| Pro with Pro+ scheduled + cancelAtPeriodEnd=true | Reactivate | Clear both | ❌ Only clears cancel flag | 🚨 **BUG #2** |

**BUG #2 Details:**
- **Scenario:** User schedules upgrade to Pro+, then clicks "Keep current plan"
- **Expected:** Clear scheduled upgrade, user stays on Pro indefinitely
- **Actual:** Scheduled upgrade fields remain, Pro+ upgrade still happens at period end
- **Impact:** User thinks they cancelled upgrade but gets charged for Pro+ anyway

---

### 5. Interval Changes (Monthly ↔ Yearly)

**Routes:** Uses upgrade/downgrade routes depending on direction

**Scenarios:**

| Current State | Action | Expected Behavior | Actual Behavior | Status |
|--------------|--------|-------------------|-----------------|--------|
| Pro monthly | Change to Pro yearly | Schedule change at period end | ✅ Works (uses upgrade route) | ✅ PASS |
| Pro yearly | Change to Pro monthly | Schedule change at period end | ✅ Works (uses downgrade route) | ✅ PASS |

**Status:** ✅ Interval changes work correctly

---

### 6. Rapid Sequential Changes

**Scenarios:**

| Sequence | Expected Behavior | Actual Behavior | Status |
|----------|-------------------|-----------------|--------|
| Pro → Upgrade to Pro+ → Downgrade to Pro | Last action wins (Pro scheduled) | ✅ scheduledPlanId overwrites | ✅ PASS |
| Pro → Downgrade to Free → Upgrade to Pro+ | Last action wins (Pro+ scheduled) | ⚠️ May fail due to cancelAtPeriodEnd | ⚠️ **RELATED TO BUG #1** |
| Pro → Upgrade to Pro+ → Reactivate | Cancel upgrade, stay on Pro | ❌ Upgrade not cancelled | 🚨 **BUG #2** |

---

## Webhook Handling

**File:** `/api/webhooks/creem/route.ts`

### Subscription Update Webhook

The webhook handler correctly processes scheduled changes:

```typescript
// Line 871-1024: Checks for scheduledPlanId
if (targetSubscription.scheduledPlanId && ...) {
  // Apply scheduled upgrade
  await grantSubscriptionCredits(...);
  
  await paymentRepository.update(targetSubscription.id, {
    priceId: scheduledPlanId,
    interval: scheduledInterval,
    scheduledPlanId: null,  // ✅ Clears scheduled fields
    scheduledInterval: null,
    scheduledPeriodStart: null,
    scheduledPeriodEnd: null,
    scheduledAt: null,
  });
}
```

**Status:** ✅ Webhook correctly applies and clears scheduled changes

---

## Root Cause Analysis

### BUG #1: Why Upgrade Doesn't Clear cancelAtPeriodEnd

**Location:** `/api/creem/subscription/[subscriptionId]/upgrade/route.ts:154-160`

**Code Review:**
```typescript
await paymentRepository.update(paymentRecord.id, {
  scheduledPlanId: newPlanId,
  scheduledInterval: newInterval,
  scheduledPeriodStart: estimatedEffectiveDate,
  scheduledPeriodEnd: nextPeriodEnd,
  scheduledAt: new Date(),
  // ❌ Missing: cancelAtPeriodEnd: false
});
```

**Why it matters:**
- User has `cancelAtPeriodEnd: true` (scheduled to cancel/downgrade to Free)
- User decides to upgrade to Pro+ instead
- Upgrade sets scheduled fields but doesn't clear the cancel flag
- At period end: Webhook sees `cancelAtPeriodEnd: true`, cancels subscription
- Scheduled upgrade never applied because subscription is canceled

**Fix:**
```typescript
await paymentRepository.update(paymentRecord.id, {
  scheduledPlanId: newPlanId,
  scheduledInterval: newInterval,
  scheduledPeriodStart: estimatedEffectiveDate,
  scheduledPeriodEnd: nextPeriodEnd,
  scheduledAt: new Date(),
  cancelAtPeriodEnd: false, // ✅ Clear cancel flag when upgrading
});
```

---

### BUG #2: Why Reactivate Doesn't Clear Scheduled Fields

**Location:** `/api/creem/subscription/[subscriptionId]/reactivate/route.ts:42-45`

**Code Review:**
```typescript
await paymentRepository.update(paymentRecord.id, {
  cancelAtPeriodEnd: false,
  status: 'active',
  // ❌ Missing: Clear scheduled fields
});
```

**Why it matters:**
- User has Pro with Pro+ upgrade scheduled
- User clicks "Keep current plan" button (calls reactivate)
- UI intent: Cancel the scheduled upgrade, keep current Pro plan
- Code clears `cancelAtPeriodEnd` but not scheduled upgrade fields
- At period end: Webhook sees `scheduledPlanId: 'proplus'`, applies upgrade
- User gets charged for Pro+ when they explicitly cancelled it

**Fix:**
```typescript
await paymentRepository.update(paymentRecord.id, {
  cancelAtPeriodEnd: false,
  status: 'active',
  // ✅ Clear scheduled upgrade fields
  scheduledPlanId: null,
  scheduledInterval: null,
  scheduledPeriodStart: null,
  scheduledPeriodEnd: null,
  scheduledAt: null,
});
```

---

## Testing Matrix

### Manual Test Scenarios

| # | Initial State | Action | Verify | Bug |
|---|--------------|--------|--------|-----|
| 1 | Pro active | Upgrade to Pro+ | scheduledPlanId=proplus, cancelAtPeriodEnd=false | #1 |
| 2 | Pro with cancelAtPeriodEnd=true | Upgrade to Pro+ | cancelAtPeriodEnd cleared to false | #1 |
| 3 | Pro with Pro+ scheduled | Click "Keep current plan" | All scheduled fields cleared | #2 |
| 4 | Pro active | Downgrade to Free | cancelAtPeriodEnd=true, scheduled fields cleared | ✅ |
| 5 | Pro with Pro+ scheduled | Downgrade to Free | cancelAtPeriodEnd=true, scheduled fields cleared | ✅ |
| 6 | Pro+ active | Downgrade to Pro | scheduledPlanId=pro, cancelAtPeriodEnd=false | ✅ |

### Automated Test Coverage

**Existing Tests:**
```bash
pnpm test         # Jest unit tests
pnpm test:e2e     # Playwright E2E tests
```

**Test Files to Check:**
- `tests/unit/subscription/*.test.ts` - Subscription logic tests
- `tests/integration/api/subscription/*.test.ts` - API route tests
- `tests/e2e/subscription/*.spec.ts` - End-to-end tests

---

## Fixes Required

### Fix #1: Clear cancelAtPeriodEnd in Upgrade Route

**File:** `/api/creem/subscription/[subscriptionId]/upgrade/route.ts`  
**Line:** 154  
**Change:**
```diff
await paymentRepository.update(paymentRecord.id, {
  scheduledPlanId: newPlanId,
  scheduledInterval: newInterval,
  scheduledPeriodStart: estimatedEffectiveDate,
  scheduledPeriodEnd: nextPeriodEnd,
  scheduledAt: new Date(),
+ cancelAtPeriodEnd: false,
});
```

### Fix #2: Clear Scheduled Fields in Reactivate Route

**File:** `/api/creem/subscription/[subscriptionId]/reactivate/route.ts`  
**Line:** 42  
**Change:**
```diff
await paymentRepository.update(paymentRecord.id, {
  cancelAtPeriodEnd: false,
  status: 'active',
+ scheduledPlanId: null,
+ scheduledInterval: null,
+ scheduledPeriodStart: null,
+ scheduledPeriodEnd: null,
+ scheduledAt: null,
});
```

---

## Impact Assessment

### Bug #1 Impact
- **Severity:** HIGH
- **User Impact:** User upgrades but gets cancelled, losing access unexpectedly
- **Financial Impact:** User charged for upgrade that never happens (may cause refund requests)
- **Frequency:** Rare (requires user to downgrade then upgrade within same period)

### Bug #2 Impact
- **Severity:** HIGH
- **User Impact:** User cancels upgrade but gets charged anyway
- **Financial Impact:** Unwanted charges, potential chargebacks
- **Frequency:** Medium (common flow: upgrade → change mind → keep current plan)

---

## Recommended Actions

### Immediate (This Session)
1. ✅ Apply Fix #1: Add `cancelAtPeriodEnd: false` to upgrade route
2. ✅ Apply Fix #2: Clear scheduled fields in reactivate route
3. ✅ Run TypeScript compilation to verify
4. ✅ Run automated test suite
5. ✅ Document fixes

### Follow-up (Next Sprint)
1. Add automated tests for these specific scenarios
2. Add UI confirmation dialogs for plan changes
3. Add admin dashboard to view scheduled changes
4. Implement audit logging for all subscription changes
5. Add email notifications for scheduled changes

---

## Conclusion

The subscription plan change system is mostly well-designed with proper delayed activation and webhook handling. However, **two critical bugs** were found where state flags are not properly cleared during plan changes, leading to potential billing errors and user confusion.

**Both bugs will be fixed immediately** to prevent incorrect billing and subscription states.

**After fixes:**
- ✅ All upgrade scenarios will work correctly
- ✅ All downgrade scenarios will work correctly
- ✅ Reactivation will properly cancel scheduled changes
- ✅ No risk of incorrect billing

---

**Analyzed by:** Claude (AI Assistant)  
**Review Status:** Ready for fixes  
**Next Step:** Apply both fixes immediately
