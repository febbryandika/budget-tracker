import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../db'
import * as schema from '../db/schema'

const isProduction = process.env.NODE_ENV === 'production'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [process.env.FRONTEND_URL ?? 'http://localhost:5173'],
  advanced: {
    useSecureCookies: isProduction,
    defaultCookieAttributes: {
      httpOnly: true,
      secure: isProduction,
      // Pages (*.pages.dev) and Worker (*.workers.dev) are different sites,
      // so the auth cookie must be SameSite=None to be sent cross-site.
      // Requires Secure, which isProduction already provides.
      sameSite: isProduction ? 'none' : 'lax',
    },
  },
})

export type Auth = typeof auth
