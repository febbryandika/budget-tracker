import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { EntryFormModal, type Category, type EntryDraft } from '@/components/entries/entry-form-modal'
import { FilterPill } from '@/components/entries/filter-pill'
import { MiniTotal } from '@/components/entries/mini-total'
import { EntryTable, type EntryRow, type CategoryInfo } from '@/components/entry-table'
import { List, Plus, Search } from 'lucide-react'
import { MonthPicker } from '@/components/month-picker'
import { useCategories } from '@/hooks/use-categories'
import { useEntries } from '@/hooks/use-entries'
import { useDeleteEntry } from '@/hooks/use-entry-mutations'
import { formatMonthLong } from '@/lib/format'
import { requireAuth } from '@/lib/require-auth'

export const Route = createFileRoute('/entries/')({
  beforeLoad: requireAuth,
  component: EntriesPage,
})

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

function tally(entries: EntryRow[]) {
  let income = 0
  let expense = 0
  for (const e of entries) {
    const n = Number(e.amount)
    if (e.type === 'income') income += n
    else expense += n
  }
  return { income, expense, net: income - expense }
}

function EntriesPage() {
  const [month, setMonth] = useState(currentMonth)
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined)
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [search, setSearch] = useState('')
  const [modalEntry, setModalEntry] = useState<EntryDraft | null>(null)
  const [showModal, setShowModal] = useState(false)

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEntries(month, categoryId)
  const { data: categoriesRaw } = useCategories()
  const deleteMutation = useDeleteEntry()

  const categories: Category[] = useMemo(
    () =>
      (categoriesRaw ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        icon: (c as { icon?: string }).icon ?? 'tag',
        type: ((c as { type?: 'income' | 'expense' }).type ?? 'expense'),
      })),
    [categoriesRaw],
  )

  const allEntries = useMemo(() => data?.pages.flat() ?? [], [data])

  const filtered = useMemo(() => {
    let list = allEntries
    if (typeFilter !== 'all') list = list.filter((e) => e.type === typeFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((e) => {
        const cat = e.categoryId ? categories.find((c) => c.id === e.categoryId) : undefined
        const inNote = (e.note ?? '').toLowerCase().includes(q)
        const inCat = (cat?.name ?? '').toLowerCase().includes(q)
        return inNote || inCat
      })
    }
    return list
  }, [allEntries, typeFilter, search, categories])

  const totals = useMemo(() => tally(filtered), [filtered])

  const categoryMap = useMemo(() => {
    const m = new Map<string, CategoryInfo>()
    for (const c of categories) m.set(c.id, { name: c.name, color: c.color, icon: c.icon })
    return m
  }, [categories])

  function openNew() {
    setModalEntry(null)
    setShowModal(true)
  }

  function openEdit(entry: EntryRow) {
    setModalEntry({
      id: entry.id,
      type: entry.type,
      amount: Number(entry.amount),
      categoryId: entry.categoryId ?? null,
      date: entry.date,
      note: entry.note ?? null,
    })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setModalEntry(null)
  }

  function handleDelete(id: string) {
    if (!window.confirm('Delete this entry?')) return
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => toast.success('Entry deleted'),
        onError: () => toast.error('Failed to delete the entry. Please try again.'),
      },
    )
  }

  function handleModalDelete(entry: EntryDraft) {
    if (!entry.id) return
    deleteMutation.mutate(
      { id: entry.id },
      {
        onSuccess: () => {
          toast.success('Entry deleted')
          closeModal()
        },
        onError: () => toast.error('Failed to delete the entry. Please try again.'),
      },
    )
  }

  const deletingId = deleteMutation.isPending ? deleteMutation.variables?.id ?? null : null
  const isEmpty = !isLoading && !isError && filtered.length === 0
  const monthLabel = formatMonthLong(month)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="t-display" style={{ fontSize: 28, marginBottom: 4 }}>Entries</h1>
          <p style={{ color: 'var(--fg-muted)', fontSize: 13.5 }}>
            {filtered.length} of {allEntries.length} entries in {monthLabel}
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Plus size={15} /> New entry
        </button>
      </header>

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 220 }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)' }}>
              <Search size={15} />
            </div>
            <label htmlFor="entries-search" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
              Search entries
            </label>
            <input
              id="entries-search"
              className="input"
              placeholder="Search note or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 38, height: 38 }}
            />
          </div>

          <MonthPicker value={month} onChange={setMonth} />

          <div
            role="tablist"
            aria-label="Entry type"
            style={{
              display: 'flex', gap: 4, padding: 4,
              background: 'var(--bg-muted)', borderRadius: 'var(--radius)', height: 38,
            }}
          >
            {([
              { id: 'all',     label: 'All' },
              { id: 'income',  label: 'Income' },
              { id: 'expense', label: 'Expense' },
            ] as const).map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={typeFilter === t.id}
                onClick={() => setTypeFilter(t.id)}
                style={{
                  padding: '0 12px', borderRadius: 6, height: 30, alignSelf: 'center',
                  background: typeFilter === t.id ? 'var(--bg-card)' : 'transparent',
                  color: typeFilter === t.id ? 'var(--fg)' : 'var(--fg-muted)',
                  fontWeight: typeFilter === t.id ? 600 : 500, fontSize: 12.5,
                  border: 'none', cursor: 'pointer',
                  boxShadow: typeFilter === t.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  fontFamily: 'inherit',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span
            style={{
              fontSize: 11.5, color: 'var(--fg-muted)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              fontWeight: 600, marginRight: 4,
            }}
          >
            Category
          </span>
          <FilterPill label="All categories" active={!categoryId} onClick={() => setCategoryId(undefined)} />
          {categories.map((c) => (
            <FilterPill
              key={c.id}
              label={c.name}
              color={c.color}
              active={categoryId === c.id}
              onClick={() => setCategoryId(c.id)}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        <MiniTotal label="Filtered income" value={totals.income} tone="income" />
        <MiniTotal label="Filtered expense" value={totals.expense} tone="expense" />
        <MiniTotal
          label="Filtered net"
          value={totals.net}
          tone={totals.net >= 0 ? 'income' : 'expense'}
          sign
        />
      </div>

      {isError ? (
        <div
          role="alert"
          style={{
            padding: 16, borderRadius: 'var(--radius)',
            border: '1px solid color-mix(in oklch, var(--destructive) 40%, var(--border))',
            background: 'color-mix(in oklch, var(--destructive) 5%, transparent)',
          }}
        >
          <p style={{ color: 'var(--destructive)', fontWeight: 500, fontSize: 14 }}>Failed to load entries.</p>
          <button type="button" onClick={() => refetch()} className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}>
            Try again
          </button>
        </div>
      ) : isLoading ? (
        <div className="card" style={{ padding: 16 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="shimmer" style={{ height: 40, marginBottom: 8, borderRadius: 6, background: 'var(--bg-muted)' }} />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState onNew={openNew} />
      ) : (
        <>
          <EntryTable
            entries={filtered}
            categoryMap={categoryMap}
            onEdit={openEdit}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
          {hasNextPage && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="btn btn-outline"
              >
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <EntryFormModal
          entry={modalEntry}
          categories={categories}
          onClose={closeModal}
          onDelete={handleModalDelete}
        />
      )}
    </div>
  )
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="card" style={{ padding: 64, textAlign: 'center' }}>
      <div
        style={{
          display: 'inline-flex', width: 56, height: 56, borderRadius: 14,
          background: 'var(--bg-muted)', color: 'var(--fg-muted)',
          alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        }}
      >
        <List size={24} />
      </div>
      <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No entries match these filters</h3>
      <p style={{ fontSize: 13.5, color: 'var(--fg-muted)', maxWidth: 360, margin: '0 auto 20px' }}>
        Try widening the filters, picking another month, or log a new entry.
      </p>
      <button type="button" className="btn btn-primary" onClick={onNew}>
        <Plus size={14} /> Add your first entry
      </button>
    </div>
  )
}

