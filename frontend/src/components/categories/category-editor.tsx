import { useEffect, useState, type FormEvent } from 'react'
import { Check, Loader2, Plus, TrendingDown, TrendingUp, X } from 'lucide-react'
import {
  CATEGORY_ICON_NAMES,
  CATEGORY_ICONS,
  getCategoryIcon,
  type CategoryIconName,
} from '@/lib/category-icons'

const SWATCHES = [
  '#f97316', '#ef4444', '#ec4899', '#a855f7', '#8b5cf6',
  '#6366f1', '#0ea5e9', '#06b6d4', '#10b981', '#22c55e',
  '#eab308', '#f59e0b', '#6b7280', '#475569', '#0f172a',
] as const

const CAT_ICONS: CategoryIconName[] = CATEGORY_ICON_NAMES

export type CategoryDraft = {
  id?: string
  name: string
  color: string
  icon: string
  type: 'income' | 'expense'
}

type Props = {
  draft: CategoryDraft
  isNew: boolean
  submitting: boolean
  onChange: (draft: CategoryDraft) => void
  onCancel: () => void
  onSave: () => void
}

export function CategoryEditor({ draft, isNew, submitting, onChange, onCancel, onSave }: Props) {
  const [touched, setTouched] = useState(false)

  // ESC to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel, submitting])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!draft.name.trim()) return
    onSave()
  }

  const showError = touched && !draft.name.trim()

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isNew ? 'New category' : 'Edit category'}
      onClick={() => !submitting && onCancel()}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(10, 12, 20, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: 16,
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="fade-in"
        style={{
          background: 'var(--bg-card)', borderRadius: 16,
          border: '1px solid var(--border)',
          width: '100%', maxWidth: 460,
          boxShadow: '0 24px 60px rgba(0,0,0,0.30)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '20px 24px', borderBottom: '1px solid var(--border)',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>
            {isNew ? 'New category' : 'Edit category'}
          </h2>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onCancel} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: 14, background: 'var(--bg-muted)', borderRadius: 'var(--radius)',
            }}
          >
            <span
              style={{
                width: 44, height: 44, borderRadius: 12,
                background: draft.color + '22', color: draft.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {(() => {
                const Draft = getCategoryIcon(draft.icon)
                return <Draft size={20} color={draft.color} />
              })()}
            </span>
            <div>
              <div style={{ fontWeight: 600 }}>
                {draft.name || <span style={{ color: 'var(--fg-muted)' }}>Category name</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                {draft.type === 'income' ? 'Income' : 'Expense'} category
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="cat-name" className="label">Name</label>
            <input
              id="cat-name"
              className="input"
              value={draft.name}
              onChange={(e) => onChange({ ...draft, name: e.target.value })}
              placeholder="e.g. Coffee"
              maxLength={100}
              required
              autoFocus
            />
            {showError && (
              <p role="alert" className="help" style={{ color: 'var(--destructive)' }}>Name is required.</p>
            )}
          </div>

          <div>
            <span className="label">Type</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(['income', 'expense'] as const).map((t) => {
                const active = draft.type === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onChange({ ...draft, type: t })}
                    style={{
                      padding: '10px 14px', borderRadius: 'var(--radius)',
                      border: `1.5px solid ${
                        active ? (t === 'income' ? 'var(--income)' : 'var(--expense)') : 'var(--border)'
                      }`,
                      background: active ? (t === 'income' ? 'var(--income-bg)' : 'var(--expense-bg)') : 'transparent',
                      color: active ? (t === 'income' ? 'var(--income-fg)' : 'var(--expense-fg)') : 'var(--fg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {t === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {t === 'income' ? 'Income' : 'Expense'}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <span className="label">Icon</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CAT_ICONS.map((ic) => {
                const active = draft.icon === ic
                const IconCmp = CATEGORY_ICONS[ic]
                return (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => onChange({ ...draft, icon: ic })}
                    aria-label={`Icon ${ic}`}
                    aria-pressed={active}
                    style={{
                      width: 38, height: 38, borderRadius: 'var(--radius)',
                      background: active ? draft.color + '22' : 'var(--bg-muted)',
                      color: active ? draft.color : 'var(--fg-muted)',
                      border: active ? `1.5px solid ${draft.color}` : '1.5px solid transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <IconCmp size={16} color={active ? draft.color : 'var(--fg-muted)'} />
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <span className="label">Color</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SWATCHES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChange({ ...draft, color: s })}
                  aria-label={`Color ${s}`}
                  aria-pressed={draft.color === s}
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: s,
                    border: draft.color === s ? '2.5px solid var(--fg)' : '2.5px solid transparent',
                    cursor: 'pointer',
                    boxShadow: draft.color === s ? '0 0 0 2px var(--bg-card)' : 'none',
                    outline: 'none',
                  }}
                />
              ))}
              <label
                style={{
                  width: 30, height: 30, borderRadius: 8,
                  border: '1.5px dashed var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: draft.color, cursor: 'pointer', position: 'relative',
                }}
                title="Custom color"
              >
                <Plus size={14} color="white" />
                <input
                  type="color"
                  value={draft.color}
                  onChange={(e) => onChange({ ...draft, color: e.target.value })}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                />
              </label>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex', justifyContent: 'flex-end', gap: 8,
            padding: 20, borderTop: '1px solid var(--border)',
          }}
        >
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting || !draft.name.trim()}>
            {submitting ? (
              <>
                <Loader2 size={14} className="spin" /> {isNew ? 'Creating…' : 'Saving…'}
              </>
            ) : (
              <>
                <Check size={14} /> {isNew ? 'Create category' : 'Save changes'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
