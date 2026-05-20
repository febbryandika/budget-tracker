import { formatCurrency } from '@/lib/utils'

type Props = {
  totalIncome: number
  totalExpense: number
  net: number
  loading?: boolean
}

export function SummaryCards({ totalIncome, totalExpense, net, loading }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card label="Total income" value={totalIncome} tone="income" loading={loading} />
      <Card label="Total expenses" value={totalExpense} tone="expense" loading={loading} />
      <Card
        label="Net balance"
        value={net}
        tone={net >= 0 ? 'income' : 'expense'}
        loading={loading}
      />
    </div>
  )
}

function Card({
  label,
  value,
  tone,
  loading,
}: {
  label: string
  value: number
  tone: 'income' | 'expense'
  loading?: boolean
}) {
  const toneClass =
    tone === 'income'
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-rose-600 dark:text-rose-400'

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {loading ? (
        <div className="mt-2 h-7 w-32 animate-pulse rounded bg-muted" />
      ) : (
        <p className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>
          {formatCurrency(value)}
        </p>
      )}
    </div>
  )
}
