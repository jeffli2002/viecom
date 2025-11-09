import type { NextRequest } from 'next/server';

export function isTestModeRequest(request: NextRequest): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.DISABLE_AUTH === 'true' ||
    request.headers.get('x-test-mode') === 'true'
  );
}
