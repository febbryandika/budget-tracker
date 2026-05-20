import { eq } from 'drizzle-orm'
import { user as userTable } from '../db/schema'
import { testDb } from './db'

async function getSession({ headers }: { headers: Headers }) {
  const userId = headers.get('x-test-user-id')
  if (!userId) return null
  const [u] = await testDb.select().from(userTable).where(eq(userTable.id, userId))
  if (!u) return null
  return {
    user: u,
    session: {
      id: `test-session-${userId}`,
      userId,
      token: 'test-token',
      expiresAt: new Date(Date.now() + 3_600_000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: null,
      userAgent: null,
    },
  }
}

export const authMock = {
  api: { getSession },
  handler: async () => new Response('ok', { status: 200 }),
  $Infer: { Session: {} as unknown },
}
