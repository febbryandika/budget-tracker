import type { Context, Next } from 'hono'
import { auth } from './auth'
import { errorResponse } from './errors'

type SessionData = typeof auth.$Infer.Session

export type AppEnv = {
  Variables: {
    user: SessionData['user']
    session: SessionData['session']
    requestId: string
  }
}

export async function requireAuth(c: Context<AppEnv>, next: Next) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    return errorResponse(c, 401, 'UNAUTHORIZED', 'Unauthorized')
  }
  c.set('user', session.user)
  c.set('session', session.session)
  await next()
}

export async function requireAdmin(c: Context<AppEnv>, next: Next) {
  const user = c.get('user')
  if (user?.role !== 'admin') {
    return errorResponse(c, 403, 'FORBIDDEN', 'Admin only')
  }
  await next()
}
