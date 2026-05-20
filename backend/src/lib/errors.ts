import type { Context } from 'hono'
import type { AppEnv } from './middleware'

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
    console.error(JSON.stringify({ requestId, level: 'error', kind: 'db_connection', message: err.message }))
    return c.json(
      { error: { code: 'DB_UNAVAILABLE', message: 'Service temporarily unavailable', requestId } },
      503,
    )
  }

  console.error(JSON.stringify({ requestId, level: 'error', kind: 'internal', message: err.message, stack: err.stack }))
  return c.json(
    { error: { code: 'INTERNAL_ERROR', message: 'Internal server error', requestId } },
    500,
  )
}
