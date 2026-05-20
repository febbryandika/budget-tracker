import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { EntryForm } from '@/components/entry-form'
import { useCategories } from '@/hooks/use-categories'
import { useEntry } from '@/hooks/use-entry'
import { useUpdateEntry } from '@/hooks/use-entry-mutations'
import { requireAuth } from '@/lib/require-auth'

export const Route = createFileRoute('/entries/$id/edit')({
  beforeLoad: requireAuth,
  component: EditEntryPage,
})

function EditEntryPage() {
  const router = useRouter()
  const { id } = Route.useParams()

  const entryQuery = useEntry(id)
  const categoriesQuery = useCategories()
  const updateMutation = useUpdateEntry()

  async function handleSubmit(values: {
    amount: number
    type: 'income' | 'expense'
    categoryId?: string
    date: string
    note?: string
  }) {
    try {
      await updateMutation.mutateAsync({ id, patch: values })
      toast.success('Entry updated')
      router.navigate({ to: '/entries' })
    } catch {
      toast.error('Failed to save changes. Please try again.')
    }
  }

  const backLink = (
    <Link to="/entries" className="text-sm text-muted-foreground hover:text-foreground">
      ← Back to entries
    </Link>
  )

  if (entryQuery.isError) {
    return (
      <div className="mx-auto w-full max-w-lg space-y-4">
        {backLink}
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">Entry not found.</p>
          <p className="mt-1 text-muted-foreground">
            It may have been deleted. <Link to="/entries" className="underline">Return to entries</Link>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="space-y-1">
        {backLink}
        <h1 className="text-2xl font-bold">Edit entry</h1>
      </div>

      {entryQuery.isLoading || categoriesQuery.isLoading ? (
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      ) : categoriesQuery.isError ? (
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
      ) : entryQuery.data ? (
        <EntryForm
          mode="edit"
          categories={categoriesQuery.data ?? []}
          initialValues={{
            amount: entryQuery.data.amount,
            type: entryQuery.data.type,
            categoryId: entryQuery.data.categoryId ?? '',
            date: entryQuery.data.date,
            note: entryQuery.data.note ?? '',
          }}
          onSubmit={handleSubmit}
          submitting={updateMutation.isPending}
          onCancel={() => router.navigate({ to: '/entries' })}
        />
      ) : null}
    </div>
  )
}
