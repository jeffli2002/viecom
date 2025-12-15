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

  // Redirect non-www to www (canonical domain)
  // Only apply in production to avoid breaking localhost
  if (
    process.env.NODE_ENV === 'production' &&
    hostname === 'viecom.pro' &&
    !hostname.startsWith('www.')
  ) {
    const url = request.nextUrl.clone();
    url.hostname = 'www.viecom.pro';
    return NextResponse.redirect(url, 301);
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
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
