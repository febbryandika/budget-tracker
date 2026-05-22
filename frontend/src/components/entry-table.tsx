import { Edit as EditIcon, Trash, TrendingDown, TrendingUp } from 'lucide-react'
import { getCategoryIcon } from '@/lib/category-icons'
import { formatCurrency, formatDate } from '@/lib/format'

export type EntryRow = {
  id: string
  categoryId: string | null
  type: 'income' | 'expense'
  amount: string
  date: string
  note: string | null
}

export type CategoryInfo = { name: string; color: string; icon: string }

type Props = {
  entries: EntryRow[]
  categoryMap: Map<string, CategoryInfo>
  onEdit: (entry: EntryRow) => void
  onDelete: (id: string) => void
  deletingId?: string | null
}

const FALLBACK_CAT: CategoryInfo = { name: 'Uncategorized', color: '#94a3b8', icon: 'more' }

export function EntryTable({ entries, categoryMap, onEdit, onDelete, deletingId }: Props) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table className="tbl">
        <thead>
          <tr>
            <th style={{ width: 110 }}>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Type</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
            <th style={{ width: 110, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const cat = (e.categoryId && categoryMap.get(e.categoryId)) || FALLBACK_CAT
            const CatIcon = getCategoryIcon(cat.icon)
            const amount = Number(e.amount)
            return (
              <tr key={e.id} aria-label={e.note ?? cat.name}>
                <td style={{ color: 'var(--fg-muted)', fontSize: 13, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {formatDate(e.date)}
                </td>
                <td style={{ fontWeight: 500 }}>
                  {e.note ? e.note : <span style={{ color: 'var(--fg-muted)', fontStyle: 'italic' }}>—</span>}
                </td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 22, height: 22, borderRadius: 6,
                        background: cat.color + '22', color: cat.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <CatIcon size={12} color={cat.color} />
                    </span>
                    <span style={{ fontSize: 13 }}>{cat.name}</span>
                  </span>
                </td>
                <td>
                  <span className={`badge ${e.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                    {e.type === 'income' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {e.type === 'income' ? 'Income' : 'Expense'}
                  </span>
                </td>
                <td
                  style={{
                    textAlign: 'right',
                    fontWeight: 600,
                    color: e.type === 'income' ? 'var(--income-fg)' : 'var(--fg)',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {e.type === 'income' ? '+' : '−'}
                  {formatCurrency(amount)}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 4 }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      onClick={() => onEdit(e)}
                      title="Edit"
                      aria-label="Edit"
                    >
                      <EditIcon size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      onClick={() => onDelete(e.id)}
                      disabled={deletingId === e.id}
                      title="Delete"
                      aria-label="Delete"
                      style={{ color: 'var(--destructive)' }}
                    >
                      <Trash size={14} color="var(--destructive)" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
