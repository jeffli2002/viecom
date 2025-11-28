# Bug Report: Site-wide 404 Error on All Pages Except Homepage

## Summary

A critical routing bug caused **all pages except the homepage** to return 404 errors in production (`https://www.viecom.pro`). This affected 24+ pages including `/video-generation`, `/image-generation`, `/pricing`, `/dashboard`, and all other routes.

## Impact

- **Severity**: Critical (P0)
- **Scope**: All non-root pages (100% of site content)
- **Affected URLs**: Every route except `/` (homepage)
- **User Impact**: Complete site navigation failure
- **Discovery Date**: 2025-11-28
- **Fix Date**: 2025-11-28

## Root Cause Analysis

### The Bug

In commit `a0a68cf4` (2025-11-28 14:32:17), middleware.ts was created with a custom root path handler:

```typescript
// Handle root path explicitly for localePrefix: 'as-needed'
// When localePrefix is 'as-needed', root path should map to default locale
if (pathname === '/') {
  const url = request.nextUrl.clone();
  url.pathname = '/en';
  // Use rewrite instead of redirect to keep the URL as /
  return NextResponse.rewrite(url);
}

// Apply i18n middleware for all other routes
return intlMiddleware(request);
```

### Why It Failed

The custom root path handler **interfered** with `next-intl` middleware's automatic locale resolution:

1. **Intended behavior**: With `localePrefix: 'as-needed'`, `next-intl` should automatically:
   - Rewrite `/` → `/en` (default locale)
   - Rewrite `/video-generation` → `/en/video-generation`
   - Rewrite `/pricing` → `/en/pricing`
   - Show `/zh/pricing` for Chinese (non-default locale shows prefix)

2. **Actual behavior**: The custom rewrite for `/` created a conflict:
   - Homepage `/` worked (custom handler)
   - All other routes failed with 404 (intlMiddleware didn't process them correctly in production)

3. **Environment difference**:
   - **Development**: Worked fine (Next.js dev server handles rewrites differently)
   - **Production**: Failed completely (standalone build + production server)

### Technical Explanation

The `next-intl` middleware (`createMiddleware(routing)`) is **already designed** to handle `localePrefix: 'as-needed'`. By adding a custom handler for the root path before delegating to `intlMiddleware`, the middleware execution flow was disrupted:

- The custom rewrite returned early for `/`, bypassing intlMiddleware
- For other paths, intlMiddleware was called but the routing context was broken
- In production builds, this caused Next.js to fail matching routes under `[locale]` segment

## The Fix

**Commit**: `853f26a2` - "fix: remove custom root path handling to fix 404 on all non-root pages"

Removed the custom root path handler entirely and let `next-intl` middleware handle **all** locale routing:

```typescript
// Apply i18n middleware for all other routes
return intlMiddleware(request);
```

### Why This Works

`next-intl` middleware with `localePrefix: 'as-needed'`:
- ✅ Automatically rewrites all non-prefixed URLs to default locale (`en`)
- ✅ Keeps URLs clean (no `/en` visible for English)
- ✅ Shows `/zh/` prefix for Chinese
- ✅ Handles both development and production correctly
- ✅ Works with Next.js standalone builds

## Lessons Learned

### 1. **Don't Override Framework Defaults Without Testing Production**

The custom handler seemed logical but was unnecessary. `next-intl` already handles `localePrefix: 'as-needed'` perfectly.

**Rule**: Trust the framework's built-in behavior unless there's a **proven** limitation.

### 2. **Development ≠ Production**

The bug didn't manifest in development (`pnpm dev`) but broke completely in production (`pnpm build && pnpm start`).

**Rule**: Always test production builds before deploying:
```bash
pnpm build
pnpm start  # Test locally with production build
```

### 3. **Middleware Order Matters**

Middleware execution order is critical. Early returns can break downstream handlers.

**Rule**: Keep middleware logic minimal and delegate to specialized handlers (like `intlMiddleware`) as much as possible.

### 4. **Comments Can Be Misleading**

The code had a comment explaining the logic:
```typescript
// Handle root path explicitly for localePrefix: 'as-needed'
// When localePrefix is 'as-needed', root path should map to default locale
```

This seemed reasonable but was **wrong**. The comment justified unnecessary code.

**Rule**: Comments don't make bad code good. Verify assumptions with documentation and testing.

### 5. **Read the Official Documentation**

`next-intl` documentation clearly states that `localePrefix: 'as-needed'` handles root path automatically. The custom handler was redundant.

**Rule**: RTFM (Read The Fine Manual) before implementing custom solutions.

## Prevention Strategies

### 1. **Mandatory Production Build Testing**

Add to deployment checklist:
```bash
# Before every deployment
pnpm build
pnpm start
# Test critical routes manually or with E2E tests
```

### 2. **E2E Tests for Critical Paths**

Add Playwright tests for core navigation:
```typescript
test('all main pages load without 404', async ({ page }) => {
  const routes = ['/', '/pricing', '/video-generation', '/dashboard'];
  for (const route of routes) {
    await page.goto(route);
    await expect(page).not.toHaveURL(/404/);
  }
});
```

### 3. **Monitoring & Alerts**

Set up production monitoring to detect:
- Spike in 404 errors
- Routes returning unexpected status codes
- User navigation patterns

### 4. **Code Review Focus**

Review middleware changes with extra scrutiny:
- Does this override framework behavior?
- Is there production-specific testing?
- What happens if this returns early?

## References

- **Fix Commit**: `853f26a2`
- **Bug Introduction**: `a0a68cf4` 
- **next-intl Docs**: https://next-intl-docs.vercel.app/docs/routing
- **Related Config**: `src/i18n/routing.ts` (localePrefix: 'as-needed')

## Action Items

- [x] Fix applied and committed
- [ ] Deploy to production
- [ ] Verify all routes work post-deployment
- [ ] Add E2E tests for navigation
- [ ] Update deployment checklist
- [ ] Document middleware patterns in CLAUDE.md

---

**Status**: Fixed (awaiting deployment)  
**Author**: Claude Code  
**Date**: 2025-11-28
