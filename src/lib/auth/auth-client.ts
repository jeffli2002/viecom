import { env } from '@/env';
import { adminClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

// Use dynamic baseURL to support both www and non-www subdomains
// In production, this will match the current origin
// In development, falls back to env variable
const getBaseURL = () => {
  try {
    const fromEnv = env.NEXT_PUBLIC_APP_URL;
    if (fromEnv) return fromEnv;
  } catch {}
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  const vercelUrl = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  return 'http://localhost:3000';
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [adminClient()],
});
