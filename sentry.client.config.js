import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (process.env.NEXT_PUBLIC_BASE_HOST !== "localhost:3000") {
  Sentry.init({
    dsn: SENTRY_DSN || 'https://924eb0d1c0e6436e927722164b907012@o1293368.ingest.sentry.io/6516081',
    tracesSampleRate: 1.0,
    environment: process.env.NEXT_PUBLIC_NETWORK,
  });
}
