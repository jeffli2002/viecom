import { env } from '@/env';
import { adminClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

// Use dynamic baseURL to support both www and non-www subdomains
// In production, this will match the current origin
// In development, falls back to env variable
const getBaseURL = () => {
  try {
    // Always prefer NEXT_PUBLIC_APP_URL to keep host consistent (prevents www/apex cookie jitter)
    const fromEnv = env.NEXT_PUBLIC_APP_URL;
    if (fromEnv) return fromEnv;
  } catch {}
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [adminClient()],
});
