const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

export function formatCurrency(amount: number, currency = 'Rp'): string {
  const n = Math.abs(amount)
  if (currency === 'Rp') {
    return `${currency} ${Math.round(n).toLocaleString('id-ID')}`
  }
  const formatted = n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${currency}${formatted}`
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${MONTHS_SHORT[m - 1]} ${d}, ${y}`
}

export function formatMonthLong(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return `${MONTHS_LONG[m - 1]} ${y}`
}

export function formatMonthShort(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return `${MONTHS_SHORT[m - 1]} '${String(y).slice(2)}`
}

export function monthOf(iso: string): string {
  return iso.slice(0, 7)
}

export function compactCurrency(amount: number, currency = 'Rp'): string {
  const n = Math.abs(amount)
  if (currency === 'Rp') {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
    return `${n}`
  }
  if (n >= 1000) return `${currency}${(n / 1000).toFixed(1)}k`
  return `${currency}${n.toFixed(0)}`
}
