# Creem URL Configuration - Environment Variable Solution

## Problem Solved

Previously, Creem API URLs were **hardcoded** in the codebase:
- Production: `https://api.creem.io`
- Sandbox: `https://sandbox.creem.io`

This created issues when:
- Switching between test and production environments
- SDK fallback code used wrong endpoints
- Testing different Creem instances/regions

## Solution Implemented

All Creem URLs are now **driven by environment variables**, making them configurable without code changes.

## Changes Made

### 1. Environment Variables Schema (`src/env.ts`)

Added two new environment variables:

```typescript
server: {
  // ... existing variables
  CREEM_API_URL: z.string().url().optional().default('https://api.creem.io'),
  CREEM_SANDBOX_URL: z.string().url().optional().default('https://sandbox.creem.io'),
}
```

**Benefits:**
- ✅ URLs are validated as proper URLs
- ✅ Sensible defaults provided
- ✅ Optional - won't break existing deployments
- ✅ Can be overridden for custom Creem instances

### 2. Creem Service (`src/lib/creem/creem-service.ts`)

Added helper function:

```typescript
const getCreemBaseUrl = () => {
  const testMode = getCreemTestMode();
  return testMode ? env.CREEM_SANDBOX_URL : env.CREEM_API_URL;
};
```

Replaced all 7 hardcoded URLs:

**Before:**
```typescript
const response = await fetch('https://api.creem.io/v1/checkouts', {
```

**After:**
```typescript
const baseUrl = getCreemBaseUrl();
const response = await fetch(`${baseUrl}/v1/checkouts`, {
```

**Locations updated:**
1. `createCheckoutSession()` - Line 161
2. `cancelSubscription()` - Line 217
3. `getSubscription()` - Line 288
4. `upgradeSubscription()` - Line 360
5. `downgradeSubscription()` - Line 477
6. `reactivateSubscription()` - Line 558
7. `generateCustomerPortalLink()` - Line 622

### 3. Environment Files

**`.env.local`** (Development):
```bash
CREEM_API_URL="https://api.creem.io"
CREEM_SANDBOX_URL="https://sandbox.creem.io"
NEXT_PUBLIC_CREEM_TEST_MODE="true"  # Uses CREEM_SANDBOX_URL
```

**`env.example`** (Template):
```bash
CREEM_API_URL="https://api.creem.io"
CREEM_SANDBOX_URL="https://sandbox.creem.io"
```

### 4. Exported Function

Made `getCreemBaseUrl()` exportable for use in scripts:

```typescript
export { getCreemTestMode, getCreemApiKey, getCreemBaseUrl };
```

## How It Works

### URL Selection Logic

```
If NEXT_PUBLIC_CREEM_TEST_MODE === "true"
  → Use CREEM_SANDBOX_URL (default: https://sandbox.creem.io)
Else
  → Use CREEM_API_URL (default: https://api.creem.io)
```

### Environment Mapping

| Environment | `NEXT_PUBLIC_CREEM_TEST_MODE` | URL Used | API Key Type |
|-------------|-------------------------------|----------|--------------|
| **Development (local)** | `"true"` | `CREEM_SANDBOX_URL` | `creem_test_*` |
| **Staging** | `"true"` | `CREEM_SANDBOX_URL` | `creem_test_*` |
| **Production** | `"false"` | `CREEM_API_URL` | `creem_live_*` |

## Usage

### For Developers

No code changes needed! Just set environment variables:

```bash
# For test/sandbox environment
NEXT_PUBLIC_CREEM_TEST_MODE="true"
CREEM_API_KEY="creem_test_YOUR_KEY"
CREEM_SANDBOX_URL="https://sandbox.creem.io"

# For production environment
NEXT_PUBLIC_CREEM_TEST_MODE="false"
CREEM_API_KEY="creem_live_YOUR_KEY"
CREEM_API_URL="https://api.creem.io"
```

### For Custom Creem Instances

If Creem offers regional endpoints or custom instances:

```bash
# Example: EU instance
CREEM_API_URL="https://eu.api.creem.io"
CREEM_SANDBOX_URL="https://eu.sandbox.creem.io"
```

### In Scripts

Scripts can now import and use the URL helper:

```typescript
import { getCreemBaseUrl } from '@/lib/creem/creem-service';

const baseUrl = getCreemBaseUrl();
const response = await fetch(`${baseUrl}/v1/subscriptions`, {
  headers: { Authorization: `Bearer ${apiKey}` }
});
```

## Benefits

### ✅ Configuration Flexibility
- Change URLs without modifying code
- Support multiple Creem environments
- Easy A/B testing with different endpoints

### ✅ Environment Isolation
- Test mode uses sandbox URL automatically
- Production mode uses production URL automatically
- No risk of mixing environments

### ✅ Deployment Safety
- URLs validated at startup (zod schema)
- Invalid URLs caught before deployment
- Defaults prevent accidental misconfiguration

### ✅ Developer Experience
- Single source of truth for URLs
- Consistent across all API calls
- Easy to debug (check env vars)

### ✅ Future-Proof
- Support for regional endpoints
- Support for custom Creem instances
- Support for Creem API versioning (e.g., `/v2`)

## Migration Guide

### For Existing Deployments

**No immediate action required!** The defaults match existing hardcoded values.

**Optional:** Add to your deployment environment variables:
```bash
CREEM_API_URL="https://api.creem.io"
CREEM_SANDBOX_URL="https://sandbox.creem.io"
```

### For New Deployments

1. Copy from `env.example`:
   ```bash
   CREEM_API_URL="https://api.creem.io"
   CREEM_SANDBOX_URL="https://sandbox.creem.io"
   ```

2. Set test mode:
   ```bash
   # Test/Staging
   NEXT_PUBLIC_CREEM_TEST_MODE="true"
   
   # Production
   NEXT_PUBLIC_CREEM_TEST_MODE="false"
   ```

3. Match API key to environment:
   ```bash
   # Test/Staging
   CREEM_API_KEY="creem_test_..."
   
   # Production
   CREEM_API_KEY="creem_live_..."
   ```

## Verification

After deployment, verify the correct URL is being used:

```bash
# Check logs for API calls
# You should see:
[Creem] Using direct API call for upgrade (SDK failed)

# The URL in the fetch call should match your environment:
# Test mode: https://sandbox.creem.io/v1/...
# Production: https://api.creem.io/v1/...
```

## Testing

### Test Sandbox URL
```bash
NEXT_PUBLIC_CREEM_TEST_MODE="true"
CREEM_API_KEY="creem_test_YOUR_KEY"
```
→ All API calls go to `sandbox.creem.io`

### Test Production URL
```bash
NEXT_PUBLIC_CREEM_TEST_MODE="false"
CREEM_API_KEY="creem_live_YOUR_KEY"
```
→ All API calls go to `api.creem.io`

### Test Custom URL
```bash
NEXT_PUBLIC_CREEM_TEST_MODE="false"
CREEM_API_URL="https://custom.creem.io"
CREEM_API_KEY="your_key"
```
→ All API calls go to `custom.creem.io`

## Troubleshooting

### Issue: 403 Forbidden

**Cause:** URL and API key mismatch

**Solution:**
```bash
# Test API keys ONLY work with sandbox URL
CREEM_API_KEY="creem_test_*"
NEXT_PUBLIC_CREEM_TEST_MODE="true"  # → sandbox.creem.io

# Live API keys ONLY work with production URL
CREEM_API_KEY="creem_live_*"
NEXT_PUBLIC_CREEM_TEST_MODE="false"  # → api.creem.io
```

### Issue: Invalid URL Error on Startup

**Cause:** Invalid URL format in environment variable

**Solution:** Ensure URLs include protocol:
```bash
# ✅ Correct
CREEM_API_URL="https://api.creem.io"

# ❌ Wrong
CREEM_API_URL="api.creem.io"
```

### Issue: Using Wrong URL

**Cause:** Server not restarted after env variable change

**Solution:**
```bash
# Stop server
pkill -f "next dev"

# Clear cache
rm -rf .next

# Restart
pnpm dev
```

## Summary

| Change | Before | After |
|--------|--------|-------|
| **URL Source** | Hardcoded in code | Environment variables |
| **Configurability** | Code changes required | Env var changes only |
| **Test Mode** | Conditional in code | Automatic via `getCreemBaseUrl()` |
| **Custom Endpoints** | Not supported | Fully supported |
| **Validation** | None | Zod schema validation |
| **Locations** | 7 hardcoded URLs | 1 helper function |

## Files Modified

- ✅ `src/env.ts` - Added URL variables to schema
- ✅ `src/lib/creem/creem-service.ts` - Replaced hardcoded URLs
- ✅ `.env.local` - Added URL variables
- ✅ `env.example` - Added URL variables (documentation)

## Next Steps

1. ✅ Restart dev server to load new env variables
2. ⏳ Test upgrade flow (Pro → Pro+)
3. ⏳ Verify scheduled upgrade notice appears
4. ⏳ Test in production environment when ready

The Creem integration is now fully configurable via environment variables! 🎉
