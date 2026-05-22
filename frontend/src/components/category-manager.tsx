import { useMemo, useState, type ComponentType } from 'react'
import { toast } from 'sonner'
import { Edit as EditIcon, Plus, Trash, TrendingDown, TrendingUp, type LucideProps } from 'lucide-react'
import { CategoryEditor, type CategoryDraft } from '@/components/categories/category-editor'
import { getCategoryIcon } from '@/lib/category-icons'
import {
  CategoryInUseError,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/use-category-mutations'

export type CategoryRow = {
  id: string
  name: string
  color: string
  icon?: string
  type?: 'income' | 'expense'
  isDefault: string
}

type EntryRef = { categoryId: string | null }

type Props = {
  categories: CategoryRow[]
  entries: EntryRef[]
}

const DEFAULT_DRAFT: CategoryDraft = {
  name: '',
  color: '#6366f1',
  icon: 'tag',
  type: 'expense',
}

export function CategoryManager({ categories, entries }: Props) {
  const [draft, setDraft] = useState<CategoryDraft | null>(null)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)

  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  const usageMap = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of entries) {
      if (!e.categoryId) continue
      m.set(e.categoryId, (m.get(e.categoryId) ?? 0) + 1)
    }
    return m
  }, [entries])

  const expenseCats = categories.filter((c) => (c.type ?? 'expense') === 'expense')
  const incomeCats = categories.filter((c) => c.type === 'income')

  function openNew() {
    setDraft({ ...DEFAULT_DRAFT })
    setEditingId('new')
  }

  function openEdit(c: CategoryRow) {
    setDraft({
      id: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon ?? 'tag',
      type: c.type ?? 'expense',
    })
    setEditingId(c.id)
  }

  function closeEditor() {
    setDraft(null)
    setEditingId(null)
  }

  async function handleSave() {
    if (!draft) return
    try {
      if (editingId === 'new') {
        await createMutation.mutateAsync({
          name: draft.name.trim(),
          color: draft.color,
          icon: draft.icon,
          type: draft.type,
        })
        toast.success('Category added')
      } else if (draft.id) {
        await updateMutation.mutateAsync({
          id: draft.id,
          patch: {
            name: draft.name.trim(),
            color: draft.color,
            icon: draft.icon,
            type: draft.type,
          },
        })
        toast.success('Category updated')
      }
      closeEditor()
    } catch {
      toast.error(editingId === 'new' ? 'Failed to create category.' : 'Failed to save changes.')
    }
  }

  async function handleDelete(c: CategoryRow) {
    if (!window.confirm(`Delete the category "${c.name}"?`)) return
    try {
      await deleteMutation.mutateAsync({ id: c.id })
      toast.success('Category deleted')
    } catch (err) {
      if (err instanceof CategoryInUseError) {
        toast.error(err.message)
      } else {
        toast.error('Failed to delete category. Please try again.')
      }
    }
  }

  const submitting = createMutation.isPending || updateMutation.isPending

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="t-display" style={{ fontSize: 28, marginBottom: 4 }}>Categories</h1>
            <p style={{ color: 'var(--fg-muted)', fontSize: 13.5 }}>
              {categories.length} categories · {categories.filter((c) => c.isDefault === 'true').length} are defaults
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <Plus size={15} /> New category
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          <CategoryGroup
            title="Expense categories"
            Icon={TrendingDown}
            tone="expense"
            cats={expenseCats}
            usageMap={usageMap}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
          <CategoryGroup
            title="Income categories"
            Icon={TrendingUp}
            tone="income"
            cats={incomeCats}
            usageMap={usageMap}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {draft && editingId !== null && (
        <CategoryEditor
          draft={draft}
          isNew={editingId === 'new'}
          submitting={submitting}
          onChange={setDraft}
          onCancel={closeEditor}
          onSave={handleSave}
        />
      )}
    </>
  )
}

function CategoryGroup({
  title,
  Icon,
  tone,
  cats,
  usageMap,
  onEdit,
  onDelete,
}: {
  title: string
  Icon: ComponentType<LucideProps>
  tone: 'income' | 'expense'
  cats: CategoryRow[]
  usageMap: Map<string, number>
  onEdit: (c: CategoryRow) => void
  onDelete: (c: CategoryRow) => void
}) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: tone === 'income' ? 'var(--income-bg)' : 'var(--expense-bg)',
            color: tone === 'income' ? 'var(--income-fg)' : 'var(--expense-fg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon size={14} />
        </span>
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>{title}</h3>
        <span className="badge" style={{ marginLeft: 'auto' }}>{cats.length}</span>
      </div>
      <ul role="list" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 0, listStyle: 'none' }}>
        {cats.length === 0 && (
          <li
            style={{
              fontSize: 13, color: 'var(--fg-muted)', padding: 12, textAlign: 'center',
              border: '1px dashed var(--border)', borderRadius: 'var(--radius)',
            }}
          >
            No categories yet.
          </li>
        )}
        {cats.map((c) => {
          const usage = usageMap.get(c.id) ?? 0
          const isDefault = c.isDefault === 'true'
          const CatIcon = getCategoryIcon(c.icon)
          return (
            <li
              key={c.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
              }}
            >
              <span
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: c.color + '22', color: c.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                <CatIcon size={16} color={c.color} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</span>
                  {isDefault && (
                    <span className="badge" style={{ fontSize: 10, padding: '1px 6px' }}>Default</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                  {usage} {usage === 1 ? 'entry' : 'entries'} use this
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => onEdit(c)}
                aria-label="Edit"
                title="Edit"
              >
                <EditIcon size={14} />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => onDelete(c)}
                aria-label="Delete"
                title="Delete"
                style={{ color: 'var(--destructive)' }}
              >
                <Trash size={14} color="var(--destructive)" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
