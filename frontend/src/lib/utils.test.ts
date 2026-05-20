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
  it('formats whole numbers with two decimals', () => {
    expect(formatCurrency(1000)).toMatch(/\$1,000\.00/)
  })

  it('formats negatives', () => {
    expect(formatCurrency(-42.5)).toMatch(/-\$42\.50|\(\$42\.50\)/)
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toMatch(/\$0\.00/)
  })
})
