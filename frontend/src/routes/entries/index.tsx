import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CategoryFilter } from '@/components/category-filter'
import { EntryTable } from '@/components/entry-table'
import { MonthPicker } from '@/components/month-picker'
import { useCategories } from '@/hooks/use-categories'
import { useEntries } from '@/hooks/use-entries'
import { useDeleteEntry } from '@/hooks/use-entry-mutations'
import { requireAuth } from '@/lib/require-auth'

export const Route = createFileRoute('/entries/')({
  beforeLoad: requireAuth,
  component: EntriesPage,
})

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

function EntriesPage() {
  const [month, setMonth] = useState(currentMonth)
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined)

  const { data: entries, isLoading, isError, refetch } = useEntries(month, categoryId)
  const { data: categories } = useCategories()
  const deleteMutation = useDeleteEntry()

  const categoryMap = useMemo(() => {
    const m = new Map<string, { name: string; color: string }>()
    for (const c of categories ?? []) m.set(c.id, { name: c.name, color: c.color })
    return m
  }, [categories])

  function handleDelete(id: string) {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => toast.success('Entry deleted'),
        onError: () => toast.error('Failed to delete the entry. Please try again.'),
      },
    )
  }

  const deletingId = deleteMutation.isPending ? deleteMutation.variables?.id ?? null : null
  const isEmpty = !isLoading && !isError && (entries?.length ?? 0) === 0

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Entries</h1>
          <p className="text-sm text-muted-foreground">
            Review and manage your income and expenses.
          </p>
        </div>
        <Link
          to="/entries/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Add entry
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-4">
        <MonthPicker value={month} onChange={setMonth} />
        <CategoryFilter
          categories={categories ?? []}
          value={categoryId}
          onChange={setCategoryId}
        />
      </div>

      {isError ? (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">Failed to load entries.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 text-sm underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      ) : isLoading ? (
        <div className="space-y-2 rounded-lg border bg-card p-4 shadow-sm">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-10 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            No entries for this filter. Add one to get started.
          </p>
          <Link
            to="/entries/new"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add your first entry
          </Link>
        </div>
      ) : (
        <EntryTable
          entries={entries ?? []}
          categoryMap={categoryMap}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      )}

    </div>
  )
}
