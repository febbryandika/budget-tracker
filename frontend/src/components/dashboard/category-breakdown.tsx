import { useMemo } from 'react'
import { getCategoryIcon } from '@/lib/category-icons'
import { formatCurrency, formatMonthLong } from '@/lib/format'
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
  month: string
}

export function CategoryBreakdown({ entries, categories, month }: Props) {
  const rows = useMemo(() => {
    const expenseEntries = entries.filter((e) => e.type === 'expense')
    const total = expenseEntries.reduce((s, e) => s + Number(e.amount), 0)
    const byCat = new Map<string, number>()
    for (const e of expenseEntries) {
      const id = e.categoryId ?? '__none'
      byCat.set(id, (byCat.get(id) ?? 0) + Number(e.amount))
    }
    return {
      total,
      list: Array.from(byCat.entries())
        .map(([id, amount]) => {
          const cat = categories.find((c) => c.id === id) ?? {
            id,
            name: 'Uncategorized',
            color: '#94a3b8',
            icon: 'more',
            type: 'expense' as const,
          }
          return { cat, amount }
        })
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6),
    }
  }, [entries, categories])

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Expenses by category</h3>
        <span className="badge">{formatMonthLong(month)}</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 16 }}>
        Total spent: <strong style={{ color: 'var(--fg)' }}>{formatCurrency(rows.total)}</strong>
      </p>
      {rows.list.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--fg-muted)' }}>No expenses this month yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.list.map((r) => {
            const pct = rows.total ? (r.amount / rows.total) * 100 : 0
            const CatIcon = getCategoryIcon(r.cat.icon)
            return (
              <div key={r.cat.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 22, height: 22, borderRadius: 6,
                        background: r.cat.color + '22', color: r.cat.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <CatIcon size={12} color={r.cat.color} />
                    </span>
                    <span style={{ fontWeight: 500 }}>{r.cat.name}</span>
                  </span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(r.amount)}{' '}
                    <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>· {pct.toFixed(0)}%</span>
                  </span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-muted)', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${pct}%`, height: '100%', background: r.cat.color, borderRadius: 3,
                      transition: 'width 0.4s',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
