import { createFileRoute } from '@tanstack/react-router'
import { CategoryManager } from '@/components/category-manager'
import { useCategories } from '@/hooks/use-categories'
import { requireAuth } from '@/lib/require-auth'

export const Route = createFileRoute('/categories')({
  beforeLoad: requireAuth,
  component: CategoriesPage,
})

function CategoriesPage() {
  const { data, isLoading, isError, refetch } = useCategories()

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Customize the categories you use to tag your entries.
        </p>
      </header>

      {isError ? (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">Failed to load categories.</p>
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
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : (
        <CategoryManager categories={data ?? []} />
      )}
    </div>
  )
}
