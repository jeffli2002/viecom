# Quick Fix: Creem 403 Forbidden Error

## TL;DR

**Problem**: Upgrade returns 403 Forbidden
**Cause**: Dev server using wrong Creem endpoint
**Fix**: Restart your development server

## The Fix (30 seconds)

```bash
# Stop your current dev server (Ctrl+C)

# Restart it
pnpm dev
```

That's it! Try the upgrade again.

## Why This Works

Your `.env.local` already has the correct setting:
```bash
NEXT_PUBLIC_CREEM_TEST_MODE="true"
```

But Next.js needs a restart to load changes to `NEXT_PUBLIC_*` variables.

## Verify It Worked

Run this diagnostic:
```bash
npm run diagnose:creem
```

You should see:
```
✅ SUCCESS with serverIdx 1
Subscription: { "id": "sub_5EM6IgULEBVjEtMx5OH0TT", ... }
```

## What Was Happening

Before restart:
```
Your Code → Production Endpoint (api.creem.io)
Test API Key → ❌ 403 Forbidden
```

After restart:
```
Your Code → Sandbox Endpoint (sandbox.creem.io)  
Test API Key → ✅ Works!
```

## If It Still Doesn't Work

1. **Check if server actually restarted**:
   ```bash
   # Make sure no old processes are running
   ps aux | grep "next dev"
   ```

2. **Hard reset**:
   ```bash
   rm -rf .next
   pnpm dev
   ```

3. **Run full diagnostics**:
   ```bash
   npm run diagnose:creem
   ```
   Share the output if you need help.

## For Future Reference

Whenever you change a `NEXT_PUBLIC_*` environment variable:
1. Stop dev server
2. Restart dev server
3. That's it

These variables are embedded at startup and don't hot-reload.

## Documentation

For detailed analysis, see:
- `CREEM_403_FINAL_REPORT.md` - Complete investigation
- `FIX_CREEM_403_SOLUTION.md` - Detailed solution guide
- `CREEM_403_ROOT_CAUSE_ANALYSIS.md` - Technical deep dive

## Tools Created

Two diagnostic tools were added to help troubleshoot:

```bash
npm run diagnose:creem          # Full API diagnostics
npm run diagnose:creem-create   # Test write permissions
```

Keep these for future Creem API debugging!
