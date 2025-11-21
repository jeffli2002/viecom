# Creem 403 Forbidden - SOLUTION

## Problem Identified

The diagnostic script revealed the root cause of the 403 Forbidden errors:

**✅ serverIdx: 1 (sandbox) - SUCCESS**
```json
{
  "id": "sub_5EM6IgULEBVjEtMx5OH0TT",
  "mode": "test",
  "status": "active"
}
```

**❌ serverIdx: 0 (production) - 403 FORBIDDEN**
```json
{
  "status": 403,
  "error": "Forbidden"
}
```

## Root Cause

The application code in `/src/lib/creem/creem-service.ts` uses:

```typescript
const creem = new Creem({
  serverIdx: getCreemTestMode() ? 1 : 0,
});
```

Where `getCreemTestMode()` reads from `NEXT_PUBLIC_CREEM_TEST_MODE` environment variable.

**The Issue**: Next.js applications need to be **restarted** when `NEXT_PUBLIC_*` environment variables change, as these are bundled at build/startup time.

## Immediate Solution

### Step 1: Verify Environment Variable

Check that `.env.local` contains:
```bash
NEXT_PUBLIC_CREEM_TEST_MODE="true"
```

This line **IS PRESENT** in your `.env.local` file (confirmed).

### Step 2: Restart Development Server

The key is to **completely restart** your development server:

```bash
# Stop the current dev server (Ctrl+C if running)

# Then restart
pnpm dev

# Or if using PowerShell script
./start-dev.ps1
```

**Why?** `NEXT_PUBLIC_*` variables are embedded into the client bundle at build time. Changing them requires a restart.

### Step 3: Verify the Fix

After restart, test the upgrade:
1. Go to billing page
2. Attempt Pro → Pro+ upgrade
3. Should work without 403 errors

## Verification Commands

Run the diagnostic to confirm serverIdx is being used correctly:

```bash
npm run diagnose:creem
```

Expected output after restart:
```
Step 2: Environment Mismatch Detection
---------------------------------------
API Key type: TEST
Test mode: true
Expected prefix: creem_test_
✅ Environment appears consistent
```

## Why This Happens

### Next.js Environment Variable Behavior

1. **Server-side variables** (`process.env.VAR_NAME`):
   - Read at runtime
   - Changes reflected immediately in API routes

2. **Client-side variables** (`NEXT_PUBLIC_*`):
   - Embedded at build/startup
   - Requires restart to update
   - Used in browser-side code

3. **The Creem service** is used in **API routes** (server-side), but:
   - It imports `env` from `/src/env.ts`
   - Which uses `@t3-oss/env-nextjs` to validate vars
   - This validation happens **once at import time**

## Detailed Explanation

### Current Environment (Verified)

```bash
# .env.local (CORRECT)
CREEM_API_KEY="creem_test_6ixL5X18W5Ceb7RGzpHks9"
NEXT_PUBLIC_CREEM_TEST_MODE="true"
```

### What the Diagnostic Found

| Endpoint | serverIdx | Result |
|----------|-----------|--------|
| `https://api.creem.io/v1` | 0 (prod) | ❌ 403 Forbidden |
| `https://sandbox.creem.io/v1` | 1 (sandbox) | ✅ SUCCESS |

### Creem Environment Isolation

Creem strictly isolates environments:

- **Test API keys** (`creem_test_*`):
  - Can ONLY access `sandbox.creem.io`
  - Returns 403 for `api.creem.io`

- **Live API keys** (`creem_live_*`):
  - Can ONLY access `api.creem.io`
  - Returns 403 for `sandbox.creem.io`

## If Restart Doesn't Work

### Option 1: Hard Rebuild

```bash
# Clean Next.js cache
rm -rf .next

# Reinstall dependencies (optional)
pnpm install

# Restart
pnpm dev
```

### Option 2: Check for Multiple Processes

```bash
# Check if multiple dev servers are running
# Linux/WSL:
ps aux | grep "next dev"

# Windows PowerShell:
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# Kill old processes if found
```

### Option 3: Verify Environment Loading

Create a test API route:

```typescript
// src/app/api/test-creem-mode/route.ts
import { env } from '@/env';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_CREEM_TEST_MODE: env.NEXT_PUBLIC_CREEM_TEST_MODE,
    isTestMode: env.NEXT_PUBLIC_CREEM_TEST_MODE === 'true',
    expectedServerIdx: env.NEXT_PUBLIC_CREEM_TEST_MODE === 'true' ? 1 : 0,
  });
}
```

Then visit: `http://localhost:3000/api/test-creem-mode`

Expected response:
```json
{
  "NEXT_PUBLIC_CREEM_TEST_MODE": "true",
  "isTestMode": true,
  "expectedServerIdx": 1
}
```

## Long-term Considerations

### For Production Deployment

When deploying to production:

1. **Get production API key** from Creem:
   - Should start with `creem_live_`

2. **Update environment variables** on Vercel/deployment platform:
   ```bash
   CREEM_API_KEY=creem_live_XXXXXXXXXXXXX
   NEXT_PUBLIC_CREEM_TEST_MODE=false
   ```

3. **Create production subscriptions** through Creem checkout flow

4. **Redeploy** application

### Environment Variable Management

Consider using environment-specific files:

```
.env.local              # Development (test mode)
.env.production.local   # Production (live mode)
```

Example `.env.local` (development):
```bash
CREEM_API_KEY="creem_test_6ixL5X18W5Ceb7RGzpHks9"
NEXT_PUBLIC_CREEM_TEST_MODE="true"
```

Example `.env.production.local` (production):
```bash
CREEM_API_KEY="creem_live_XXXXXXXXXXXXX"
NEXT_PUBLIC_CREEM_TEST_MODE="false"
```

## Additional Context

### Why No Permission Settings in Creem?

Creem's design philosophy:
- Simple: No complex permission management
- Secure: Environment isolation prevents accidents
- Clear: Test vs production separation is explicit

### Subscription Details (Confirmed Working in Sandbox)

Your subscription `sub_5EM6IgULEBVjEtMx5OH0TT`:
- ✅ Exists in sandbox
- ✅ Status: Active
- ✅ Customer: jefflee2002@gmail.com
- ✅ Plan: Pro ($5.00 monthly)

## Summary

**The Fix**: Restart your development server

**Why**: `NEXT_PUBLIC_*` environment variables are embedded at startup and don't hot-reload

**Verification**: Run `npm run diagnose:creem` after restart

**Result**: Upgrade API should work without 403 errors

## Next Steps After Fix

1. ✅ Restart dev server
2. ✅ Run diagnostic: `npm run diagnose:creem`
3. ✅ Test upgrade flow in browser
4. ✅ Verify billing page shows scheduled upgrade notice
5. ✅ Check database for scheduled upgrade fields

If you continue to see 403 errors after restart, run the diagnostic script and share the output.
