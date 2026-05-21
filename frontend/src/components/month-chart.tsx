import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type TrendPoint = { month: string; income: number; expense: number; net: number }

const shortMonth = new Intl.DateTimeFormat(undefined, { month: 'short', year: '2-digit' })

function formatTick(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return shortMonth.format(new Date(Date.UTC(y, m - 1, 1)))
}

const currency = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function ChartEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
      <svg
        viewBox="0 0 160 80"
        role="img"
        aria-label="Empty chart illustration"
        className="h-20 w-40 text-muted-foreground/40"
      >
        <line x1="8" y1="72" x2="152" y2="72" stroke="currentColor" strokeWidth="1.5" />
        <line x1="8" y1="8" x2="8" y2="72" stroke="currentColor" strokeWidth="1.5" />
        <rect x="24"  y="56" width="14" height="14" rx="2" fill="currentColor" opacity="0.4" />
        <rect x="48"  y="46" width="14" height="24" rx="2" fill="currentColor" opacity="0.55" />
        <rect x="72"  y="38" width="14" height="32" rx="2" fill="currentColor" opacity="0.7" />
        <rect x="96"  y="50" width="14" height="20" rx="2" fill="currentColor" opacity="0.55" />
        <rect x="120" y="32" width="14" height="38" rx="2" fill="currentColor" opacity="0.85" />
      </svg>
      <p className="text-sm font-medium text-muted-foreground">No data to chart yet</p>
      <p className="text-xs text-muted-foreground/80">
        Add an income or expense entry to start building your trend.
      </p>
    </div>
  )
}

export function MonthChart({ data }: { data: TrendPoint[] }) {
  const hasData = data.some((d) => d.income !== 0 || d.expense !== 0)

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-medium text-muted-foreground">Last 6 months</h2>
      <div className="mt-3 h-64">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="month"
                tickFormatter={formatTick}
                tick={{ fontSize: 12 }}
                stroke="currentColor"
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={(v: number) => currency.format(v)}
                tick={{ fontSize: 12 }}
                width={70}
                stroke="currentColor"
                className="text-muted-foreground"
              />
              <Tooltip
                formatter={(value) => currency.format(Number(value))}
                labelFormatter={(label) =>
                  typeof label === 'string' ? formatTick(label) : String(label)
                }
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="net" name="Net" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmptyState />
        )}
      </div>
    </div>
  )
}
