import { auth } from '@/lib/auth/auth';
import { reportServerError } from '@/lib/monitoring/error-reporting';
import { toNextJsHandler } from 'better-auth/next-js';
import { type NextRequest, NextResponse } from 'next/server';

const handler = toNextJsHandler(auth);

export async function POST(request: NextRequest) {
  try {
    return await handler.POST(request);
  } catch (error) {
    await reportServerError(error, { route: '/api/auth/[...all]', method: 'POST' });
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    return await handler.GET(request);
  } catch (error) {
    await reportServerError(error, { route: '/api/auth/[...all]', method: 'GET' });
    throw error;
  }
}

// Handle OPTIONS preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'].filter(
    Boolean
  );

  // In development, allow localhost
  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
  }

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return new NextResponse(null, {
    status: 200,
    headers,
  });
}
