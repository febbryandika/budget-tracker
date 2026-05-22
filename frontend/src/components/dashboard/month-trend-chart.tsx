import { useState } from 'react'
import { PieChart } from 'lucide-react'
import { compactCurrency, formatCurrency, formatMonthLong, formatMonthShort } from '@/lib/format'

export type TrendPoint = {
  month: string
  income: number
  expense: number
  net: number
}

type Props = {
  data: TrendPoint[]
}

const W = 1180
const H = 320
const PAD = { l: 72, r: 24, t: 24, b: 32 }

function niceTicks(max: number, count: number): number[] {
  if (max === 0) return [0, 1]
  const rawStep = max / count
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const norm = rawStep / mag
  let step: number
  if (norm < 1.5) step = 1 * mag
  else if (norm < 3) step = 2 * mag
  else if (norm < 7) step = 5 * mag
  else step = 10 * mag
  const top = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = 0; v <= top; v += step) ticks.push(v)
  return ticks
}

export function MonthTrendChart({ data }: Props) {
  const points = data.map((d) => ({ ...d, label: formatMonthShort(d.month) }))
  const hasData = points.some((d) => d.income !== 0 || d.expense !== 0)

  if (!hasData) {
    return <ChartEmptyState />
  }

  const max = Math.max(...points.map((d) => Math.max(d.income, d.expense, 1)))
  const yticks = niceTicks(max, 4)
  const yMax = yticks[yticks.length - 1]
  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b
  const bandW = innerW / points.length
  const barW = bandW * 0.22
  const baseY = PAD.t + innerH

  const [hover, setHover] = useState<number | null>(null)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="application"
      aria-label="Six month income and expense trend"
      style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
    >
      {yticks.map((t, i) => {
        const y = PAD.t + innerH - (t / yMax) * innerH
        return (
          <g key={i}>
            <line x1={PAD.l} x2={PAD.l + innerW} y1={y} y2={y} stroke="var(--border)" strokeDasharray={i === 0 ? '' : '3 3'} />
            <text x={PAD.l - 8} y={y + 4} fontSize="10.5" textAnchor="end" fill="var(--fg-muted)">
              {compactCurrency(t)}
            </text>
          </g>
        )
      })}

      {points.map((d, i) => {
        const cx = PAD.l + bandW * (i + 0.5)
        const yI = PAD.t + innerH - (d.income / yMax) * innerH
        const yE = PAD.t + innerH - (d.expense / yMax) * innerH
        const isLast = i === points.length - 1
        return (
          <g
            key={d.month}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: 'pointer' }}
          >
            <rect x={PAD.l + bandW * i} y={PAD.t} width={bandW} height={innerH} fill="transparent" />
            <rect x={cx - barW - 2} y={yI} width={barW} height={baseY - yI} rx="3" fill="var(--income)" opacity={isLast ? 1 : 0.85} />
            <rect x={cx + 2} y={yE} width={barW} height={baseY - yE} rx="3" fill="var(--expense)" opacity={isLast ? 1 : 0.85} />
            <text x={cx} y={H - 8} fontSize="11" textAnchor="middle" fill="var(--fg-muted)" fontWeight={isLast ? 700 : 500}>
              {d.label}
            </text>
            {hover === i && (
              <rect x={PAD.l + bandW * i} y={PAD.t} width={bandW} height={innerH} fill="var(--fg)" opacity="0.04" />
            )}
          </g>
        )
      })}

      <g transform="translate(72, 8)">
        <rect x="0" y="0" width="10" height="10" rx="2" fill="var(--income)" />
        <text x="16" y="9" fontSize="11" fill="var(--fg-muted)">Income</text>
        <rect x="76" y="0" width="10" height="10" rx="2" fill="var(--expense)" />
        <text x="92" y="9" fontSize="11" fill="var(--fg-muted)">Expense</text>
      </g>

      {hover !== null && (
        <ChartTooltip d={points[hover]} x={PAD.l + bandW * (hover + 0.5)} />
      )}
    </svg>
  )
}

function ChartTooltip({ d, x }: { d: TrendPoint & { label: string }; x: number }) {
  const w = 220
  const h = 124
  const tx = Math.max(72, Math.min(W - 24 - w, x - w / 2))
  return (
    <g pointerEvents="none">
      <line x1={x} x2={x} y1={PAD.t} y2={H - 28} stroke="var(--fg-muted)" strokeDasharray="4 3" opacity="0.4" />
      <foreignObject x={tx} y={PAD.t} width={w} height={h} style={{ overflow: 'visible' }}>
        <div
          style={{
            background: 'var(--bg-popover)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 10,
            fontSize: 12,
            color: 'var(--fg)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{formatMonthLong(d.month)}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--income-fg)' }}>
            <span>Income</span><span>{formatCurrency(d.income)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--expense-fg)' }}>
            <span>Expense</span><span>{formatCurrency(d.expense)}</span>
          </div>
          <div
            style={{
              display: 'flex', justifyContent: 'space-between', fontWeight: 600,
              paddingTop: 4, borderTop: '1px solid var(--border)', marginTop: 4,
            }}
          >
            <span>Net</span>
            <span style={{ color: d.net >= 0 ? 'var(--income-fg)' : 'var(--expense-fg)' }}>
              {d.net >= 0 ? '+' : '−'}{formatCurrency(Math.abs(d.net))}
            </span>
          </div>
        </div>
      </foreignObject>
    </g>
  )
}

function ChartEmptyState() {
  return (
    <div
      role="img"
      aria-label="Empty chart"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 8, padding: '48px 0', color: 'var(--fg-muted)',
      }}
    >
      <PieChart size={32} color="var(--fg-muted)" />
      <p style={{ fontSize: 14, fontWeight: 500 }}>No data to chart yet</p>
      <p style={{ fontSize: 12 }}>Add an income or expense entry to start building your trend.</p>
    </div>
  )
}

export function ChartFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>6-month trend</h3>
        <p style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Income vs expense over the last six months.</p>
      </div>
      {children}
    </div>
  )
}
