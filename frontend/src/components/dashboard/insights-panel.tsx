import { toast } from 'sonner'
import {
  AlertTriangle, CheckCircle, RefreshCw, Sparkles,
  type LucideProps,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { useInsights } from '@/hooks/use-insights'
import { formatMonthLong } from '@/lib/format'

type Props = {
  month: string
  disabled?: boolean
}

type Insight = { title: string; body: string; tone?: 'warning' | 'success' | 'info' }

export function InsightsPanel({ month, disabled }: Props) {
  const { data, refetch, isFetching } = useInsights(month)

  async function generate() {
    const result = await refetch()
    if (result.error) {
      toast.error('Unable to generate insights right now.')
    }
  }

  const insights: Insight[] = data?.insights ?? []
  const monthLabel = formatMonthLong(month)
  const hasInsights = insights.length > 0

  if (isFetching) {
    return <LoadingState />
  }

  if (!hasInsights) {
    return <IdleState month={monthLabel} disabled={disabled} onGenerate={generate} />
  }

  return <ShownState month={monthLabel} insights={insights} onRegenerate={generate} />
}

function LoadingState() {
  return (
    <div className="card" style={{ padding: 28 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <Sparkles size={18} color="var(--primary)" />
        <div style={{ fontWeight: 600 }}>Reading your month…</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-card)' }}>
            <div className="shimmer" style={{ height: 14, borderRadius: 4, marginBottom: 8, background: 'var(--bg-muted)' }} />
            <div className="shimmer" style={{ height: 10, borderRadius: 4, marginBottom: 6, background: 'var(--bg-muted)' }} />
            <div className="shimmer" style={{ height: 10, borderRadius: 4, marginBottom: 6, background: 'var(--bg-muted)', width: '80%' }} />
            <div className="shimmer" style={{ height: 10, borderRadius: 4, background: 'var(--bg-muted)', width: '60%' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function IdleState({ month, disabled, onGenerate }: { month: string; disabled?: boolean; onGenerate: () => void }) {
  return (
    <div
      className="card"
      style={{
        padding: 28,
        background:
          'linear-gradient(135deg, color-mix(in oklch, var(--primary) 18%, var(--bg-card)) 0%, var(--bg-card) 60%)',
        borderColor: 'color-mix(in oklch, var(--primary) 50%, var(--border))',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute', top: -40, right: -40, width: 220, height: 220, borderRadius: '50%',
          background: 'radial-gradient(circle, color-mix(in oklch, var(--primary) 40%, transparent), transparent 70%)',
          filter: 'blur(30px)', pointerEvents: 'none',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, position: 'relative' }}>
        <div
          style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'var(--primary)', color: 'var(--primary-fg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <Sparkles size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Get AI insights for {month}</h3>
          <p style={{ fontSize: 14, color: 'var(--fg-muted)', marginBottom: 16, maxWidth: 540 }}>
            Claude reads this month's totals and category breakdown, then writes 3 short, specific observations about
            your spending.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onGenerate}
            disabled={disabled}
            title={disabled ? 'Add at least one entry first' : undefined}
          >
            <Sparkles size={14} />
            Get AI insights
          </button>
        </div>
      </div>
    </div>
  )
}

function toneIcon(tone?: Insight['tone']): ComponentType<LucideProps> {
  if (tone === 'warning') return AlertTriangle
  if (tone === 'success') return CheckCircle
  return Sparkles
}

function ShownState({ month, insights, onRegenerate }: { month: string; insights: Insight[]; onRegenerate: () => void }) {
  return (
    <div
      className="card"
      style={{
        padding: 28,
        background:
          'linear-gradient(135deg, color-mix(in oklch, var(--primary) 12%, var(--bg-card)) 0%, var(--bg-card) 60%)',
        borderColor: 'color-mix(in oklch, var(--primary) 35%, var(--border))',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 16 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div
            style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--primary)', color: 'var(--primary-fg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>AI spending insights</h3>
            <p style={{ fontSize: 13, color: 'var(--fg-muted)' }}>For {month} · powered by Claude</p>
          </div>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={onRegenerate}>
          <RefreshCw size={13} /> Regenerate
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
        {insights.map((ins, i) => {
          const toneColor =
            ins.tone === 'warning' ? 'var(--expense-fg)' : ins.tone === 'success' ? 'var(--income-fg)' : 'var(--primary)'
          const toneBg =
            ins.tone === 'warning'
              ? 'var(--expense-bg)'
              : ins.tone === 'success'
              ? 'var(--income-bg)'
              : 'color-mix(in oklch, var(--primary) 14%, transparent)'
          return (
            <div
              key={i}
              className="fade-in"
              style={{
                padding: 18, borderRadius: 12,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                animationDelay: `${i * 80}ms`, animationFillMode: 'both',
              }}
            >
              {(() => {
                const ToneIcon = toneIcon(ins.tone)
                return (
                  <div
                    style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: toneBg, color: toneColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                    }}
                  >
                    <ToneIcon size={14} />
                  </div>
                )
              })()}
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>{ins.title}</div>
              <p style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.55 }}>{ins.body}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
