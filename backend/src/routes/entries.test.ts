import { describe, it, expect, vi } from 'vitest'

vi.mock('../db', async () => ({ db: (await import('../test/db')).testDb }))
vi.mock('../lib/auth', async () => ({ auth: (await import('../test/auth-mock')).authMock }))

import server from '../index'
import { authedHeaders, createCategory, createEntry, createUser, request } from '../test/helpers'

describe('GET /api/entries', () => {
  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(server, '/api/entries')
    expect(res.status).toBe(401)
  })

  it('returns only the current user\'s entries', async () => {
    const a = await createUser()
    const b = await createUser()
    await createEntry({ userId: a.id, type: 'expense', amount: 10, date: '2026-05-01' })
    await createEntry({ userId: b.id, type: 'expense', amount: 20, date: '2026-05-01' })

    const res = await request(server, '/api/entries', { headers: authedHeaders(a.id) })
    expect(res.status).toBe(200)
    const rows = res.body as Array<{ userId: string; amount: string }>
    expect(rows).toHaveLength(1)
    expect(rows[0]!.userId).toBe(a.id)
  })

  it('filters by month query', async () => {
    const u = await createUser()
    await createEntry({ userId: u.id, type: 'expense', amount: 10, date: '2026-05-15' })
    await createEntry({ userId: u.id, type: 'expense', amount: 20, date: '2026-04-15' })

    const res = await request(server, '/api/entries?month=2026-05', { headers: authedHeaders(u.id) })
    expect(res.status).toBe(200)
    const rows = res.body as Array<{ date: string }>
    expect(rows.map((r) => r.date)).toEqual(['2026-05-15'])
  })

  it('filters by categoryId query', async () => {
    const u = await createUser()
    const cat = await createCategory({ userId: u.id, name: 'Food' })
    const other = await createCategory({ userId: u.id, name: 'Other' })
    await createEntry({ userId: u.id, categoryId: cat.id, type: 'expense', amount: 5, date: '2026-05-01' })
    await createEntry({ userId: u.id, categoryId: other.id, type: 'expense', amount: 9, date: '2026-05-01' })

    const res = await request(server, `/api/entries?categoryId=${cat.id}`, {
      headers: authedHeaders(u.id),
    })
    expect(res.status).toBe(200)
    const rows = res.body as Array<{ categoryId: string }>
    expect(rows).toHaveLength(1)
    expect(rows[0]!.categoryId).toBe(cat.id)
  })
})

describe('POST /api/entries', () => {
  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(server, '/api/entries', {
      method: 'POST',
      body: JSON.stringify({ amount: 1, type: 'income', date: '2026-05-01' }),
      headers: { 'content-type': 'application/json' },
    })
    expect(res.status).toBe(401)
  })

  it('creates an entry under the current user', async () => {
    const u = await createUser()
    const res = await request(server, '/api/entries', {
      method: 'POST',
      headers: authedHeaders(u.id),
      body: JSON.stringify({ amount: 42.5, type: 'income', date: '2026-05-20', note: 'paycheck' }),
    })
    expect(res.status).toBe(201)
    const row = res.body as { userId: string; amount: string; type: string; note: string | null }
    expect(row.userId).toBe(u.id)
    expect(row.type).toBe('income')
    expect(Number(row.amount)).toBe(42.5)
    expect(row.note).toBe('paycheck')
  })

  it('rejects non-positive amount with 400', async () => {
    const u = await createUser()
    const res = await request(server, '/api/entries', {
      method: 'POST',
      headers: authedHeaders(u.id),
      body: JSON.stringify({ amount: 0, type: 'expense', date: '2026-05-20' }),
    })
    expect(res.status).toBe(400)
  })

  it('rejects malformed date with 400', async () => {
    const u = await createUser()
    const res = await request(server, '/api/entries', {
      method: 'POST',
      headers: authedHeaders(u.id),
      body: JSON.stringify({ amount: 1, type: 'expense', date: '2026/05/20' }),
    })
    expect(res.status).toBe(400)
  })
})

describe('PUT /api/entries/:id', () => {
  it('updates own entry', async () => {
    const u = await createUser()
    const e = await createEntry({ userId: u.id, type: 'expense', amount: 10, date: '2026-05-01' })

    const res = await request(server, `/api/entries/${e.id}`, {
      method: 'PUT',
      headers: authedHeaders(u.id),
      body: JSON.stringify({ amount: 99 }),
    })
    expect(res.status).toBe(200)
    const row = res.body as { amount: string }
    expect(Number(row.amount)).toBe(99)
  })

  it('returns 404 when targeting another user\'s entry', async () => {
    const a = await createUser()
    const b = await createUser()
    const e = await createEntry({ userId: b.id, type: 'expense', amount: 10, date: '2026-05-01' })

    const res = await request(server, `/api/entries/${e.id}`, {
      method: 'PUT',
      headers: authedHeaders(a.id),
      body: JSON.stringify({ amount: 99 }),
    })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/entries/:id', () => {
  it('deletes own entry', async () => {
    const u = await createUser()
    const e = await createEntry({ userId: u.id, type: 'expense', amount: 10, date: '2026-05-01' })

    const res = await request(server, `/api/entries/${e.id}`, {
      method: 'DELETE',
      headers: authedHeaders(u.id),
    })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ success: true })

    const list = await request(server, '/api/entries', { headers: authedHeaders(u.id) })
    expect(list.body).toEqual([])
  })

  it('returns 404 when targeting another user\'s entry', async () => {
    const a = await createUser()
    const b = await createUser()
    const e = await createEntry({ userId: b.id, type: 'expense', amount: 10, date: '2026-05-01' })

    const res = await request(server, `/api/entries/${e.id}`, {
      method: 'DELETE',
      headers: authedHeaders(a.id),
    })
    expect(res.status).toBe(404)
  })
})
