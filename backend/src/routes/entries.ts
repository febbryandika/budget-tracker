import { Hono } from 'hono'
import { and, desc, eq, like } from 'drizzle-orm'
import { db } from '../db'
import { entries } from '../db/schema'
import { errorResponse } from '../lib/errors'
import type { AppEnv } from '../lib/middleware'
import { entryCreateSchema as createSchema, entryListSchema as listSchema, entryUpdateSchema as updateSchema } from '../lib/schemas'
import { zJson, zQuery } from '../lib/validator'

const app = new Hono<AppEnv>()
  .get('/', zQuery(listSchema), async (c) => {
    const user = c.get('user')
    const { month, categoryId, limit = 500, offset = 0 } = c.req.valid('query')

    const conditions = [eq(entries.userId, user.id)]
    if (month) conditions.push(like(entries.date, `${month}%`))
    if (categoryId) conditions.push(eq(entries.categoryId, categoryId))

    const rows = await db
      .select()
      .from(entries)
      .where(and(...conditions))
      .orderBy(desc(entries.date), desc(entries.createdAt))
      .limit(limit)
      .offset(offset)
    return c.json(rows)
  })
  .get('/:id', async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')
    const [row] = await db
      .select()
      .from(entries)
      .where(and(eq(entries.id, id), eq(entries.userId, user.id)))
    if (!row) return errorResponse(c, 404, 'NOT_FOUND', 'Entry not found')
    return c.json(row)
  })
  .post('/', zJson(createSchema), async (c) => {
    const user = c.get('user')
    const body = c.req.valid('json')
    const [row] = await db
      .insert(entries)
      .values({ ...body, userId: user.id, amount: String(body.amount) })
      .returning()
    return c.json(row, 201)
  })
  .put('/:id', zJson(updateSchema), async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')
    const body = c.req.valid('json')

    const { amount, ...rest } = body
    const patch =
      amount !== undefined ? { ...rest, amount: String(amount) } : rest

    const [row] = await db
      .update(entries)
      .set(patch)
      .where(and(eq(entries.id, id), eq(entries.userId, user.id)))
      .returning()
    if (!row) return errorResponse(c, 404, 'NOT_FOUND', 'Entry not found')
    return c.json(row)
  })
  .delete('/:id', async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')
    const [row] = await db
      .delete(entries)
      .where(and(eq(entries.id, id), eq(entries.userId, user.id)))
      .returning()
    if (!row) return errorResponse(c, 404, 'NOT_FOUND', 'Entry not found')
    return c.json({ success: true })
  })

export default app
