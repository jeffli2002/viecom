import { routing } from '@/i18n/routing';
import { jwtVerify } from 'jose';
import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

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
