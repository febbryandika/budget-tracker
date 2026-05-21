import * as Sentry from '@sentry/cloudflare'

export function sentryOptions(): Sentry.CloudflareOptions {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return { dsn: undefined as unknown as string }
  return {
    dsn,
    environment: process.env.NODE_ENV ?? 'production',
    tracesSampleRate: 0,
  }
}

export function captureException(
  err: unknown,
  tags?: Record<string, string | undefined>,
) {
  if (!process.env.SENTRY_DSN) return
  Sentry.captureException(err, tags ? { tags } : undefined)
}
