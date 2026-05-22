import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { user } from '../db/schema'
import { auth } from '../lib/auth'
import { errorResponse } from '../lib/errors'
import { requireAdmin, type AppEnv } from '../lib/middleware'
import { zJson } from '../lib/validator'

const createSchema = z.object({
  email:    z.string().email(),
  name:     z.string().trim().min(1).max(100),
  password: z.string().min(8),
})

const updateSchema = z
  .object({
    name:  z.string().trim().min(1).max(100).optional(),
    email: z.string().email().optional(),
  })
  .refine((d) => d.name !== undefined || d.email !== undefined, {
    message: 'Provide at least one of name or email',
  })

const passwordSchema = z.object({
  newPassword: z.string().min(8),
})

const app = new Hono<AppEnv>()
  .use('*', requireAdmin)
  .get('/users', async (c) => {
    const result = await auth.api.listUsers({
      query: { limit: 100 },
      headers: c.req.raw.headers,
    })
    return c.json(result)
  })
  .post('/users', zJson(createSchema), async (c) => {
    const body = c.req.valid('json')
    const result = await auth.api.createUser({
      body: { ...body, role: 'user' },
      headers: c.req.raw.headers,
    })
    return c.json(result, 201)
  })
  .patch('/users/:id', zJson(updateSchema), async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const [row] = await db
      .update(user)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning()
    if (!row) return errorResponse(c, 404, 'NOT_FOUND', 'User not found')
    return c.json(row)
  })
  .post('/users/:id/password', zJson(passwordSchema), async (c) => {
    const id = c.req.param('id')
    const { newPassword } = c.req.valid('json')
    await auth.api.setUserPassword({
      body: { userId: id, newPassword },
      headers: c.req.raw.headers,
    })
    return c.json({ success: true })
  })
  .delete('/users/:id', async (c) => {
    const id = c.req.param('id')
    const self = c.get('user')
    if (id === self.id) {
      return errorResponse(c, 400, 'CANNOT_DELETE_SELF', 'Cannot delete your own account')
    }
    await auth.api.removeUser({
      body: { userId: id },
      headers: c.req.raw.headers,
    })
    return c.json({ success: true })
  })

export default app
