import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { EntryForm } from '@/components/entry-form'
import { useCategories } from '@/hooks/use-categories'
import { useCreateEntry } from '@/hooks/use-entry-mutations'
import { requireAuth } from '@/lib/require-auth'

export const Route = createFileRoute('/entries/new')({
  beforeLoad: requireAuth,
  component: NewEntryPage,
})

function NewEntryPage() {
  const router = useRouter()
  const categoriesQuery = useCategories()
  const createMutation = useCreateEntry()

  async function handleSubmit(values: {
    amount: number
    type: 'income' | 'expense'
    categoryId?: string
    date: string
    note?: string
  }) {
    try {
      await createMutation.mutateAsync(values)
      toast.success('Entry added')
      router.navigate({ to: '/entries' })
    } catch {
      toast.error('Failed to create entry. Please try again.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="space-y-1">
        <Link to="/entries" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to entries
        </Link>
        <h1 className="text-2xl font-bold">Add entry</h1>
      </div>

      {categoriesQuery.isError ? (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">Failed to load categories.</p>
          <button
            type="button"
            onClick={() => categoriesQuery.refetch()}
            className="mt-2 text-sm underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      ) : categoriesQuery.isLoading ? (
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      ) : (
        <EntryForm
          mode="create"
          categories={categoriesQuery.data ?? []}
          onSubmit={handleSubmit}
          submitting={createMutation.isPending}
          onCancel={() => router.navigate({ to: '/entries' })}
        />
      )}
    </div>
  )
}
