import { useState, type FormEvent } from 'react'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import { cn } from '@/lib/utils'

export type EntryFormInitialValues = {
  amount?: string
  type?: 'income' | 'expense'
  categoryId?: string
  date?: string
  note?: string
}

type SubmitValues = {
  amount: number
  type: 'income' | 'expense'
  categoryId?: string
  date: string
  note?: string
}

type Category = { id: string; name: string; color: string }

type Props = {
  mode: 'create' | 'edit'
  initialValues?: EntryFormInitialValues
  categories: Category[]
  onSubmit: (values: SubmitValues) => Promise<void> | void
  submitting?: boolean
  onCancel?: () => void
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function EntryForm({
  mode,
  initialValues,
  categories,
  onSubmit,
  submitting,
  onCancel,
}: Props) {
  const [amount, setAmount] = useState(initialValues?.amount ?? '')
  const [type, setType] = useState<'income' | 'expense'>(initialValues?.type ?? 'expense')
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? '')
  const [date, setDate] = useState(initialValues?.date ?? todayISO())
  const [note, setNote] = useState(initialValues?.note ?? '')
  const [localError, setLocalError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  useUnsavedChanges(dirty && !submitting)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLocalError(null)

    const amountNum = Number(amount)
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setLocalError('Amount must be a positive number')
      return
    }

    const trimmedNote = note.trim()
    // Clear dirty before awaiting submit so the post-submit navigation by the
    // parent isn't blocked by the unsaved-changes prompt.
    setDirty(false)
    try {
      await onSubmit({
        amount: amountNum,
        type,
        categoryId: categoryId === '' ? undefined : categoryId,
        date,
        note: trimmedNote === '' ? undefined : trimmedNote,
      })
    } catch (err) {
      setDirty(true)
      throw err
    }
  }

  function markDirty() {
    if (!dirty) setDirty(true)
  }

  const inputClass =
    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <span className="text-sm font-medium">Type</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setType('expense')
              markDirty()
            }}
            className={cn(
              'rounded-md border px-3 py-2 text-sm font-medium transition',
              type === 'expense'
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                : 'border-input bg-background text-muted-foreground hover:bg-muted',
            )}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income')
              markDirty()
            }}
            className={cn(
              'rounded-md border px-3 py-2 text-sm font-medium transition',
              type === 'income'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'border-input bg-background text-muted-foreground hover:bg-muted',
            )}
          >
            Income
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="amount" className="text-sm font-medium">Amount</label>
        <input
          id="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          required
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value)
            markDirty()
          }}
          className={inputClass}
          placeholder="0.00"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="category" className="text-sm font-medium">Category</label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value)
            markDirty()
          }}
          className={inputClass}
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="date" className="text-sm font-medium">Date</label>
        <input
          id="date"
          type="date"
          required
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            markDirty()
          }}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="note" className="text-sm font-medium">
          Note <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="note"
          rows={2}
          value={note}
          onChange={(e) => {
            setNote(e.target.value)
            markDirty()
          }}
          className={inputClass}
          placeholder="Add a short description"
        />
      </div>

      {localError && (
        <p role="alert" className="text-sm text-destructive">
          {localError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting
            ? mode === 'create'
              ? 'Adding…'
              : 'Saving…'
            : mode === 'create'
              ? 'Add entry'
              : 'Save changes'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
