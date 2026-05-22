import { Scale, TrendingDown, TrendingUp, type LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'
import { formatCurrency } from '@/lib/format'

type TrendPoint = { month: string; income: number; expense: number; net: number }

type Props = {
  income: number
  expense: number
  net: number
  trend: TrendPoint[]
  loading?: boolean
}

function pctDelta(curr: number, prev: number): string {
  if (prev === 0) {
    if (curr === 0) return 'No change vs last month'
    return 'New activity this month'
  }
  const pct = ((curr - prev) / prev) * 100
  const sign = pct >= 0 ? '+' : '−'
  return `${sign}${Math.abs(pct).toFixed(1)}% vs last month`
}

function savingsRate(income: number, net: number): string {
  if (income <= 0) return net >= 0 ? "You're still in the black" : 'Spending exceeds income'
  const rate = Math.round((net / income) * 100)
  if (rate < 0) return 'Spending exceeds income'
  return `You saved ${rate}% this month`
}

export function SummaryCards({ income, expense, net, trend, loading }: Props) {
  const prev = trend.length >= 2 ? trend[trend.length - 2] : undefined
  const incomeDelta = loading ? '—' : prev ? pctDelta(income, prev.income) : '—'
  const expenseDelta = loading ? '—' : prev ? pctDelta(expense, prev.expense) : '—'
  const netDelta = loading ? '—' : savingsRate(income, net)

  const cards: Array<{
    label: string
    value: number
    Icon: ComponentType<LucideProps>
    tone: 'income' | 'expense'
    delta: string
    featured?: boolean
    valuePrefix?: string
  }> = [
    { label: 'Total Income',   value: income,  Icon: TrendingUp,   tone: 'income',                       delta: incomeDelta },
    { label: 'Total Expenses', value: expense, Icon: TrendingDown, tone: 'expense',                      delta: expenseDelta, valuePrefix: '−' },
    { label: 'Net Balance',    value: net,     Icon: Scale,        tone: net >= 0 ? 'income' : 'expense', delta: netDelta, featured: true },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
      {cards.map((c) => {
        const fg = c.tone === 'income' ? 'var(--income-fg)' : 'var(--expense-fg)'
        const bg = c.tone === 'income' ? 'var(--income-bg)' : 'var(--expense-bg)'
        return (
          <div
            key={c.label}
            className="card"
            style={{
              padding: 22,
              position: 'relative',
              overflow: 'hidden',
              background: c.featured
                ? 'linear-gradient(160deg, var(--bg-card), color-mix(in oklch, var(--primary) 8%, var(--bg-card)))'
                : 'var(--bg-card)',
              borderColor: c.featured ? 'color-mix(in oklch, var(--primary) 40%, var(--border))' : 'var(--border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--fg-muted)' }}>{c.label}</span>
              <span
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: bg, color: fg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <c.Icon size={16} />
              </span>
            </div>
            {loading ? (
              <div className="shimmer" style={{ height: 32, width: 160, borderRadius: 6, background: 'var(--bg-muted)', marginBottom: 6 }} />
            ) : (
              <div
                className="t-display"
                style={{
                  fontSize: 28,
                  color: c.featured ? fg : 'var(--fg)',
                  marginBottom: 6,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {c.valuePrefix ?? ''}{formatCurrency(c.value)}
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{c.delta}</div>
          </div>
        )
      })}
    </div>
  )
}
