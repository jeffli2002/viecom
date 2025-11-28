# Routing & Internationalization Guidelines

## Quick Reference

**DO THIS** ✅
```typescript
// src/i18n/routing.ts
export const routing = defineRouting({
  locales: ['en', 'zh'],
  defaultLocale: 'en',
  localePrefix: 'always', // ← CORRECT
  localeDetection: true,
});
```

**NEVER DO THIS** ❌
```typescript
export const routing = defineRouting({
  locales: ['en', 'zh'],
  defaultLocale: 'en',
  localePrefix: 'as-needed', // ← WRONG: Breaks in production!
  localeDetection: true,
});
```

## Why This Matters

In November 2025, the site experienced a **critical P0 bug** where all pages except the homepage returned 404 errors in production. The root cause was using `localePrefix: 'as-needed'`, which works in development but fails in production builds.

**Impact**: 100% of site content was inaccessible to users.

## The Rules

### Rule 1: Always Use `localePrefix: 'always'`

This is the **ONLY** supported configuration for this project.

```typescript
localePrefix: 'always' // ✅ Reliable in dev and production
localePrefix: 'as-needed' // ❌ NEVER use - breaks in production
```

### Rule 2: Test Production Builds Locally

Before every deployment:

```bash
pnpm build
pnpm start

# Test these routes manually:
# - http://localhost:3000/ → should redirect to /en
# - http://localhost:3000/en/video-generation → should load
# - http://localhost:3000/en/pricing → should load
# - http://localhost:3000/zh/pricing → should load
```

### Rule 3: Keep Middleware Simple

The middleware should:
- Redirect `/` to `/en` (explicit redirect)
- Handle admin routes (bypass i18n)
- Delegate everything else to `next-intl` middleware

**DO NOT**:
- Add custom rewrite logic
- Try to "fix" or "enhance" next-intl's behavior
- Use complex conditional logic

### Rule 4: Trust Framework Conventions

`next-intl` with `localePrefix: 'always'` is battle-tested and reliable. Don't try to be clever.

## URL Structure

All URLs must include the locale prefix:

| URL | Status | Notes |
|-----|--------|-------|
| `/` | ✅ Redirects to `/en` | Root path redirect |
| `/en` | ✅ Loads | Homepage |
| `/en/video-generation` | ✅ Loads | English version |
| `/en/pricing` | ✅ Loads | English version |
| `/zh/pricing` | ✅ Loads | Chinese version |
| `/video-generation` | ❌ 404 | Missing locale prefix |
| `/pricing` | ❌ 404 | Missing locale prefix |

## File Structure

```
src/
├── app/
│   ├── [locale]/           # All pages under locale segment
│   │   ├── page.tsx        # Homepage
│   │   ├── video-generation/
│   │   ├── image-generation/
│   │   └── ...
│   └── admin/              # Admin routes (no locale)
├── i18n/
│   ├── routing.ts          # Routing configuration
│   ├── request.ts          # Request configuration
│   └── messages/
│       ├── en.json
│       └── zh.json
└── middleware.ts           # Root level (NOT in src/)
```

## Middleware Template

The middleware should look like this:

```typescript
import { routing } from '@/i18n/routing';
import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle admin routes (no i18n)
  if (pathname.startsWith('/admin')) {
    // Admin authentication logic
    return NextResponse.next();
  }

  // Redirect root to default locale
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/en', request.url));
  }

  // Let next-intl handle everything else
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

## Common Mistakes

### ❌ Mistake 1: Using `as-needed`
```typescript
localePrefix: 'as-needed' // Breaks in production!
```

### ❌ Mistake 2: Custom Rewrite Logic
```typescript
if (pathname === '/') {
  const url = request.nextUrl.clone();
  url.pathname = '/en';
  return NextResponse.rewrite(url); // Don't do this!
}
```

### ❌ Mistake 3: Links Without Locale
```tsx
<Link href="/pricing">Pricing</Link> // ❌ Will 404
<Link href="/en/pricing">Pricing</Link> // ✅ Correct
```

Use next-intl's `Link` component for automatic locale handling:
```tsx
import { Link } from '@/i18n/routing';

<Link href="/pricing">Pricing</Link> // ✅ Automatically adds locale
```

## Testing Checklist

Before deploying:

- [ ] `pnpm check` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` succeeds
- [ ] `pnpm start` works
- [ ] Test routes in production build:
  - [ ] `/` → redirects to `/en`
  - [ ] `/en/video-generation` → loads
  - [ ] `/en/image-generation` → loads
  - [ ] `/en/pricing` → loads
  - [ ] `/en/dashboard` → loads (when authenticated)
  - [ ] `/zh/pricing` → loads
  - [ ] All page navigation works
  - [ ] Language switcher works

## Resources

- **Bug Report**: `docs/BUG_REPORT_MIDDLEWARE_404.md` - Full post-mortem analysis
- **CLAUDE.md**: Main project documentation with routing section
- **next-intl Docs**: https://next-intl-docs.vercel.app/docs/routing

## Summary

**The Golden Rule**: Use `localePrefix: 'always'`, test production builds, and don't override framework behavior.

Following these guidelines prevents the "big bug" that broke the entire site in production.
