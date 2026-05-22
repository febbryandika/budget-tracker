import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { CategoryManager, type CategoryRow } from '@/components/category-manager'
import { useCategories } from '@/hooks/use-categories'
import { useEntries } from '@/hooks/use-entries'
import { requireAuth } from '@/lib/require-auth'

export const Route = createFileRoute('/categories')({
  beforeLoad: requireAuth,
  component: CategoriesPage,
})

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

function CategoriesPage() {
  const { data, isLoading, isError, refetch } = useCategories()
  const { data: entriesData } = useEntries(currentMonth())

  const entryRefs = useMemo(
    () => (entriesData?.pages.flat() ?? []).map((e) => ({ categoryId: e.categoryId })),
    [entriesData],
  )

  const categories = useMemo<CategoryRow[]>(
    () =>
      (data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        icon: (c as { icon?: string }).icon,
        type: (c as { type?: 'income' | 'expense' }).type,
        isDefault: c.isDefault,
      })),
    [data],
  )

  if (isError) {
    return (
      <div
        role="alert"
        style={{
          padding: 16, borderRadius: 'var(--radius)',
          border: '1px solid color-mix(in oklch, var(--destructive) 40%, var(--border))',
          background: 'color-mix(in oklch, var(--destructive) 5%, transparent)',
        }}
      >
        <p style={{ color: 'var(--destructive)', fontWeight: 500, fontSize: 14 }}>Failed to load categories.</p>
        <button type="button" onClick={() => refetch()} className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}>
          Try again
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="card" style={{ padding: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="shimmer" style={{ height: 48, marginBottom: 8, borderRadius: 8, background: 'var(--bg-muted)' }} />
        ))}
      </div>
    )
  }

  return <CategoryManager categories={categories} entries={entryRefs} />
}
