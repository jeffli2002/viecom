import type { Extras } from '@sentry/node';

let sentryInitialized = false;

async function getSentry() {
  if (!process.env.SENTRY_DSN) {
    return null;
  }

  const sentry = await import('@sentry/node');

  if (!sentryInitialized) {
    sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0,
    });
    sentryInitialized = true;
  }

  return sentry;
}

export async function reportServerError(error: unknown, context?: Extras) {
  console.error('[monitoring] Server error:', error, context);

  try {
    const sentry = await getSentry();
    if (sentry) {
      sentry.captureException(error, { extra: context });
    }
  } catch (reportError) {
    console.warn('[monitoring] Failed to report error to Sentry:', reportError);
  }
}
