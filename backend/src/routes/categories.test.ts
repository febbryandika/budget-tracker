import { describe, it, expect, vi } from 'vitest'

vi.mock('../db', async () => ({ db: (await import('../test/db')).testDb }))
vi.mock('../lib/auth', async () => ({ auth: (await import('../test/auth-mock')).authMock }))

import server from '../index'
import { authedHeaders, createCategory, createEntry, createUser, request } from '../test/helpers'

describe('GET /api/categories', () => {
  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(server, '/api/categories')
    expect(res.status).toBe(401)
  })

  it('seeds 6 default categories on first call', async () => {
    const u = await createUser()
    const res = await request(server, '/api/categories', { headers: authedHeaders(u.id) })
    expect(res.status).toBe(200)
    const rows = res.body as Array<{ name: string; isDefault: string }>
    expect(rows).toHaveLength(6)
    expect(rows.map((r) => r.name).sort()).toEqual(
      ['Entertainment', 'Food', 'Other', 'Salary', 'Transport', 'Utilities'],
    )
    expect(rows.every((r) => r.isDefault === 'true')).toBe(true)
  })

  it('does not re-seed on subsequent calls', async () => {
    const u = await createUser()
    await request(server, '/api/categories', { headers: authedHeaders(u.id) })
    const second = await request(server, '/api/categories', { headers: authedHeaders(u.id) })
    expect((second.body as unknown[]).length).toBe(6)
  })

  it('isolates categories per user', async () => {
    const a = await createUser()
    const b = await createUser()
    await createCategory({ userId: a.id, name: 'A-only' })
    await createCategory({ userId: b.id, name: 'B-only' })

    const res = await request(server, '/api/categories', { headers: authedHeaders(a.id) })
    const names = (res.body as Array<{ name: string }>).map((r) => r.name)
    expect(names).toContain('A-only')
    expect(names).not.toContain('B-only')
  })
})

describe('POST /api/categories', () => {
  it('creates with trimmed name and hex color', async () => {
    const u = await createUser()
    const res = await request(server, '/api/categories', {
      method: 'POST',
      headers: authedHeaders(u.id),
      body: JSON.stringify({ name: '  Travel  ', color: '#abcdef' }),
    })
    expect(res.status).toBe(201)
    const row = res.body as { name: string; color: string; userId: string }
    expect(row.name).toBe('Travel')
    expect(row.color).toBe('#abcdef')
    expect(row.userId).toBe(u.id)
  })

  it('rejects malformed color with 400', async () => {
    const u = await createUser()
    const res = await request(server, '/api/categories', {
      method: 'POST',
      headers: authedHeaders(u.id),
      body: JSON.stringify({ name: 'X', color: 'red' }),
    })
    expect(res.status).toBe(400)
  })

  it('rejects empty name with 400', async () => {
    const u = await createUser()
    const res = await request(server, '/api/categories', {
      method: 'POST',
      headers: authedHeaders(u.id),
      body: JSON.stringify({ name: '   ', color: '#000000' }),
    })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/categories/:id', () => {
  it('deletes an unused category', async () => {
    const u = await createUser()
    const cat = await createCategory({ userId: u.id, name: 'Tmp' })
    const res = await request(server, `/api/categories/${cat.id}`, {
      method: 'DELETE',
      headers: authedHeaders(u.id),
    })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ success: true })
  })

  it('blocks delete with 409 CATEGORY_IN_USE when entries reference it', async () => {
    const u = await createUser()
    const cat = await createCategory({ userId: u.id, name: 'InUse' })
    await createEntry({ userId: u.id, categoryId: cat.id, type: 'expense', amount: 5, date: '2026-05-01' })

    const res = await request(server, `/api/categories/${cat.id}`, {
      method: 'DELETE',
      headers: authedHeaders(u.id),
    })
    expect(res.status).toBe(409)
    expect(res.body).toEqual({
      error: { code: 'CATEGORY_IN_USE', message: 'Cannot delete category with entries' },
    })
  })

  it('returns 404 when targeting another user\'s category', async () => {
    const a = await createUser()
    const b = await createUser()
    const cat = await createCategory({ userId: b.id, name: 'B-cat' })

    const res = await request(server, `/api/categories/${cat.id}`, {
      method: 'DELETE',
      headers: authedHeaders(a.id),
    })
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/categories/:id', () => {
  it('renames own category', async () => {
    const u = await createUser()
    const cat = await createCategory({ userId: u.id, name: 'Old' })

    const res = await request(server, `/api/categories/${cat.id}`, {
      method: 'PUT',
      headers: authedHeaders(u.id),
      body: JSON.stringify({ name: 'New' }),
    })
    expect(res.status).toBe(200)
    expect((res.body as { name: string }).name).toBe('New')
  })

  it('returns 404 when targeting another user\'s category', async () => {
    const a = await createUser()
    const b = await createUser()
    const cat = await createCategory({ userId: b.id, name: 'B-cat' })

    const res = await request(server, `/api/categories/${cat.id}`, {
      method: 'PUT',
      headers: authedHeaders(a.id),
      body: JSON.stringify({ name: 'Hacked' }),
    })
    expect(res.status).toBe(404)
  })
})
