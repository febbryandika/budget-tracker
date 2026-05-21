import * as Sentry from '@sentry/bun'

export function initSentry() {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0,
  })
}

export function captureException(
  err: unknown,
  tags?: Record<string, string | undefined>,
) {
  if (!process.env.SENTRY_DSN) return
  Sentry.captureException(err, tags ? { tags } : undefined)
}
