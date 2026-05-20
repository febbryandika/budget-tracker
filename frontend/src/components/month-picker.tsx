type Props = {
  value: string
  onChange: (month: string) => void
}

const labelFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'long',
  year: 'numeric',
})

function buildOptions(value: string): { value: string; label: string }[] {
  const today = new Date()
  const base = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
  const opts: { value: string; label: string }[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - i, 1))
    const v = d.toISOString().slice(0, 7)
    opts.push({ value: v, label: labelFormatter.format(d) })
  }
  if (!opts.some((o) => o.value === value)) {
    const [y, m] = value.split('-').map(Number)
    const d = new Date(Date.UTC(y, m - 1, 1))
    opts.unshift({ value, label: labelFormatter.format(d) })
  }
  return opts
}

export function MonthPicker({ value, onChange }: Props) {
  const options = buildOptions(value)
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Month</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
