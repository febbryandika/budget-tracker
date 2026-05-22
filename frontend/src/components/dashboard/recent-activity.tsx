import { Plus } from 'lucide-react'
import { getCategoryIcon } from '@/lib/category-icons'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Category } from '@/components/entries/entry-form-modal'

type EntryRow = {
  id: string
  categoryId: string | null
  type: 'income' | 'expense'
  amount: string
  date: string
  note: string | null
}

type Props = {
  entries: EntryRow[]
  categories: Category[]
  onAddEntry: () => void
}

const FALLBACK: Category = { id: '__none', name: 'Uncategorized', color: '#94a3b8', icon: 'more', type: 'expense' }

export function RecentActivity({ entries, categories, onAddEntry }: Props) {
  const recent = entries.slice(0, 6)
  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Recent activity</h3>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onAddEntry}>
          <Plus size={13} /> Add
        </button>
      </div>
      {recent.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--fg-muted)' }}>No activity yet this month.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {recent.map((e, i) => {
            const cat = (e.categoryId && categories.find((c) => c.id === e.categoryId)) || FALLBACK
            const CatIcon = getCategoryIcon(cat.icon)
            return (
              <div
                key={e.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0',
                  borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <span
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: cat.color + '22', color: cat.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                >
                  <CatIcon size={14} color={cat.color} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5, fontWeight: 500,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {e.note || cat.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>
                    {cat.name} · {formatDate(e.date)}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: 600, fontSize: 13.5,
                    color: e.type === 'income' ? 'var(--income-fg)' : 'var(--fg)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {e.type === 'income' ? '+' : '−'}{formatCurrency(Number(e.amount))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
