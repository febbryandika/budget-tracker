import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

type DB = ReturnType<typeof drizzle<typeof schema>>

let _db: DB | undefined

function getDb(): DB {
  if (_db) return _db
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  _db = drizzle(neon(url), { schema })
  return _db
}

// Proxy defers neon()/drizzle() until first use so Workers deploy validation
// (which loads the module without secrets) doesn't crash at module load.
export const db = new Proxy({} as DB, {
  get: (_, prop, receiver) => {
    const target = getDb()
    const value = Reflect.get(target, prop, receiver)
    return typeof value === 'function' ? value.bind(target) : value
  },
}) as DB
