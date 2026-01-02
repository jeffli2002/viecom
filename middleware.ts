import { routing } from '@/i18n/routing';
import { jwtVerify } from 'jose';
import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Middleware] Processing:', pathname);
  }

  // Canonical host redirect (enforce single host)
  // - Uses NEXT_PUBLIC_APP_URL when available; falls back to www.viecom.pro
  // - Skips localhost and vercel preview deployments
  const canonicalHost = (() => {
    try {
      const envUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (envUrl) return new URL(envUrl).host;
    } catch (_) {}
    return 'www.viecom.pro';
  })();

  const isLocalOrPreview =
    hostname === 'localhost' ||
    hostname.startsWith('localhost:') ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.vercel.app');

  if (!isLocalOrPreview && hostname !== canonicalHost) {
    const url = request.nextUrl.clone();
    url.hostname = canonicalHost;
    url.protocol = 'https';
    return NextResponse.redirect(url, 308);
  }

  // Never apply i18n logic to API routes (but host canonicalization above still ran)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Handle admin routes (no i18n needed)
  if (pathname.startsWith('/admin')) {
    // Allow login page
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Check admin auth for other admin routes
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      const JWT_SECRET =
        process.env.ADMIN_JWT_SECRET || 'your-admin-secret-key-change-in-production';
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      if (payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      return NextResponse.next();
    } catch (_error) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Redirect root path to default locale home
  if (pathname === '/') {
    const redirectUrl = new URL(`/${routing.defaultLocale}`, request.url);
    if (process.env.NODE_ENV === 'development') {
      console.log('[Middleware] Redirecting / to:', redirectUrl.pathname);
    }
    return NextResponse.redirect(redirectUrl, 301);
  }

  const matchesLocalePrefix = routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (!matchesLocalePrefix) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${routing.defaultLocale}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
    return NextResponse.redirect(redirectUrl);
  }

  // Apply i18n middleware for all other routes
  // This handles locale validation, routing, and redirects
  const response = intlMiddleware(request);
  if (process.env.NODE_ENV === 'development') {
    console.log('[Middleware] intlMiddleware response status:', response.status);
  }
  return response;
}

export const config = {
  // Match all request paths except for the ones starting with:
  // - api (API routes)
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  // - files with extensions (e.g. .png, .jpg, etc.)
  matcher: [
    // Ensure auth callbacks also use canonical host
    '/api/auth/:path*',
    // Match all other paths except internals/static
    '/((?!_next|_vercel|.*\\..*).*)',
  ],
};
