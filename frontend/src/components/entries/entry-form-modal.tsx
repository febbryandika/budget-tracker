import { useMemo, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { Check, Loader2, Trash, TrendingDown, TrendingUp, X } from 'lucide-react'
import { useCreateEntry, useUpdateEntry } from '@/hooks/use-entry-mutations'
import { getCategoryIcon } from '@/lib/category-icons'
import { formatCurrency } from '@/lib/format'

export type Category = {
  id: string
  name: string
  color: string
  icon: string
  type: 'income' | 'expense'
}

export type EntryDraft = {
  id?: string
  type: 'income' | 'expense'
  amount: number
  categoryId?: string | null
  date: string
  note?: string | null
}

type Props = {
  entry: EntryDraft | null
  categories: Category[]
  onClose: () => void
  onDelete?: (entry: EntryDraft) => void
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function EntryFormModal({ entry, categories, onClose, onDelete }: Props) {
  const isEdit = !!entry?.id

  const initialType = entry?.type ?? 'expense'
  const initialCategoryId =
    entry?.categoryId ??
    (categories.find((c) => c.type === initialType)?.id ?? categories[0]?.id ?? '')

  const [type, setType] = useState<'income' | 'expense'>(initialType)
  const [amount, setAmount] = useState<string>(entry ? String(entry.amount) : '')
  const [categoryId, setCategoryId] = useState<string>(initialCategoryId)
  const [date, setDate] = useState<string>(entry?.date ?? todayISO())
  const [note, setNote] = useState<string>(entry?.note ?? '')
  const [error, setError] = useState<string>('')

  const createMutation = useCreateEntry()
  const updateMutation = useUpdateEntry()
  const submitting = createMutation.isPending || updateMutation.isPending

  // (Effects intentionally minimal — type-category sync handled when type button is clicked.)

  const visibleCats = useMemo(
    () => categories.filter((c) => c.type === type || c.name.toLowerCase() === 'other'),
    [categories, type],
  )

  async function handleSubmit(e?: FormEvent) {
    if (e) e.preventDefault()
    setError('')
    const num = Number(amount.replace(/[, ]/g, ''))
    if (!Number.isFinite(num) || num <= 0) {
      setError('Enter a positive amount.')
      return
    }
    const trimmedNote = note.trim() || undefined
    try {
      if (isEdit && entry?.id) {
        await updateMutation.mutateAsync({
          id: entry.id,
          patch: { type, amount: num, categoryId: categoryId || undefined, date, note: trimmedNote },
        })
        toast.success('Entry updated')
      } else {
        await createMutation.mutateAsync({
          type, amount: num, categoryId: categoryId || undefined, date, note: trimmedNote,
        })
        toast.success('Entry added')
      }
      onClose()
    } catch {
      setError(isEdit ? 'Failed to save changes. Please try again.' : 'Failed to add entry. Please try again.')
    }
  }

  function handleDelete() {
    if (!entry || !onDelete) return
    if (!window.confirm(`Delete this ${entry.type}?`)) return
    onDelete(entry)
  }

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit entry' : 'New entry'}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(10, 12, 20, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 16,
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: 520,
          boxShadow: '0 24px 60px rgba(0,0,0,0.30)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '20px 24px', borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{isEdit ? 'Edit entry' : 'New entry'}</h2>
            <p style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>
              {isEdit ? 'Update this transaction.' : 'Log a new income or expense.'}
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <span className="label">Type</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(['expense', 'income'] as const).map((t) => {
                const active = type === t
                return (
                  <button
                    key={t}
                    type="button"
                    data-testid={`entry-type-${t}`}
                    onClick={() => {
                      setType(t)
                      // Inline category sync since we removed the useEffect.
                      const current = categories.find((c) => c.id === categoryId)
                      if (!current || current.type !== t) {
                        const swap = categories.find((c) => c.type === t) ?? categories[0]
                        if (swap) setCategoryId(swap.id)
                      }
                    }}
                    style={{
                      padding: '12px 16px', borderRadius: 'var(--radius)',
                      border: `1.5px solid ${
                        active ? (t === 'income' ? 'var(--income)' : 'var(--expense)') : 'var(--border)'
                      }`,
                      background: active
                        ? (t === 'income' ? 'var(--income-bg)' : 'var(--expense-bg)')
                        : 'transparent',
                      color: active
                        ? (t === 'income' ? 'var(--income-fg)' : 'var(--expense-fg)')
                        : 'var(--fg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      fontWeight: 600, fontSize: 14, cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {t === 'income' ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                    {t === 'income' ? 'Income' : 'Expense'}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label htmlFor="entry-amount" className="label">Amount</label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--fg-muted)', fontWeight: 600, fontSize: 14,
                }}
              >
                Rp
              </div>
              <input
                id="entry-amount"
                className="input"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0"
                inputMode="decimal"
                autoFocus
                required
                style={{
                  paddingLeft: 44, height: 56, fontSize: 22, fontWeight: 700,
                  fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.01em',
                  color: type === 'income' ? 'var(--income-fg)' : 'var(--fg)',
                }}
              />
            </div>
            {amount && Number(amount) > 0 && (
              <div className="help">
                <span style={{ color: type === 'income' ? 'var(--income-fg)' : 'var(--expense-fg)' }}>
                  {type === 'income' ? '+' : '−'}{formatCurrency(Number(amount))}
                </span>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="entry-category" className="label">Category</label>
            {visibleCats.length > 0 ? (
              <div
                role="radiogroup"
                aria-labelledby="entry-category"
                style={{
                  display: 'flex', flexWrap: 'wrap', gap: 6,
                  padding: 6, background: 'var(--bg-muted)', borderRadius: 'var(--radius)',
                }}
              >
                {visibleCats.map((c) => {
                  const active = categoryId === c.id
                  const CatIcon = getCategoryIcon(c.icon)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setCategoryId(c.id)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 6,
                        background: active ? c.color + '22' : 'transparent',
                        color: active ? c.color : 'var(--fg-muted)',
                        border: 'none', fontSize: 12.5, fontWeight: active ? 600 : 500,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      <CatIcon size={13} color={active ? c.color : undefined} />
                      {c.name}
                    </button>
                  )
                })}
              </div>
            ) : (
              <select
                id="entry-category"
                className="select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">No category</option>
              </select>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label htmlFor="entry-date" className="label">Date</label>
              <input
                id="entry-date"
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="entry-note" className="label">
                Note <span style={{ color: 'var(--fg-muted)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                id="entry-note"
                type="text"
                className="input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Lunch with team"
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                padding: 10, fontSize: 13, color: 'var(--destructive)',
                background: 'color-mix(in oklch, var(--destructive) 12%, transparent)',
                borderRadius: 8,
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex', justifyContent: 'space-between', gap: 8,
            padding: 20, borderTop: '1px solid var(--border)',
          }}
        >
          <div>
            {isEdit && onDelete && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleDelete}
                disabled={submitting}
                style={{ color: 'var(--destructive)' }}
              >
                <Trash size={14} color="var(--destructive)" /> Delete
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" disabled={submitting} onClick={() => handleSubmit()}>
              {submitting ? (
                <>
                  <Loader2 size={14} className="spin" /> {isEdit ? 'Saving…' : 'Adding…'}
                </>
              ) : (
                <>
                  <Check size={14} /> {isEdit ? 'Save changes' : 'Add entry'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
  return createPortal(modal, document.body)
}
