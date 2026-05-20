import { describe, expect, it } from 'vitest'
import {
  categoryCreateSchema,
  entryCreateSchema,
  entryListSchema,
  monthQuerySchema,
} from './schemas'

describe('entryCreateSchema', () => {
  const valid = {
    amount: 12.34,
    type: 'expense' as const,
    date: '2026-05-20',
    note: 'lunch',
  }

  it('accepts a well-formed entry', () => {
    expect(entryCreateSchema.parse(valid)).toEqual(valid)
  })

  it('rejects non-positive amounts', () => {
    expect(entryCreateSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false)
    expect(entryCreateSchema.safeParse({ ...valid, amount: -5 }).success).toBe(false)
  })

  it('rejects malformed dates', () => {
    expect(entryCreateSchema.safeParse({ ...valid, date: '2026-5-20' }).success).toBe(false)
    expect(entryCreateSchema.safeParse({ ...valid, date: '05-20-2026' }).success).toBe(false)
    expect(entryCreateSchema.safeParse({ ...valid, date: 'not-a-date' }).success).toBe(false)
  })

  it('rejects invalid type', () => {
    expect(entryCreateSchema.safeParse({ ...valid, type: 'transfer' }).success).toBe(false)
  })

  it('allows optional categoryId and note', () => {
    expect(entryCreateSchema.parse({ amount: 1, type: 'income', date: '2026-05-20' })).toEqual({
      amount: 1,
      type: 'income',
      date: '2026-05-20',
    })
  })
})

describe('entryListSchema', () => {
  it('accepts an optional month and categoryId', () => {
    expect(entryListSchema.parse({})).toEqual({})
    expect(entryListSchema.parse({ month: '2026-05' })).toEqual({ month: '2026-05' })
  })

  it('rejects a malformed month', () => {
    expect(entryListSchema.safeParse({ month: '2026/05' }).success).toBe(false)
    expect(entryListSchema.safeParse({ month: '2026-5' }).success).toBe(false)
  })
})

describe('categoryCreateSchema', () => {
  it('accepts a valid hex color and trimmed name', () => {
    expect(categoryCreateSchema.parse({ name: '  Travel  ', color: '#abcdef' })).toEqual({
      name: 'Travel',
      color: '#abcdef',
    })
  })

  it('rejects empty or whitespace-only name', () => {
    expect(categoryCreateSchema.safeParse({ name: '   ', color: '#000000' }).success).toBe(false)
    expect(categoryCreateSchema.safeParse({ name: '', color: '#000000' }).success).toBe(false)
  })

  it('rejects malformed color', () => {
    expect(categoryCreateSchema.safeParse({ name: 'X', color: 'red' }).success).toBe(false)
    expect(categoryCreateSchema.safeParse({ name: 'X', color: '#abc' }).success).toBe(false)
    expect(categoryCreateSchema.safeParse({ name: 'X', color: '#GGGGGG' }).success).toBe(false)
  })

  it('rejects names over 100 chars', () => {
    const long = 'x'.repeat(101)
    expect(categoryCreateSchema.safeParse({ name: long, color: '#000000' }).success).toBe(false)
  })
})

describe('monthQuerySchema', () => {
  it('accepts undefined month', () => {
    expect(monthQuerySchema.parse({})).toEqual({})
  })

  it('rejects malformed month', () => {
    expect(monthQuerySchema.safeParse({ month: '2026' }).success).toBe(false)
  })
})
