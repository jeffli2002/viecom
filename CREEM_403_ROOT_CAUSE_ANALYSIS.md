# Creem 403 Forbidden - Root Cause Analysis

## Executive Summary

**ROOT CAUSE IDENTIFIED**: The application is using `serverIdx: 0` (production endpoint) while the API key is a test mode key and the subscription exists in Creem's sandbox environment.

## Diagnostic Results

### 1. API Key Format Validation
✅ **PASSED** - API key format is valid
- Prefix: `creem_test_`
- Length: 33 characters
- No whitespace or formatting issues

### 2. Environment Mismatch Detection
⚠️ **WARNING DETECTED**
- API Key type: **TEST** (`creem_test_`)
- Subscription ID: `sub_5EM6IgULEBVjEtMx5OH0TT` (no `test_` prefix)
- Environment: The subscription exists in Creem's **sandbox/test environment**

**Note**: Creem subscriptions in test mode don't always have `test_` in their ID. The environment is determined by the API endpoint and mode flag.

### 3. API Endpoint Testing Results

**serverIdx: 0 (Production Endpoint)**
```
❌ FAILED - Status 403 Forbidden
URL: https://api.creem.io/v1/subscriptions/sub_5EM6IgULEBVjEtMx5OH0TT
Response: {"trace_id":"...","status":403,"error":"Forbidden"}
```

**serverIdx: 1 (Sandbox Endpoint)**
```
✅ SUCCESS
URL: https://sandbox.creem.io/v1/subscriptions/sub_5EM6IgULEBVjEtMx5OH0TT
Response: Full subscription details returned
```

## The Problem

The application code uses this logic:
```typescript
const creem = new Creem({
  serverIdx: getCreemTestMode() ? 1 : 0,
});
```

Where `getCreemTestMode()` checks:
```typescript
const getCreemTestMode = () => {
  const testModeEnv = env.NEXT_PUBLIC_CREEM_TEST_MODE;
  return testModeEnv === 'true';
};
```

**Current Setting**: `NEXT_PUBLIC_CREEM_TEST_MODE` is **NOT SET** or set to `'false'`
- This causes `serverIdx: 0` (production endpoint)
- But the test API key and subscription are in sandbox (require `serverIdx: 1`)

## The Solution

### Option 1: Use Sandbox Mode (Recommended for Testing)

Update `.env.local`:
```bash
NEXT_PUBLIC_CREEM_TEST_MODE="true"
```

This will:
- Use `serverIdx: 1` (sandbox endpoint: `https://sandbox.creem.io`)
- Work with test API key `creem_test_6ixL5X18W5Ceb7RGzpHks9`
- Access test subscriptions like `sub_5EM6IgULEBVjEtMx5OH0TT`

### Option 2: Use Production Mode

1. **Get a production API key** from Creem dashboard:
   - Should start with `creem_live_` (not `creem_test_`)

2. **Create production subscriptions** using the Creem dashboard or checkout flow

3. Update `.env.local`:
```bash
CREEM_API_KEY="creem_live_XXXXXXXXXXXXX"
NEXT_PUBLIC_CREEM_TEST_MODE="false"
```

## Why This Happened

1. **No explicit test mode flag**: The environment variable wasn't set
2. **Default behavior**: Code defaults to production mode (`serverIdx: 0`)
3. **Test resources**: But subscription was created in sandbox environment
4. **API key isolation**: Creem strictly isolates test/sandbox from production
   - Test keys can ONLY access sandbox endpoint
   - Production keys can ONLY access production endpoint

## Verification

The diagnostic script confirmed:
- ❌ Production endpoint (`serverIdx: 0`) returns **403 Forbidden**
- ✅ Sandbox endpoint (`serverIdx: 1`) returns **full subscription data**

## Additional Findings

### Subscription Details (from Sandbox)
```json
{
  "id": "sub_5EM6IgULEBVjEtMx5OH0TT",
  "mode": "test",
  "status": "active",
  "product": {
    "id": "prod_kUzMsZPgszRro3jOiUrfd",
    "name": "monthly Pro",
    "price": 500,
    "billingPeriod": "every-month"
  },
  "customer": {
    "id": "cust_7ECJrW5ALvuCieDX4W3mOQ",
    "email": "jefflee2002@gmail.com",
    "name": "Lei Li"
  }
}
```

The subscription **exists** and is **active** in sandbox.

## Environment Variables Check

Current `.env.local` should have:
```bash
# For SANDBOX/TEST mode (recommended for development)
CREEM_API_KEY="creem_test_6ixL5X18W5Ceb7RGzpHks9"
NEXT_PUBLIC_CREEM_TEST_MODE="true"  # <-- ADD THIS LINE

# Or for PRODUCTION mode
CREEM_API_KEY="creem_live_XXXXXXXXXXXXX"
NEXT_PUBLIC_CREEM_TEST_MODE="false"
```

## Implementation Check

File: `/mnt/d/ai/viecom/src/lib/creem/creem-service.ts`

The service correctly implements environment switching:
```typescript
const creem = new Creem({
  serverIdx: testMode ? 1 : 0,
});
```

**Problem**: `testMode` variable is derived from env var that wasn't set.

## Why There Are No Permission Settings in Creem

Creem uses **environment isolation** instead of granular permissions:
- **Test/Sandbox keys** → Full access to sandbox resources only
- **Live/Production keys** → Full access to production resources only
- **No cross-environment access** → 403 Forbidden when mismatched

This is a security feature to prevent test keys from accidentally affecting production data.

## Recommended Next Steps

1. **Immediate fix**:
   ```bash
   # Add to .env.local
   NEXT_PUBLIC_CREEM_TEST_MODE="true"
   ```

2. **Restart development server**:
   ```bash
   pnpm dev
   ```

3. **Test the upgrade flow**:
   - Navigate to billing page
   - Attempt Pro → Pro+ upgrade
   - Should now work without 403 errors

4. **For production deployment**:
   - Create production subscriptions in Creem dashboard
   - Use production API key (`creem_live_...`)
   - Set `NEXT_PUBLIC_CREEM_TEST_MODE="false"`

## Related Files

- `/mnt/d/ai/viecom/.env.local` - Environment configuration
- `/mnt/d/ai/viecom/src/lib/creem/creem-service.ts` - Creem service implementation
- `/mnt/d/ai/viecom/src/env.ts` - Environment variable validation

## Diagnostic Scripts

Two diagnostic scripts were created for future troubleshooting:

1. **Full API diagnostics**:
   ```bash
   npm run diagnose:creem
   ```
   - Validates API key format
   - Detects environment mismatches
   - Tests multiple endpoints
   - Tests both serverIdx values

2. **Write capability test**:
   ```bash
   npm run diagnose:creem-create
   ```
   - Tests CREATE operations
   - Verifies API key permissions

These scripts are located in:
- `/mnt/d/ai/viecom/scripts/diagnose-creem-403.ts`
- `/mnt/d/ai/viecom/scripts/test-creem-create.ts`
