type Props = {
  label: string
  active: boolean
  onClick: () => void
  color?: string
}

export function FilterPill({ label, active, onClick, color }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focusable"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', borderRadius: 999,
        background: active ? (color ? color + '22' : 'var(--primary-pastel)') : 'transparent',
        color: active ? (color || 'var(--primary-pastel-fg)') : 'var(--fg-muted)',
        border: `1px solid ${
          active ? (color ? color + '55' : 'transparent') : 'var(--border)'
        }`,
        fontSize: 12.5, fontWeight: active ? 600 : 500, cursor: 'pointer',
        transition: 'background 0.15s',
        fontFamily: 'inherit',
      }}
    >
      {color && (
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      )}
      {label}
    </button>
  )
}
