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
                formatter={(v: number) => currency.format(v)}
                labelFormatter={(label: string) => formatTick(label)}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="net" name="Net" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No data yet — add entries to see your trend.
          </div>
        )}
      </div>
    </div>
  )
}
