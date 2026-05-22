import type { ComponentType, ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Brain, PieChart, Sparkles, TrendingUp, type LucideProps } from 'lucide-react'
import { BrandMark } from '@/components/ui/brand-mark'

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)',
        background: 'var(--bg)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', padding: '32px 48px', overflowY: 'auto' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandMark size={32} />
          <span className="brand-wordmark">Saku</span>
        </Link>
        <div
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
            maxWidth: 400, width: '100%', margin: '0 auto', padding: '40px 0',
          }}
        >
          {children}
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
          © 2026 Saku Finance · Made in Jakarta
        </div>
      </div>
      <AuthShowcase />
    </div>
  )
}

function AuthShowcase() {
  const points: Array<{ Icon: ComponentType<LucideProps>; t: string; s: string }> = [
    { Icon: TrendingUp, t: 'Track every transaction',  s: 'Income & expenses in one log, with categories.' },
    { Icon: PieChart,   t: 'Read trends at a glance',  s: 'Six-month bar charts and category breakdowns.' },
    { Icon: Brain,      t: 'AI that knows your month', s: 'Three concrete insights, written for your data.' },
  ]
  return (
    <div
      className="hide-sm"
      style={{
        position: 'relative',
        background: `linear-gradient(135deg,
          color-mix(in oklch, var(--primary) 100%, white 8%),
          var(--primary) 60%,
          color-mix(in oklch, var(--primary) 100%, black 20%) 100%)`,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        padding: 48,
        color: 'var(--primary-fg)',
      }}
    >
      <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.18 }}>
        <defs>
          <pattern id="auth-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-grid)" />
      </svg>
      <div
        style={{
          position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.25), transparent 70%)',
          filter: 'blur(20px)',
        }}
      />
      <div
        style={{
          position: 'relative', flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', maxWidth: 480,
        }}
      >
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '4px 12px', borderRadius: 999,
            background: 'rgba(255,255,255,0.18)',
            fontSize: 12, fontWeight: 600,
            alignSelf: 'flex-start', marginBottom: 24,
          }}
        >
          <Sparkles size={12} /> Powered by Claude
        </span>
        <h2
          className="t-display"
          style={{ fontSize: 'clamp(2rem, 3.6vw, 2.8rem)', color: 'inherit', lineHeight: 1.05, marginBottom: 20 }}
        >
          The clearest view of where your money goes.
        </h2>
        <div style={{ display: 'grid', gap: 12, marginTop: 24 }}>
          {points.map((p) => (
            <div
              key={p.t}
              style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                padding: 14, borderRadius: 12,
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.18)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(255,255,255,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                <p.Icon size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.t}</div>
                <div style={{ fontSize: 12.5, opacity: 0.8 }}>{p.s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: 'relative', fontSize: 13, opacity: 0.7 }}>
        Trusted by 4,128 trackers across Indonesia.
      </div>
    </div>
  )
}
