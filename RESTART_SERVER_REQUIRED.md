# ⚠️ SERVER RESTART REQUIRED

## Why You're Getting "fetch failed" Error

The error `fetch failed` means the URL being constructed is invalid or undefined.

This happens because:
1. ✅ We added new env variables: `CREEM_API_URL` and `CREEM_SANDBOX_URL`
2. ✅ We updated the code to use these variables
3. ❌ Your dev server is still running with the OLD code and OLD env variables

## Solution: Full Server Restart

```bash
# 1. Stop the current dev server (Ctrl+C in the terminal where it's running)
# OR kill it forcefully:
pkill -f "next dev"

# 2. Clear Next.js cache
rm -rf .next

# 3. Start fresh
pnpm dev
```

## What Will Happen After Restart

The server will:
1. ✅ Load new env variables from `.env.local`
2. ✅ Use `getCreemBaseUrl()` function
3. ✅ Construct proper URL: `https://sandbox.creem.io/v1/subscriptions/...`
4. ✅ Upgrade should work!

## Verify It's Working

After restart, check the console logs. You should see:

```
[Creem] Using direct API call for upgrade (SDK failed)
[Creem] Base URL: https://sandbox.creem.io
[Creem] Full URL: https://sandbox.creem.io/v1/subscriptions/sub_5EM6IgULEBVjEtMx5OH0TT/upgrade
```

If you see `[Creem] Base URL: undefined` → env variables not loaded

## Current State

Your `.env.local` file has:
```bash
CREEM_API_URL="https://api.creem.io"
CREEM_SANDBOX_URL="https://sandbox.creem.io"
NEXT_PUBLIC_CREEM_TEST_MODE="true"
```

This is correct! ✅

The issue is just that the **running server** doesn't have these variables yet.

## Alternative: Check If Variables Are Loaded

If you want to verify without restarting, run:

```bash
node -e "
require('dotenv').config({ path: '.env.local' });
console.log('CREEM_API_URL:', process.env.CREEM_API_URL);
console.log('CREEM_SANDBOX_URL:', process.env.CREEM_SANDBOX_URL);
console.log('NEXT_PUBLIC_CREEM_TEST_MODE:', process.env.NEXT_PUBLIC_CREEM_TEST_MODE);
"
```

Expected output:
```
CREEM_API_URL: https://api.creem.io
CREEM_SANDBOX_URL: https://sandbox.creem.io
NEXT_PUBLIC_CREEM_TEST_MODE: true
```

## After Restart

Try the upgrade again:
1. Go to Billing page
2. Click "Upgrade to Pro+"
3. Should now succeed! 🎉

The logs will show the correct sandbox URL being used.
