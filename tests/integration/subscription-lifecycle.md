# Subscription Lifecycle E2E Test Plan

## Overview
End-to-end test scenarios for the Creem subscription module, covering the complete subscription lifecycle from checkout to cancellation.

## Test Scenarios

### 1. Free → Pro Monthly Subscription
**Steps:**
1. User starts with free plan (no subscription)
2. User clicks "Subscribe to Pro" with monthly billing
3. System creates checkout session via `createCheckout()`
4. User completes payment at Creem checkout page
5. Webhook received: `checkout.completed`
6. Webhook received: `subscription.created`
7. Database updated: subscription record created
8. Credits granted: 500 monthly credits
9. Verify: User can access Pro features

**Expected Results:**
- Checkout URL is valid and accessible
- Subscription status: `active`
- Plan ID: `pro`
- Interval: `month`
- Credits balance: 530 (30 signup + 500 monthly)
- Period end date set correctly

**Test Command:**
```bash
pnpm test:e2e tests/e2e/subscription-pro-monthly.spec.ts
```

---

### 2. Pro → Pro+ Upgrade
**Steps:**
1. User has active Pro monthly subscription
2. User clicks "Upgrade to Pro+"
3. System calls `upgradeSubscription(subscriptionId, 'proplus_monthly', { useProration: false })`
4. Webhook received: `subscription.update`
5. Database updated: scheduled upgrade stored
6. Verify: UI shows "Upgrade scheduled"
7. Wait for period end
8. Webhook received: `subscription.paid`
9. Credits granted: 900 Pro+ credits
10. Verify: User has Pro+ features

**Expected Results:**
- Scheduled plan ID: `proplus`
- Scheduled period start matches current period end
- No immediate charge (proration-none)
- After period end: Credits balance increases to 900
- Plan ID updated to `proplus`

**Test Command:**
```bash
pnpm test:e2e tests/e2e/subscription-upgrade-proplus.spec.ts
```

---

### 3. Pro+ → Pro Downgrade
**Steps:**
1. User has active Pro+ monthly subscription
2. User clicks "Change Plan" → Select Pro plan
3. System calls `downgradeSubscription(subscriptionId, 'pro_monthly', true)`
4. Webhook received: `subscription.update`
5. Database updated: scheduled downgrade stored
6. Verify: UI shows "Downgrade scheduled"
7. Wait for period end
8. Webhook received: `subscription.paid`
9. Credits adjusted: 500 Pro credits
10. Verify: User has Pro features only

**Expected Results:**
- Scheduled plan ID: `pro`
- Current Pro+ features remain until period end
- After period end: Credits balance set to 500
- Plan ID updated to `pro`

**Test Command:**
```bash
pnpm test:e2e tests/e2e/subscription-downgrade-pro.spec.ts
```

---

### 4. Pro → Free Cancellation
**Steps:**
1. User has active Pro monthly subscription
2. User clicks "Change Plan" → Select Free plan
3. System calls `cancelSubscription(subscriptionId)`
4. Webhook received: `subscription.canceled`
5. Database updated: `cancel_at_period_end = true`
6. Verify: UI shows "Subscription ends on [date]"
7. Wait for period end
8. Webhook received: `subscription.expired`
9. Database updated: status = `canceled`
10. Credits remain but no monthly renewal

**Expected Results:**
- `cancel_at_period_end`: `true`
- Pro features remain until period end
- After period end: No new credits granted
- User retains existing credit balance
- Plan ID updated to `free`

**Test Command:**
```bash
pnpm test:e2e tests/e2e/subscription-cancel.spec.ts
```

---

### 5. Subscription Reactivation
**Steps:**
1. User has canceled subscription (cancel_at_period_end = true)
2. User clicks "Reactivate Subscription"
3. System calls `reactivateSubscription(subscriptionId)`
4. Webhook received: `subscription.update`
5. Database updated: `cancel_at_period_end = false`
6. Verify: UI shows "Subscription active"

**Expected Results:**
- `cancel_at_period_end`: `false`
- Subscription continues normally
- Next period: Credits granted as usual

**Test Command:**
```bash
pnpm test:e2e tests/e2e/subscription-reactivate.spec.ts
```

---

### 6. Credit Pack Purchase
**Steps:**
1. User has active Pro subscription
2. User clicks "Buy 1000 Credits Pack"
3. System creates checkout via `createCheckoutSessionWithProductKey()`
4. User completes payment
5. Webhook received: `checkout.completed`
6. Credits granted: +1000 credits
7. Verify: Balance updated

**Expected Results:**
- No subscription created (one-time payment)
- Credits balance increased by 1000
- Transaction recorded in `creditTransactions`

**Test Command:**
```bash
pnpm test:e2e tests/e2e/credit-pack-purchase.spec.ts
```

---

### 7. Yearly Plan Subscription
**Steps:**
1. User starts with free plan
2. User selects Pro yearly plan
3. System creates checkout with `pro_yearly` product ID
4. User completes payment
5. Webhook received: `checkout.completed`, `subscription.created`
6. Credits granted: 6000 yearly credits (12 months * 500)
7. Verify: Billing interval = `year`

**Expected Results:**
- Subscription interval: `year`
- Credits balance: 6030 (30 signup + 6000 yearly)
- Period end date: +1 year from start
- Price: $11.92/month equivalent ($142.80/year with 20% discount)

**Test Command:**
```bash
pnpm test:e2e tests/e2e/subscription-pro-yearly.spec.ts
```

---

### 8. Webhook Signature Verification
**Steps:**
1. Mock Creem webhook POST to `/api/webhooks/creem`
2. Include invalid signature header
3. Verify: Request rejected with 400 status
4. Retry with valid signature
5. Verify: Webhook processed successfully

**Expected Results:**
- Invalid signature: HTTP 400, no database changes
- Valid signature: HTTP 200, event processed
- All webhook events validated before processing

**Test Command:**
```bash
pnpm test:e2e tests/e2e/webhook-security.spec.ts
```

---

### 9. Error Scenarios
**Sub-scenarios:**

#### 9a. Network Timeout
- Creem API unavailable
- Verify: Error message shown to user
- Verify: No partial database updates

#### 9b. Invalid Product ID
- Attempt checkout with non-existent product
- Verify: Error returned from API
- Verify: User shown clear error message

#### 9c. Subscription Not Found
- Attempt to upgrade non-existent subscription
- Verify: HTTP 404 handled gracefully
- Verify: User prompted to refresh

#### 9d. Insufficient Permissions
- Attempt to cancel another user's subscription
- Verify: HTTP 403 forbidden
- Verify: Security audit logged

**Test Command:**
```bash
pnpm test:e2e tests/e2e/error-scenarios.spec.ts
```

---

### 10. Customer Portal Access
**Steps:**
1. User has active Pro subscription
2. User clicks "Manage Subscription"
3. System calls `generateCustomerPortalLink(customerId, returnUrl)`
4. User redirected to Creem customer portal
5. User updates payment method
6. User returns to app via return URL
7. Verify: Payment method updated in Creem

**Expected Results:**
- Portal link generated successfully
- Portal accessible with customer ID
- Return URL works correctly
- Changes synced to database

**Test Command:**
```bash
pnpm test:e2e tests/e2e/customer-portal.spec.ts
```

---

## Test Execution

### Run All E2E Tests
```bash
pnpm test:e2e
```

### Run Specific Test Suite
```bash
pnpm test:e2e tests/e2e/subscription-lifecycle/
```

### Run with UI (Playwright)
```bash
pnpm test:e2e:ui
```

### Generate Test Report
```bash
pnpm test:e2e --reporter=html
```

---

## Test Data Setup

### Required Environment Variables
```bash
# Test mode Creem API
CREEM_API_KEY=creem_test_xxx
CREEM_WEBHOOK_SECRET=test_webhook_secret_xxx

# Test product IDs
CREEM_PRO_PLAN_PRODUCT_KEY_MONTHLY=prod_test_pro_monthly
CREEM_PROPLUS_PLAN_PRODUCT_KEY_MONTHLY=prod_test_proplus_monthly
CREEM_PRO_PLAN_PRODUCT_KEY_YEARLY=prod_test_pro_yearly
CREEM_PROPLUS_PLAN_PRODUCT_KEY_YEARLY=prod_test_proplus_yearly

# Test database
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
```

### Test User Accounts
Create test users via:
```bash
pnpm exec tsx scripts/create-test-users.ts
```

---

## Success Criteria

All E2E tests must pass before deploying to production:
- ✅ All subscription lifecycle scenarios work end-to-end
- ✅ Webhooks verified and processed correctly
- ✅ Credits granted accurately at each stage
- ✅ Database updates atomic and consistent
- ✅ Error scenarios handled gracefully
- ✅ Security checks (signature verification) working
- ✅ No race conditions in concurrent operations
- ✅ UI reflects correct subscription state

---

## Automation

These E2E tests should be run:
1. **Before every production deployment**
2. **After any subscription-related code changes**
3. **Weekly in CI/CD pipeline** (with test Creem environment)
4. **After Creem API updates** (when notified by Creem)

---

## Notes

- E2E tests use actual Creem test API (not mocked)
- Test mode API keys prevent real charges
- Database should be reset before each test run
- Use Playwright for browser automation
- Mock time for period-end scenarios
- Clean up test data after each run
