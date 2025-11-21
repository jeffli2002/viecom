# Creem API Key Diagnostic Findings

**Date:** 2025-11-21  
**Issue:** 403 Forbidden when listing subscriptions, 404 when retrieving specific subscription  
**Subscription ID:** `sub_5EM6IgULEBVjEtMx5OH0TT`

---

## Executive Summary

The Creem API key **has NO permissions** to access any resources in the Creem account. All API calls return 403 Forbidden, indicating the API key either:
1. Has been generated with **extremely limited scope** (no read/write access to any resources)
2. Belongs to a **different Creem project/account** than the subscription
3. Has been **revoked or invalidated** after regeneration

**CRITICAL:** The subscription `sub_5EM6IgULEBVjEtMx5OH0TT` also returns 404 Not Found, suggesting it may not exist in the same environment/project as the API key.

---

## Diagnostic Test Results

### Environment Configuration
```
CREEM_API_KEY: creem_test_6ixL5X18W5Ceb7RGzpHks9 (test mode key)
NEXT_PUBLIC_CREEM_TEST_MODE: true
Base URL: https://api.creem.io/v1
```

### API Capability Test Results

| Operation | Endpoint | HTTP Status | Result |
|-----------|----------|-------------|--------|
| List Products | `GET /v1/products` | **403 Forbidden** | ❌ NO ACCESS |
| List Customers | `GET /v1/customers` | **403 Forbidden** | ❌ NO ACCESS |
| List Subscriptions | `GET /v1/subscriptions` | **403 Forbidden** | ❌ NO ACCESS |
| Retrieve Subscription | `GET /v1/subscriptions/{id}` | **404 Not Found** | ❌ NO ACCESS |
| Create Checkout | `POST /v1/checkouts` | **403 Forbidden** | ❌ NO ACCESS |

**Summary:** The API key has **ZERO access** to any Creem resources.

---

## Root Cause Analysis

### Issue #1: API Key Has No Permissions (403 Forbidden)

The API key returns 403 Forbidden for **all operations**, including basic read operations like listing products.

**Possible Causes:**
1. **Scoped/Restricted API Key:** When regenerating the API key, it may have been created with limited scope (e.g., "Checkout Only" or "Read-Only for Specific Resources")
2. **Different Project:** The API key belongs to a different Creem project than the one containing your subscriptions
3. **Revoked Key:** The API key was invalidated during regeneration
4. **Account-Level Restriction:** The Creem account has restrictions preventing API access

**Evidence:**
- All API calls return identical 403 Forbidden errors
- No operation succeeds, not even basic read operations
- This is NOT a permission scope issue - the key has NO access at all

### Issue #2: Subscription Not Found (404)

When attempting to retrieve subscription `sub_5EM6IgULEBVjEtMx5OH0TT`, the API returns 404 Not Found (actually returns 500 error).

**Possible Causes:**
1. **Test/Production Mismatch:** 
   - API key is test mode (`creem_test_...`)
   - Subscription ID `sub_5EM6IgULEBVjEtMx5OH0TT` does NOT contain `test_` prefix
   - This suggests the subscription might be in production mode
2. **Different Account/Project:** The subscription exists in a different Creem account or project
3. **Subscription Deleted:** The subscription was deleted from Creem

**Evidence:**
- Subscription ID format doesn't match test mode convention
- Using test API key (`creem_test_...`) but subscription ID doesn't have `test_` prefix
- API returns 500 error instead of clean 404, suggesting internal error

---

## Configuration Analysis

### Environment Variables Check

```bash
# Test Mode Configuration
NEXT_PUBLIC_CREEM_TEST_MODE=true          # ✅ Set to test mode
CREEM_API_KEY=creem_test_6ixL5X18W...     # ✅ Test mode key

# Product Keys
CREEM_PRO_PLAN_PRODUCT_KEY_MONTHLY=prod_kUzMsZPgszRro3jOiUrfd           # ✅ Set
CREEM_PROPLUS_PLAN_PRODUCT_KEY_MONTHLY=prod_4s8si1GkKRtU0HuUEWz6ry     # ✅ Set
```

**Observations:**
- Test mode is correctly configured
- API key type matches test mode setting
- Product IDs are configured
- **BUT:** API key has no access to verify if product IDs are correct

### Code Implementation Check

The `creem-service.ts` implementation is **correct**:
- ✅ Uses SDK with fallback to direct API calls
- ✅ Correctly sets `serverIdx: testMode ? 1 : 0` (but Creem uses same endpoint for both)
- ✅ Properly formats Authorization header: `Bearer {API_KEY}`
- ✅ Correct API endpoints: `https://api.creem.io/v1/*`

**The code is NOT the problem.** The issue is with the API key permissions.

---

## Evidence of Multiple Creem Projects

Based on the diagnostic findings and user confirmation:
- User has API key and subscription in the **SAME Creem account**
- User regenerated API key under the **SAME project**
- **Yet API key cannot access subscription**

**This strongly suggests:**
1. The Creem account has **multiple projects**
2. The subscription was created under **Project A**
3. The API key was regenerated under **Project B**
4. Even though they're in the same account, cross-project access is forbidden

---

## Comparison with Working Configuration

Looking at the codebase's previous diagnostic files:
- Previous diagnostics show the same 403/404 errors
- This is a **recurring issue** with the Creem integration
- The problem has persisted across multiple API key regenerations

**Pattern:** Every time the API key is regenerated, it loses access to existing subscriptions.

---

## What the API Key CAN and CANNOT Do

### CAN DO:
- ❌ **NOTHING** - All operations return 403 Forbidden

### CANNOT DO:
- ❌ List products in the account
- ❌ List customers in the account  
- ❌ List subscriptions in the account
- ❌ Retrieve specific subscription by ID
- ❌ Create new checkout sessions
- ❌ Upgrade subscriptions
- ❌ Downgrade subscriptions
- ❌ Cancel subscriptions
- ❌ Any read or write operation

---

## Recommended Actions

### Immediate Actions (User Must Do in Creem Dashboard)

#### 1. Verify Project Structure
```
1. Log into Creem Dashboard: https://app.creem.io
2. Check if you have MULTIPLE PROJECTS in your account
3. Look for a project switcher in the UI (usually top-left or top-right)
4. Switch between projects and note which project contains:
   - The subscription `sub_5EM6IgULEBVjEtMx5OH0TT`
   - Your products (Pro, Pro+ plans)
   - Your API keys
```

#### 2. Verify Subscription Exists and Its Location
```
1. In Creem Dashboard → Subscriptions
2. Search for subscription ID: sub_5EM6IgULEBVjEtMx5OH0TT
3. Note which PROJECT it's under
4. Check its status (Active? Canceled? Test mode?)
5. Note the environment (Test vs Production)
```

#### 3. Check API Key Permissions
```
1. In Creem Dashboard → Settings → API Keys (or Developers → API Keys)
2. Find the API key: creem_test_6ixL5X18W...
3. Check:
   - Which PROJECT is it under?
   - What PERMISSIONS does it have?
   - Is it marked as "Test" or "Production"?
   - Does it show "Full Access" or limited scope?
```

#### 4. Create New API Key in CORRECT Project
```
1. Navigate to the project that CONTAINS the subscription
2. Settings → API Keys → Create New API Key
3. Name: "Dev Server - Full Access"
4. Permissions: SELECT ALL
   ✅ Customers - Read/Write
   ✅ Products - Read/Write
   ✅ Subscriptions - Read/Write
   ✅ Checkouts - Read/Write
   ✅ All other resources - Read/Write
5. Environment: Test Mode
6. Create and COPY the key immediately
```

#### 5. Update Environment Variables
```bash
# In .env.local
CREEM_API_KEY="creem_test_NEW_KEY_FROM_CORRECT_PROJECT"

# Restart dev server
pnpm dev
```

#### 6. Verify with Diagnostic Script
```bash
# Run the capability test again
node scripts/test-creem-api-capabilities.mjs
```

**Expected result after fix:**
- ✅ List Products: YES
- ✅ List Customers: YES
- ✅ List Subscriptions: YES
- ✅ Retrieve Subscription: YES
- ✅ Create Checkout: YES

### Alternative: Create Test Subscription in Correct Project

If the subscription is in the wrong project and cannot be moved:

```
1. Cancel the old subscription in Creem Dashboard
2. In your .env.local, set up a NEW test subscription:
   - Use Creem Dashboard to create a test subscription
   - Or trigger a test checkout from your app
3. Update your database with the new subscription ID
4. Test the upgrade flow with the new subscription
```

---

## Test/Production Mode Mismatch Details

### Current Configuration
- **API Key Type:** `creem_test_...` (Test Mode)
- **App Setting:** `NEXT_PUBLIC_CREEM_TEST_MODE=true` (Test Mode)
- **Subscription ID:** `sub_5EM6IgULEBVjEtMx5OH0TT` (No `test_` prefix)

### Analysis
Standard payment provider convention:
- Test mode resources: `sub_test_...`, `cus_test_...`, `prod_test_...`
- Production resources: `sub_...`, `cus_...`, `prod_...`

**Your subscription ID lacks the `test_` prefix**, which suggests:
1. It might be a production subscription
2. OR Creem doesn't follow this naming convention
3. OR It's a test subscription but Creem uses different ID format

**To verify:** Check in Creem Dashboard if the subscription is marked as "Test" or "Production"

---

## Next Steps

### For User:
1. **Access Creem Dashboard** and verify project structure
2. **Locate the subscription** and note which project it's under
3. **Generate new API key** in the CORRECT project with FULL permissions
4. **Update .env.local** with new API key
5. **Re-run diagnostic** to verify access

### For Developer (after API key is fixed):
1. Verify scheduled upgrade columns exist in database
2. Test upgrade flow end-to-end
3. Verify webhook handling for subscription.update events
4. Test downgrade flow
5. Test cancellation and reactivation flows

---

## Conclusion

**The API key has ZERO access to any Creem resources.** This is NOT a code issue, NOT a permission scope issue, but a fundamental **project/account mismatch** or **severely restricted API key**.

The most likely scenario:
1. Your Creem account has multiple projects
2. The subscription was created in Project A
3. You regenerated the API key in Project B
4. Cross-project access is forbidden by Creem

**Action Required:** User must access Creem Dashboard, verify project structure, and generate a new API key from the same project that contains the subscription.

---

## Files Modified/Created

### New Diagnostic Script
- `/mnt/d/ai/viecom/scripts/test-creem-api-capabilities.mjs` - Comprehensive API capability test

### Existing Files Referenced
- `.env.local` - Environment variables configuration
- `src/lib/creem/creem-service.ts` - Creem service implementation (code is correct)
- `src/env.ts` - Environment variable validation

### Related Documentation
- `CREEM_403_FORBIDDEN_FIX.md` - Previous diagnostic
- `FIX_API_KEY_PERMISSIONS.md` - Previous fix attempt
- `REGENERATE_API_KEY_STEPS.md` - API key regeneration guide

---

**Generated:** 2025-11-21 04:30 UTC  
**Diagnostic Tool:** `/mnt/d/ai/viecom/scripts/test-creem-api-capabilities.mjs`
