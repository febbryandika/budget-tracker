process.env.DATABASE_URL = 'postgres://test@localhost/test'
process.env.BETTER_AUTH_SECRET = 'test-secret-please-ignore'
process.env.BETTER_AUTH_URL = 'http://localhost:3000'
process.env.FRONTEND_URL = 'http://localhost:5173'
process.env.OPENAI_API_KEY = 'test-key'

// Node 20 lacks Object.groupBy (added in Node 21). Production runs on Bun,
// which supports it natively. Polyfill so test routes that use it can run.
if (typeof (Object as { groupBy?: unknown }).groupBy !== 'function') {
  ;(Object as unknown as {
    groupBy: <T, K extends PropertyKey>(
      items: Iterable<T>,
      fn: (item: T, index: number) => K,
    ) => Partial<Record<K, T[]>>
  }).groupBy = (items, fn) => {
    const result: Record<PropertyKey, unknown[]> = Object.create(null)
    let i = 0
    for (const item of items) {
      const key = fn(item, i++)
      ;(result[key] ??= []).push(item)
    }
    return result as Partial<Record<PropertyKey, unknown[]>> as never
  }
}

import { migrate } from 'drizzle-orm/pglite/migrator'
import { sql } from 'drizzle-orm'
import path from 'node:path'
import { beforeAll, beforeEach } from 'vitest'
import { testDb } from './db'

beforeAll(async () => {
  await migrate(testDb, { migrationsFolder: path.resolve(__dirname, '../../drizzle') })
})

beforeEach(async () => {
  await testDb.execute(
    sql`TRUNCATE TABLE entries, categories, "session", "account", "verification", "user" RESTART IDENTITY CASCADE`,
  )
})
