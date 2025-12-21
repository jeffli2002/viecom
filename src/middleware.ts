import { routing } from '@/i18n/routing';
import { jwtVerify } from 'jose';
import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

const AFFILIATE_COOKIE_NAME = 'aff_ref';
const AFFILIATE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days (server-side attribution window can differ)

function setAffiliateCookie(response: NextResponse, affiliateCode: string) {
  response.cookies.set(AFFILIATE_COOKIE_NAME, affiliateCode, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: AFFILIATE_COOKIE_MAX_AGE_SECONDS,
  });
}

export default async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;
  const affiliateRefParam = request.nextUrl.searchParams.get('ref')?.trim() || null;
  const affiliateRef =
    affiliateRefParam && /^[A-Za-z0-9_-]{4,32}$/.test(affiliateRefParam) ? affiliateRefParam : null;

  // Redirect non-www to www (canonical domain)
  // Only apply in production to avoid breaking localhost
  if (
    process.env.NODE_ENV === 'production' &&
    hostname === 'viecom.pro' &&
    !hostname.startsWith('www.')
  ) {
    const url = request.nextUrl.clone();
    url.hostname = 'www.viecom.pro';
    const response = NextResponse.redirect(url, 301);
    if (affiliateRef) {
      setAffiliateCookie(response, affiliateRef);
    }
    return response;
  }

  // Handle admin routes (no i18n needed)
  if (pathname.startsWith('/admin')) {
    // Allow login page
    if (pathname === '/admin/login') {
      const response = NextResponse.next();
      if (affiliateRef) {
        setAffiliateCookie(response, affiliateRef);
      }
      return response;
    }

    // Check admin auth for other admin routes
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      if (affiliateRef) {
        setAffiliateCookie(response, affiliateRef);
      }
      return response;
    }

    try {
      const JWT_SECRET =
        process.env.ADMIN_JWT_SECRET || 'your-admin-secret-key-change-in-production';
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      if (payload.role !== 'admin') {
        const response = NextResponse.redirect(new URL('/admin/login', request.url));
        if (affiliateRef) {
          setAffiliateCookie(response, affiliateRef);
        }
        return response;
      }

      const response = NextResponse.next();
      if (affiliateRef) {
        setAffiliateCookie(response, affiliateRef);
      }
      return response;
    } catch (_error) {
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      if (affiliateRef) {
        setAffiliateCookie(response, affiliateRef);
      }
      return response;
    }
  }

  // Redirect root path to default locale
  if (pathname === '/') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${routing.defaultLocale}`;
    const response = NextResponse.redirect(redirectUrl, 301);
    if (affiliateRef) {
      setAffiliateCookie(response, affiliateRef);
    }
    return response;
  }

  const matchesLocalePrefix = routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (!matchesLocalePrefix) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${routing.defaultLocale}${
      pathname.startsWith('/') ? pathname : `/${pathname}`
    }`;
    const response = NextResponse.redirect(redirectUrl);
    if (affiliateRef) {
      setAffiliateCookie(response, affiliateRef);
    }
    return response;
  }

  // Apply i18n middleware for all other routes (handles locale redirects/detection)
  const response = intlMiddleware(request);
  if (affiliateRef) {
    setAffiliateCookie(response, affiliateRef);
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
