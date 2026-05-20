import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import {
  CategoryInUseError,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/use-category-mutations'

type Category = {
  id: string
  name: string
  color: string
  isDefault: string
}

type Props = {
  categories: Category[]
}

const DEFAULT_NEW_COLOR = '#6366f1'

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const colorInputClass =
  'h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-0.5 focus:outline-none focus:ring-2 focus:ring-ring'

export function CategoryManager({ categories }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState(DEFAULT_NEW_COLOR)
  const [editError, setEditError] = useState<string | null>(null)

  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(DEFAULT_NEW_COLOR)

  const [deleteError, setDeleteError] = useState<{ id: string; message: string } | null>(null)

  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  function startEdit(c: Category) {
    setEditingId(c.id)
    setEditName(c.name)
    setEditColor(c.color)
    setEditError(null)
    setDeleteError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditError(null)
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (name === '') return
    try {
      await createMutation.mutateAsync({ name, color: newColor })
      setNewName('')
      toast.success('Category added')
    } catch {
      toast.error('Failed to create category. Please try again.')
    }
  }

  async function handleSave(id: string) {
    setEditError(null)
    const name = editName.trim()
    if (name === '') {
      setEditError('Name is required')
      return
    }
    try {
      await updateMutation.mutateAsync({ id, patch: { name, color: editColor } })
      setEditingId(null)
      toast.success('Category updated')
    } catch {
      toast.error('Failed to save changes. Please try again.')
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this category?')) return
    setDeleteError(null)
    try {
      await deleteMutation.mutateAsync({ id })
      toast.success('Category deleted')
    } catch (err) {
      if (err instanceof CategoryInUseError) {
        setDeleteError({ id, message: err.message })
      } else {
        toast.error('Failed to delete category. Please try again.')
      }
    }
  }

  const deletingId = deleteMutation.isPending ? deleteMutation.variables?.id ?? null : null

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <form
        onSubmit={handleCreate}
        className="flex flex-wrap items-end gap-3 border-b bg-muted/30 p-4"
      >
        <div className="space-y-1">
          <label htmlFor="new-category-color" className="text-xs font-medium text-muted-foreground">
            Color
          </label>
          <input
            id="new-category-color"
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className={colorInputClass}
            aria-label="New category color"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label htmlFor="new-category-name" className="text-xs font-medium text-muted-foreground">
            New category
          </label>
          <input
            id="new-category-name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            maxLength={100}
            placeholder="e.g. Travel"
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {createMutation.isPending ? 'Adding…' : 'Add'}
        </button>
      </form>

      <ul role="list" className="divide-y">
        {categories.map((c) => {
          const isEditing = editingId === c.id
          const isDefault = c.isDefault === 'true'
          const rowDeleteError = deleteError?.id === c.id ? deleteError.message : null
          return (
            <li key={c.id} className="px-4 py-3">
              {isEditing ? (
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className={colorInputClass}
                    aria-label="Category color"
                  />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={100}
                    required
                    className={`${inputClass} flex-1`}
                    aria-label="Category name"
                  />
                  <button
                    type="button"
                    onClick={() => handleSave(c.id)}
                    disabled={updateMutation.isPending}
                    className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {updateMutation.isPending ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={updateMutation.isPending}
                    className="rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  {editError && (
                    <p role="alert" className="basis-full text-sm text-destructive">
                      {editError}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full"
                    style={{ backgroundColor: c.color }}
                    aria-hidden
                  />
                  <span className="font-medium text-foreground">{c.name}</span>
                  {isDefault && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Default
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="text-destructive hover:underline disabled:opacity-50"
                    >
                      {deletingId === c.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                  {rowDeleteError && (
                    <p role="alert" className="basis-full text-sm text-destructive">
                      {rowDeleteError}
                    </p>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
