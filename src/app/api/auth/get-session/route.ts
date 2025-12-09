import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    return NextResponse.json(
      {
        success: true,
        session,
        authenticated: Boolean(session?.user?.id),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[get-session] failed to load session', error);
    return NextResponse.json(
      {
        success: false,
        session: null,
        authenticated: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    );
  }
}


