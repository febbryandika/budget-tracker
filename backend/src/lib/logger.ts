import type { Context, Next } from 'hono'
import { recordApiError } from './metrics'
import type { AppEnv } from './middleware'

export async function requestLogger(c: Context<AppEnv>, next: Next) {
  const requestId = crypto.randomUUID()
  const start = performance.now()

  c.set('requestId', requestId)
  c.header('X-Request-Id', requestId)

  await next()

  const durationMs = Math.round(performance.now() - start)
  const status = c.res.status
  // handleError already counts 5xx errors it produces. Count 4xx (validation,
  // auth, rate-limit) and any unhandled 5xx that bypassed onError here.
  if (status >= 400 && status < 500) recordApiError(status)

  console.log(
    JSON.stringify({
      requestId,
      method: c.req.method,
      route: c.req.routePath ?? new URL(c.req.url).pathname,
      status,
      durationMs,
    }),
  )
}
