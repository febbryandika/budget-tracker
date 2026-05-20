import { describe, expect, it } from 'vitest'
import { aggregate, formatMonth, shiftMonth, trendFor, type DatedRow } from './summary-math'

const rows: DatedRow[] = [
  { type: 'income',  amount: '1000.00', date: '2026-05-01' },
  { type: 'income',  amount: '250.50',  date: '2026-05-15' },
  { type: 'expense', amount: '300.00',  date: '2026-05-04' },
  { type: 'expense', amount: '50.25',   date: '2026-05-20' },
  { type: 'income',  amount: '800.00',  date: '2026-04-30' },
  { type: 'expense', amount: '120.00',  date: '2026-04-10' },
]

describe('aggregate', () => {
  it('sums income and expense for the given month prefix', () => {
    expect(aggregate(rows, '2026-05')).toEqual({
      income: 1250.5,
      expense: 350.25,
      net: 900.25,
    })
  })

  it('returns zeros for a month with no rows', () => {
    expect(aggregate(rows, '2026-01')).toEqual({ income: 0, expense: 0, net: 0 })
  })

  it('treats prefix as a literal string match (no other-month bleed)', () => {
    expect(aggregate(rows, '2026-04').income).toBe(800)
    expect(aggregate(rows, '2026-04').expense).toBe(120)
  })
})

describe('shiftMonth', () => {
  it('shifts forward and backward across year boundaries', () => {
    expect(shiftMonth('2026-05', 0)).toBe('2026-05')
    expect(shiftMonth('2026-05', -5)).toBe('2025-12')
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2025-12', 1)).toBe('2026-01')
  })
})

describe('formatMonth', () => {
  it('extracts YYYY-MM from a Date', () => {
    expect(formatMonth(new Date('2026-05-20T12:34:56Z'))).toBe('2026-05')
  })
})

describe('trendFor', () => {
  it('returns 6 months ending at the anchor', () => {
    const trend = trendFor(rows, '2026-05')
    expect(trend).toHaveLength(6)
    expect(trend.map((t) => t.month)).toEqual([
      '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05',
    ])
    expect(trend.at(-1)).toMatchObject({ month: '2026-05', income: 1250.5, expense: 350.25 })
    expect(trend.at(-2)).toMatchObject({ month: '2026-04', income: 800, expense: 120 })
  })
})
