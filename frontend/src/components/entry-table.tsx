import { Link } from '@tanstack/react-router'
import { formatCurrency } from '@/lib/utils'

type EntryRow = {
  id: string
  categoryId: string | null
  type: 'income' | 'expense'
  amount: string
  date: string
  note: string | null
}

type CategoryInfo = { name: string; color: string }

type Props = {
  entries: EntryRow[]
  categoryMap: Map<string, CategoryInfo>
  onDelete: (id: string) => void
  deletingId?: string | null
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return dateFormatter.format(new Date(Date.UTC(y, m - 1, d)))
}

export function EntryTable({ entries, categoryMap, onDelete, deletingId }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Date</th>
            <th className="px-4 py-2 font-medium">Type</th>
            <th className="px-4 py-2 font-medium">Category</th>
            <th className="px-4 py-2 text-right font-medium">Amount</th>
            <th className="px-4 py-2 font-medium">Note</th>
            <th className="px-4 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {entries.map((e) => {
            const cat = e.categoryId ? categoryMap.get(e.categoryId) : null
            const amountNum = Number(e.amount)
            const isIncome = e.type === 'income'
            const toneClass = isIncome
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
            const sign = isIncome ? '+' : '−'
            return (
              <tr key={e.id} className="hover:bg-muted/30">
                <td className="whitespace-nowrap px-4 py-3 text-foreground">{formatDate(e.date)}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ' +
                      (isIncome
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-300')
                    }
                  >
                    {isIncome ? 'Income' : 'Expense'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {cat ? (
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                        aria-hidden
                      />
                      <span>{cat.name}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className={`whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums ${toneClass}`}>
                  {sign}
                  {formatCurrency(amountNum)}
                </td>
                <td className="max-w-xs px-4 py-3 text-muted-foreground">
                  <span className="line-clamp-1">{e.note ?? ''}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  <Link
                    to="/entries/$id/edit"
                    params={{ id: e.id }}
                    className="text-primary hover:underline"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Delete this entry?')) onDelete(e.id)
                    }}
                    disabled={deletingId === e.id}
                    className="ml-3 text-destructive hover:underline disabled:opacity-50"
                  >
                    {deletingId === e.id ? 'Deleting…' : 'Delete'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
