import { describe, it, expect, vi } from 'vitest'

vi.mock('../db', async () => ({ db: (await import('../test/db')).testDb }))
vi.mock('../lib/auth', async () => ({ auth: (await import('../test/auth-mock')).authMock }))

import server from '../index'
import { authedHeaders, createEntry, createUser, request } from '../test/helpers'

type SummaryBody = {
  month: string
  totalIncome: number
  totalExpense: number
  net: number
  trend: Array<{ month: string; income: number; expense: number; net: number }>
}

describe('GET /api/summary', () => {
  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(server, '/api/summary?month=2026-05')
    expect(res.status).toBe(401)
  })

  it('returns correct totals for the selected month', async () => {
    const u = await createUser()
    await createEntry({ userId: u.id, type: 'income', amount: 1000, date: '2026-05-01' })
    await createEntry({ userId: u.id, type: 'expense', amount: 250, date: '2026-05-10' })
    await createEntry({ userId: u.id, type: 'expense', amount: 100, date: '2026-05-20' })
    // entry outside the month — must not contribute to totals
    await createEntry({ userId: u.id, type: 'income', amount: 9999, date: '2026-04-01' })

    const res = await request(server, '/api/summary?month=2026-05', { headers: authedHeaders(u.id) })
    expect(res.status).toBe(200)
    const body = res.body as SummaryBody
    expect(body.month).toBe('2026-05')
    expect(body.totalIncome).toBe(1000)
    expect(body.totalExpense).toBe(350)
    expect(body.net).toBe(650)
  })

  it('does not contaminate totals with another user\'s entries', async () => {
    const a = await createUser()
    const b = await createUser()
    await createEntry({ userId: a.id, type: 'income', amount: 100, date: '2026-05-01' })
    await createEntry({ userId: b.id, type: 'income', amount: 999, date: '2026-05-01' })

    const res = await request(server, '/api/summary?month=2026-05', { headers: authedHeaders(a.id) })
    const body = res.body as SummaryBody
    expect(body.totalIncome).toBe(100)
  })

  it('returns a 6-month trend ending at the anchor month', async () => {
    const u = await createUser()
    await createEntry({ userId: u.id, type: 'income', amount: 200, date: '2026-03-15' })
    await createEntry({ userId: u.id, type: 'expense', amount: 50, date: '2026-05-15' })

    const res = await request(server, '/api/summary?month=2026-05', { headers: authedHeaders(u.id) })
    const body = res.body as SummaryBody
    expect(body.trend).toHaveLength(6)
    expect(body.trend.map((p) => p.month)).toEqual([
      '2025-12',
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
    ])
    const march = body.trend.find((p) => p.month === '2026-03')!
    expect(march.income).toBe(200)
    expect(march.expense).toBe(0)
    const may = body.trend.find((p) => p.month === '2026-05')!
    expect(may.expense).toBe(50)
    const empty = body.trend.find((p) => p.month === '2026-01')!
    expect(empty).toEqual({ month: '2026-01', income: 0, expense: 0, net: 0 })
  })
})
