export type DatedRow = {
  type: 'income' | 'expense'
  amount: string
  date: string
}

export type Totals = {
  income: number
  expense: number
  net: number
}

export function formatMonth(d: Date): string {
  return d.toISOString().slice(0, 7)
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  return formatMonth(new Date(Date.UTC(y, m - 1 + delta, 1)))
}

export function aggregate(rows: DatedRow[], prefix: string): Totals {
  const slice = rows.filter((r) => r.date.startsWith(prefix))
  const income = slice
    .filter((r) => r.type === 'income')
    .reduce((s, r) => s + Number(r.amount), 0)
  const expense = slice
    .filter((r) => r.type === 'expense')
    .reduce((s, r) => s + Number(r.amount), 0)
  return { income, expense, net: income - expense }
}

export function trendFor(rows: DatedRow[], anchor: string, window = 6) {
  const months = Array.from({ length: window }, (_, i) => shiftMonth(anchor, i - (window - 1)))
  return months.map((m) => ({ month: m, ...aggregate(rows, m) }))
}
