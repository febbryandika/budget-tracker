import { createId } from '@paralleldrive/cuid2'
import { categories, entries, user as userTable } from '../db/schema'
import { testDb } from './db'

export async function createUser(overrides: { id?: string; name?: string; email?: string } = {}) {
  const id = overrides.id ?? createId()
  const now = new Date()
  const name = overrides.name ?? `Test ${id.slice(0, 6)}`
  const email = overrides.email ?? `${id}@test.local`
  await testDb.insert(userTable).values({
    id,
    name,
    email,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  })
  return { id, name, email }
}

export async function createCategory(input: {
  userId: string
  name?: string
  color?: string
  isDefault?: string
}) {
  const [row] = await testDb
    .insert(categories)
    .values({
      userId: input.userId,
      name: input.name ?? 'Test cat',
      color: input.color ?? '#123456',
      isDefault: input.isDefault ?? 'false',
    })
    .returning()
  return row!
}

export async function createEntry(input: {
  userId: string
  categoryId?: string | null
  type: 'income' | 'expense'
  amount: number | string
  date: string
  note?: string
}) {
  const [row] = await testDb
    .insert(entries)
    .values({
      userId: input.userId,
      categoryId: input.categoryId ?? null,
      type: input.type,
      amount: String(input.amount),
      date: input.date,
      note: input.note,
    })
    .returning()
  return row!
}

export function authedHeaders(userId: string): Record<string, string> {
  return { 'x-test-user-id': userId, 'content-type': 'application/json' }
}

export async function request(
  app: { fetch: (req: Request) => Response | Promise<Response> },
  path: string,
  init: RequestInit = {},
) {
  const url = `http://test${path}`
  const res = await app.fetch(new Request(url, init))
  const text = await res.text()
  let body: unknown = text
  try {
    body = JSON.parse(text)
  } catch {
    // leave as text
  }
  return { status: res.status, body, headers: res.headers }
}
