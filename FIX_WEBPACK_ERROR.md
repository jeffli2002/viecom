# Fix Webpack Module Error

## The Problem
```
TypeError: __webpack_modules__[moduleId] is not a function
```

This means Next.js build cache is corrupted or there's a module import issue.

## Solution: Clear Cache and Rebuild

### Step 1: Stop Dev Server
Press `Ctrl+C` in the terminal where `pnpm dev` is running

### Step 2: Clear Next.js Cache
```powershell
# Delete the .next folder
Remove-Item -Recurse -Force .next

# Clear node_modules cache (optional but recommended)
pnpm store prune
```

### Step 3: Reinstall Dependencies (if needed)
```powershell
pnpm install
```

### Step 4: Restart Dev Server
```powershell
pnpm dev
```

### Step 5: Wait for Complete Rebuild
You should see:
```
✓ Ready in 5-10s
○ Compiling / ...
✓ Compiled / in XXXms
```

### Step 6: Test Upgrade Again
1. Refresh your browser (F5)
2. Go to billing page
3. Click "Upgrade to Pro+"
4. Should work now\!

## Quick Version (PowerShell)

```powershell
# Stop dev server (Ctrl+C first)
Remove-Item -Recurse -Force .next
pnpm dev
```

Then test upgrade again after the server is ready.

## Why This Happens

- Next.js caches compiled modules in `.next` folder
- Sometimes after code changes, the cache gets out of sync
- Deleting `.next` forces a fresh build
- This is safe - it's just a build cache, not your source code

## Expected After Fix

After restarting with clean cache:
- ✅ No webpack errors
- ✅ Auth endpoint works
- ✅ Upgrade endpoint works
- ✅ Logs appear in terminal
- ✅ Upgrade succeeds or shows proper error
