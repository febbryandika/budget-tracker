type Props = {
  size?: number
  primaryColor?: string
}

export function BrandMark({ size = 32, primaryColor }: Props) {
  return (
    <span
      className="brand-mark"
      style={{
        width: size,
        height: size,
        background: primaryColor || undefined,
      }}
    >
      <svg
        width={size * 0.55}
        height={size * 0.55}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path d="M5 6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3H5V6z" fill="rgba(255,255,255,0.35)" />
        <path d="M3 10a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8z" fill="white" fillOpacity="0.95" />
        <circle cx="17" cy="14" r="1.6" fill={primaryColor || 'var(--primary)'} />
      </svg>
    </span>
  )
}
