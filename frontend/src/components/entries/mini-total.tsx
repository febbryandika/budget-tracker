import { TrendingDown, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/format'

type Props = {
  label: string
  value: number
  tone: 'income' | 'expense'
  sign?: boolean
}

export function MiniTotal({ label, value, tone, sign }: Props) {
  const fg = tone === 'income' ? 'var(--income-fg)' : 'var(--expense-fg)'
  const bg = tone === 'income' ? 'var(--income-bg)' : 'var(--expense-bg)'
  return (
    <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
      <span
        style={{
          width: 36, height: 36, borderRadius: 8,
          background: bg, color: fg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {tone === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
      </span>
      <div>
        <div style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>{label}</div>
        <div className="t-display" style={{ fontSize: 18, color: fg, fontVariantNumeric: 'tabular-nums' }}>
          {sign ? (value >= 0 ? '+' : '−') : ''}
          {formatCurrency(Math.abs(value))}
        </div>
      </div>
    </div>
  )
}
