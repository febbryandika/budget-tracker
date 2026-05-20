import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '../db/schema'

export const pg = new PGlite()
export const testDb = drizzle(pg, { schema })
