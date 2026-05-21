import * as Sentry from '@sentry/cloudflare'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { cors } from 'hono/cors'
import { auth } from './lib/auth'
import { handleError } from './lib/errors'
import { requestLogger } from './lib/logger'
import { snapshot as metricsSnapshot } from './lib/metrics'
import { authLimit } from './lib/rate-limit'
import { requireAuth, type AppEnv } from './lib/middleware'
import categoriesRoutes from './routes/categories'
import entriesRoutes from './routes/entries'
import summaryRoutes from './routes/summary'
import insightsRoutes from './routes/insights'
import { sentryOptions } from './lib/sentry'

// Auth routes — better-auth handles /api/auth/**. Rate-limit sign-in/up first.
const authApp = new Hono()
  .use('/sign-in/*', authLimit)
  .use('/sign-up/*', authLimit)
  .all('/*', (c) => auth.handler(c.req.raw))

// Protected routes — chained registration so RPC types flow through
const api = new Hono<AppEnv>()
  .use('*', requireAuth)
  .get('/me', (c) => c.json({ user: c.get('user') }))
  .route('/categories', categoriesRoutes)
  .route('/entries',    entriesRoutes)
  .route('/summary',    summaryRoutes)
  .route('/insights',   insightsRoutes)

// Chain everything on the same builder so the RPC type carries every route.
// Splitting via `app.use(...)` / `app.route(...)` statements drops the chain
// generics and AppType collapses to the empty base.
const app = new Hono<AppEnv>()
  .use('*', requestLogger)
  .use(
    '*',
    cors({
      origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
      allowHeaders: ['Content-Type', 'Authorization'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      exposeHeaders: ['Content-Length', 'X-Request-Id'],
      maxAge: 600,
      credentials: true,
    })
  )
  .use(
    '/api/*',
    bodyLimit({
      maxSize: 100 * 1024,
      onError: (c) =>
        c.json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large' } }, 413),
    }),
  )
  .onError(handleError)
  .get('/api/health', (c) => c.json({ status: 'ok' }))
  .get('/api/metrics', async (c) => c.json(await metricsSnapshot()))
  .route('/api/auth', authApp)
  .route('/api', api)

// Export for RPC type inference
export type AppType = typeof app

// Hono's app.fetch is a valid Workers fetch handler at runtime, but the DOM
// Request type and @cloudflare/workers-types' Request type don't structurally
// align — cast to silence the mismatch without losing the Sentry wrapper.
export default Sentry.withSentry(() => sentryOptions(), {
  fetch: app.fetch as never,
})
