// Bootstrap the super-admin user from SUPERUSER_* env vars.
//
// Idempotent: creates the admin if missing, promotes them if found with a
// non-admin role, no-op otherwise. Never overwrites an existing password.
//
// Local: `bun run bootstrap:admin` (reads backend/.env via --env-file).
// Prod:  export DATABASE_URL / BETTER_AUTH_SECRET / SUPERUSER_* from the
//        Cloudflare secrets, then run the same command locally.

import { eq } from 'drizzle-orm'
import { db } from '../src/db'
import { user } from '../src/db/schema'
import { auth } from '../src/lib/auth'

function required(name: string): string {
  const value = process.env[name]
  if (!value || value.trim() === '') {
    console.error(`Missing required env var: ${name}`)
    process.exit(1)
  }
  return value
}

const email    = required('SUPERUSER_EMAIL').toLowerCase().trim()
const name     = required('SUPERUSER_NAME').trim()
const password = required('SUPERUSER_PASSWORD')
required('DATABASE_URL')
required('BETTER_AUTH_SECRET')

const existing = await db.select().from(user).where(eq(user.email, email)).limit(1)

if (existing.length === 0) {
  const created = await auth.api.createUser({
    body: { email, name, password, role: 'admin' },
  })
  console.log(`Created admin user ${created.user.id} <${email}>`)
  process.exit(0)
}

const row = existing[0]!
if (row.role === 'admin') {
  console.log(`Already provisioned: ${row.id} <${email}> (role=admin)`)
  process.exit(0)
}

await auth.api.setRole({
  body: { userId: row.id, role: 'admin' },
})
console.log(`Promoted ${row.id} <${email}> to admin (was role=${row.role ?? 'null'})`)
