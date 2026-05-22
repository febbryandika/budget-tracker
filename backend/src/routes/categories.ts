import { Hono } from 'hono'
import { and, count, eq } from 'drizzle-orm'
import { db } from '../db'
import { categories, entries } from '../db/schema'
import { errorResponse } from '../lib/errors'
import type { AppEnv } from '../lib/middleware'
import { categoryCreateSchema as createSchema, categoryUpdateSchema as updateSchema } from '../lib/schemas'
import { zJson } from '../lib/validator'

const DEFAULT_CATEGORIES = [
  { name: 'Food',          color: '#f97316', icon: 'utensils',    type: 'expense' as const },
  { name: 'Transport',     color: '#0ea5e9', icon: 'car',         type: 'expense' as const },
  { name: 'Utilities',     color: '#a855f7', icon: 'bolt',        type: 'expense' as const },
  { name: 'Salary',        color: '#10b981', icon: 'briefcase',   type: 'income' as const },
  { name: 'Entertainment', color: '#ec4899', icon: 'film',        type: 'expense' as const },
  { name: 'Other',         color: '#6b7280', icon: 'more',        type: 'expense' as const },
]

const app = new Hono<AppEnv>()
  .get('/', async (c) => {
    const user = c.get('user')
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, user.id))

    if (existing.length > 0) return c.json(existing)

    const seeded = await db
      .insert(categories)
      .values(DEFAULT_CATEGORIES.map((row) => ({ ...row, userId: user.id, isDefault: 'true' })))
      .returning()
    return c.json(seeded)
  })
  .post('/', zJson(createSchema), async (c) => {
    const user = c.get('user')
    const body = c.req.valid('json')
    const [row] = await db
      .insert(categories)
      .values({ ...body, userId: user.id })
      .returning()
    return c.json(row, 201)
  })
  .put('/:id', zJson(updateSchema), async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const [row] = await db
      .update(categories)
      .set(body)
      .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
      .returning()
    if (!row) return errorResponse(c, 404, 'NOT_FOUND', 'Category not found')
    return c.json(row)
  })
  .delete('/:id', async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')

    const [{ value: refCount }] = await db
      .select({ value: count() })
      .from(entries)
      .where(and(eq(entries.categoryId, id), eq(entries.userId, user.id)))

    if (refCount > 0) {
      return errorResponse(c, 409, 'CATEGORY_IN_USE', 'Cannot delete category with entries')
    }

    const [row] = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
      .returning()
    if (!row) return errorResponse(c, 404, 'NOT_FOUND', 'Category not found')
    return c.json({ success: true })
  })

export default app
