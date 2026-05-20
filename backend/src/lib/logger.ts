import type { Context, Next } from 'hono'
import type { AppEnv } from './middleware'

export async function requestLogger(c: Context<AppEnv>, next: Next) {
  const requestId = crypto.randomUUID()
  const start = performance.now()

  c.set('requestId', requestId)
  c.header('X-Request-Id', requestId)

  await next()

  const durationMs = Math.round(performance.now() - start)
  console.log(
    JSON.stringify({
      requestId,
      method: c.req.method,
      route: c.req.routePath ?? new URL(c.req.url).pathname,
      status: c.res.status,
      durationMs,
    }),
  )
}
