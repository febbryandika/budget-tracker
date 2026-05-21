import { initSentry } from './lib/sentry'
initSentry()

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

const app = new Hono<AppEnv>()

app.use('*', requestLogger)
app.use(
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

// Reject payloads larger than 100 KB on /api/*. Entry/category bodies are well
// under 1 KB; this is purely a defensive cap.
app.use(
  '/api/*',
  bodyLimit({
    maxSize: 100 * 1024,
    onError: (c) =>
      c.json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large' } }, 413),
  }),
)

app.onError(handleError)

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }))

// Metrics snapshot — intended for ops scraping; gate at infra in production.
app.get('/api/metrics', async (c) => c.json(await metricsSnapshot()))

// Auth routes — better-auth handles /api/auth/**. Rate-limit sign-in/up first.
const authApp = new Hono()
  .use('/sign-in/*', authLimit)
  .use('/sign-up/*', authLimit)
  .all('/*', (c) => auth.handler(c.req.raw))

app.route('/api/auth', authApp)

// Protected routes — chained registration so RPC types flow through
const api = new Hono<AppEnv>()
  .use('*', requireAuth)
  .get('/me', (c) => c.json({ user: c.get('user') }))
  .route('/categories', categoriesRoutes)
  .route('/entries',    entriesRoutes)
  .route('/summary',    summaryRoutes)
  .route('/insights',   insightsRoutes)

app.route('/api', api)

// Export for RPC type inference
export type AppType = typeof app

const port = Number(process.env.PORT ?? 3000)
console.log(`Server running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
