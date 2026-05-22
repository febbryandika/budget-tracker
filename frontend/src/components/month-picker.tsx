import { Calendar, ChevronDown } from 'lucide-react'
import { formatMonthLong } from '@/lib/format'

type Props = {
  value: string
  onChange: (month: string) => void
}

function buildOptions(value: string): { value: string; label: string }[] {
  const today = new Date()
  const base = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
  const opts: { value: string; label: string }[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - i, 1))
    const v = d.toISOString().slice(0, 7)
    opts.push({ value: v, label: formatMonthLong(v) })
  }
  if (!opts.some((o) => o.value === value)) {
    opts.unshift({ value, label: formatMonthLong(value) })
  }
  return opts
}

export function MonthPicker({ value, onChange }: Props) {
  const options = buildOptions(value)
  return (
    <div style={{ position: 'relative' }}>
      <label htmlFor="month-picker" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        Month
      </label>
      <select
        id="month-picker"
        className="select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ paddingLeft: 36, paddingRight: 32, height: 40, width: 180, appearance: 'none', cursor: 'pointer' }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--fg-muted)' }}>
        <Calendar size={15} />
      </div>
      <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--fg-muted)' }}>
        <ChevronDown size={14} />
      </div>
    </div>
  )
}
