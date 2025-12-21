import { env } from '@/env';
import { auth } from '@/lib/auth/auth';
import { cookies, headers } from 'next/headers';

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
}

export interface Session {
  user?: SessionUser;
}

const safeGetSession = async (headers: Headers): Promise<Session | null> => {
  try {
    return await auth.api.getSession({ headers });
  } catch (error) {
    console.warn('[auth] Failed to fetch session, treating as unauthenticated:', error);
    return null;
  }
};

/**
 * Get session with support for DISABLE_AUTH bypass
 */
export async function getSessionWithAuthBypass(): Promise<Session | null> {
  if (env.DISABLE_AUTH === 'true') {
    return {
      user: {
        id: 'dev-user',
        email: 'dev@example.com',
        name: 'Dev User',
      },
    };
  }

  const headerList = await headers();
  const cookieHeader = headerList.get('cookie');

  if (cookieHeader) {
    return await safeGetSession(headerList);
  }

  const cookieStore = await cookies();
  const serializedCookies = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  if (!serializedCookies) {
    return null;
  }

  const fallbackHeaders = new Headers();
  fallbackHeaders.set('cookie', serializedCookies);

  return await safeGetSession(fallbackHeaders);
}

/**
 * Get session from NextRequest headers (for API routes)
 */
export async function getSessionFromRequest(requestHeaders: Headers): Promise<Session | null> {
  if (env.DISABLE_AUTH === 'true') {
    return {
      user: {
        id: 'dev-user',
        email: 'dev@example.com',
        name: 'Dev User',
      },
    };
  }

  return await safeGetSession(requestHeaders);
}
