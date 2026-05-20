import type { Context, Next } from 'hono'
import { auth } from './auth'

type SessionData = typeof auth.$Infer.Session

export type AppEnv = {
  Variables: {
    user: SessionData['user']
    session: SessionData['session']
  }
}

export async function requireAuth(c: Context<AppEnv>, next: Next) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  c.set('user', session.user)
  c.set('session', session.session)
  await next()
}
