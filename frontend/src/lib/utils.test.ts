import { describe, expect, it } from 'vitest'
import { cn, formatCurrency } from './utils'

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('filters out falsy values', () => {
    expect(cn('a', false && 'b', null, undefined, 'c')).toBe('a c')
  })

  it('merges conflicting tailwind utilities (later wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })
})

describe('formatCurrency', () => {
  it('formats whole numbers in IDR with dot thousand separators', () => {
    expect(formatCurrency(1_000_000)).toMatch(/Rp\s*1\.000\.000/)
  })

  it('uses the absolute value (sign is rendered by callers)', () => {
    expect(formatCurrency(-42_500)).toMatch(/Rp\s*42\.500/)
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toMatch(/Rp\s*0/)
  })

  it('supports a non-default currency', () => {
    expect(formatCurrency(1234.5, '$')).toMatch(/\$1,234\.50/)
  })
})
