import { routing } from '@/i18n/routing';
import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const intlMiddleware = createMiddleware(routing);
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your-admin-secret-key-change-in-production';

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      if (decoded.role !== 'admin') {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Apply i18n middleware for non-admin routes
  return intlMiddleware(request);
}

export const config = {
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
