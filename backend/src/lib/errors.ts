import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { recordApiError } from './metrics'
import { captureException } from './sentry'
import type { AppEnv } from './middleware'

export function errorResponse(
  c: Context,
  status: ContentfulStatusCode,
  code: string,
  message: string,
  extras?: Record<string, unknown>,
) {
  return c.json({ error: { code, message, ...extras } }, status)
}

const PG_CONNECTION_CODES = new Set([
  '08000', '08001', '08003', '08004', '08006', '08007', '08P01',
])
const NODE_CONNECTION_CODES = new Set([
  'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNRESET',
])

function isConnectionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { code?: unknown; cause?: unknown }
  if (typeof e.code === 'string') {
    if (PG_CONNECTION_CODES.has(e.code)) return true
    if (NODE_CONNECTION_CODES.has(e.code)) return true
  }
  if (e.cause) return isConnectionError(e.cause)
  return false
}

export function handleError(err: Error, c: Context<AppEnv>) {
  const requestId = c.get('requestId')

  if (isConnectionError(err)) {
    recordApiError(503)
    console.error(JSON.stringify({ requestId, level: 'error', kind: 'db_connection', message: err.message }))
    captureException(err, { kind: 'db_connection', requestId })
    return errorResponse(c, 503, 'DB_UNAVAILABLE', 'Service temporarily unavailable', { requestId })
  }

  recordApiError(500)
  console.error(JSON.stringify({ requestId, level: 'error', kind: 'internal', message: err.message, stack: err.stack }))
  captureException(err, { kind: 'internal', requestId, route: c.req.path })
  return errorResponse(c, 500, 'INTERNAL_ERROR', 'Internal server error', { requestId })
}
