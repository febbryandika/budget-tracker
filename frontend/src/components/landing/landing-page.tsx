import { useState, type ComponentType } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight, Check, CheckCircle, ChevronDown, Download, Mail, PieChart,
  Plus, ShieldCheck, Sparkles, Tag, TrendingUp,
  type LucideProps,
} from 'lucide-react'
import { BrandMark } from '@/components/ui/brand-mark'

export function LandingPage() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--fg)', minHeight: '100vh' }}>
      <LandingNav />
      <Hero />
      <Features />
      <HowItWorks />
      <PricingSection />
      <FAQSection />
      <FinalCTA />
      <LandingFooter />
    </div>
  )
}

function LandingNav() {
  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'color-mix(in oklch, var(--bg) 80%, transparent)',
        backdropFilter: 'blur(12px) saturate(160%)',
        WebkitBackdropFilter: 'blur(12px) saturate(160%)',
        borderBottom: '1px solid color-mix(in oklch, var(--border) 60%, transparent)',
      }}
    >
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', height: 64, gap: 16 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandMark size={30} />
          <span className="brand-wordmark">Saku</span>
        </Link>
        <nav style={{ marginLeft: 24, display: 'flex', gap: 4 }} className="hide-sm">
          {['Features', 'How it works', 'Pricing', 'FAQ'].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
              style={{ padding: '8px 14px', fontSize: 14, color: 'var(--fg-muted)', borderRadius: 'var(--radius)' }}
            >
              {label}
            </a>
          ))}
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link to="/register" className="btn btn-primary btn-sm">
            Get started
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section style={{ position: 'relative', padding: '80px 0 60px', overflow: 'hidden' }}>
      <BgBlobs />
      <div
        className="app-container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)',
          gap: 60,
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <div>
          <span className="badge badge-primary" style={{ marginBottom: 18 }}>
            <Sparkles size={11} /> Now with AI spending insights
          </span>
          <h1 className="t-display" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.6rem)', marginBottom: 18 }}>
            Know where your <span style={{ color: 'var(--primary)' }}>rupiah</span> went.
            <br />Every single one.
          </h1>
          <p style={{ fontSize: 17, color: 'var(--fg-muted)', maxWidth: 480, marginBottom: 28, lineHeight: 1.55 }}>
            Saku is a calm, opinionated budget tracker. Log income and expenses in seconds, see monthly trends in
            real charts, and let Claude tell you what's actually eating your budget.
          </p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Start free — no card
              <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              I already have an account
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--fg-muted)', flexWrap: 'wrap' }}>
            {['No card required', 'Free forever', 'Export anytime'].map((t) => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} color="var(--income-fg)" /> {t}
              </span>
            ))}
          </div>
        </div>
        <AppPreview />
      </div>
    </section>
  )
}

function AppPreview() {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow:
          '0 24px 60px -20px color-mix(in oklch, var(--primary) 30%, transparent), 0 8px 24px rgba(0,0,0,0.10)',
        transform: 'perspective(1200px) rotateX(2deg) rotateY(-4deg)',
        transformOrigin: 'center',
      }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)',
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
        <div style={{ marginLeft: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BrandMark size={20} />
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)' }}>Saku</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>May 2026</span>
          <ChevronDown size={12} color="var(--fg-muted)" />
        </div>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4 }}>Net balance · May 2026</div>
        <div
          style={{
            fontSize: 30, fontWeight: 800,
            fontFamily: 'var(--font-display)', letterSpacing: '-0.03em',
            color: 'var(--income-fg)',
          }}
        >
          Rp 8.247.000
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
          <span className="badge badge-income">
            <TrendingUp size={11} /> +12% vs Apr
          </span>
        </div>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', gap: 8, height: 90, padding: '0 4px' }}>
          {[
            { i: 0.62, e: 0.34 },
            { i: 0.75, e: 0.42 },
            { i: 0.55, e: 0.40 },
            { i: 0.70, e: 0.55 },
            { i: 0.68, e: 0.46 },
            { i: 0.82, e: 0.38 },
          ].map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 3 }}>
              <div style={{ height: `${d.i * 100}%`, background: 'var(--income)', borderRadius: '4px 4px 2px 2px', opacity: i === 5 ? 1 : 0.55 }} />
              <div style={{ height: `${d.e * 100}%`, background: 'var(--expense)', borderRadius: '2px 2px 4px 4px', opacity: i === 5 ? 1 : 0.45 }} />
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 16, padding: 12,
            background: 'color-mix(in oklch, var(--primary) 12%, var(--bg-card))',
            border: '1px solid color-mix(in oklch, var(--primary) 30%, transparent)',
            borderRadius: 10,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              width: 22, height: 22, borderRadius: 6,
              background: 'var(--primary)', color: 'var(--primary-fg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <Sparkles size={12} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg)' }}>AI Insight</div>
            <div style={{ fontSize: 10.5, color: 'var(--fg-muted)', lineHeight: 1.4 }}>
              Food spending is up 18% — try 2 home meals/wk to save Rp 400k.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Features() {
  const items: Array<{ Icon: ComponentType<LucideProps>; title: string; body: string }> = [
    { Icon: Plus,        title: 'Fast entry',        body: "Log a transaction in under 5 seconds. Amount, category, done. No fields you don't need." },
    { Icon: PieChart,    title: 'Real charts',       body: 'Six months of income, expenses, and net balance in a single read. Filter by month or category.' },
    { Icon: Sparkles,    title: 'AI insights',       body: 'Claude reads your month and writes 3 specific observations — concrete, never generic.' },
    { Icon: Tag,         title: 'Custom categories', body: "Start with smart defaults. Add your own with any color. Saku won't delete categories with history." },
    { Icon: ShieldCheck, title: 'Yours alone',       body: 'Every query is scoped to your user. No team mode, no shared boards, no leaks.' },
    { Icon: Download,    title: 'Yours to leave',    body: 'CSV and JSON export on demand. You wrote the data; you own it.' },
  ]
  return (
    <section id="features" style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
      <div className="app-container">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="badge" style={{ marginBottom: 12 }}>FEATURES</span>
          <h2 className="t-display" style={{ fontSize: 'clamp(2rem, 4vw, 2.6rem)', marginBottom: 12 }}>
            Built for tracking, not for charts.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--fg-muted)', maxWidth: 560, margin: '0 auto' }}>
            Five focused tools that work together. No clutter, no nag screens.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
          {items.map((f) => (
            <div key={f.title} className="card" style={{ padding: 24 }}>
              <div
                style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'color-mix(in oklch, var(--primary) 12%, var(--bg-card))',
                  color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <f.Icon size={18} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{f.title}</div>
              <p style={{ fontSize: 13.5, color: 'var(--fg-muted)', lineHeight: 1.55 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { n: '01', t: 'Log it',   b: 'Add an entry the moment money moves. Amount, category, optional note.' },
    { n: '02', t: 'Watch it', b: 'Dashboard updates instantly. Six-month bar chart, net balance, by-category breakdown.' },
    { n: '03', t: 'Learn it', b: 'Hit "Get AI Insights" — Claude reads your numbers and reports back in three tight paragraphs.' },
  ]
  return (
    <section id="how-it-works" style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
      <div className="app-container">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span className="badge" style={{ marginBottom: 12 }}>HOW IT WORKS</span>
          <h2 className="t-display" style={{ fontSize: 'clamp(2rem, 4vw, 2.6rem)' }}>Three steps. That's the product.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 24 }}>
          {steps.map((s) => (
            <div key={s.n} style={{ padding: 24, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--primary)', marginBottom: 12 }}>{s.n}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{s.t}</div>
              <p style={{ fontSize: 13.5, color: 'var(--fg-muted)', lineHeight: 1.55 }}>{s.b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingSection() {
  const plans = [
    { name: 'Free', price: 'Rp 0',   period: '/forever', features: ['Unlimited entries', 'Up to 6 custom categories', '3 AI insights / month', '6-month trend chart'],                              cta: 'Get started',         highlight: false },
    { name: 'Plus', price: 'Rp 39k', period: '/month',   features: ['Everything in Free', 'Unlimited categories', 'Unlimited AI insights', 'CSV / JSON export', 'Priority support'], cta: 'Start 14-day trial', highlight: true },
  ]
  return (
    <section id="pricing" style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
      <div className="app-container">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span className="badge" style={{ marginBottom: 12 }}>PRICING</span>
          <h2 className="t-display" style={{ fontSize: 'clamp(2rem, 4vw, 2.6rem)' }}>Pricing</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, maxWidth: 720, margin: '0 auto' }}>
          {plans.map((p) => (
            <div
              key={p.name}
              style={{
                padding: 28, borderRadius: 14,
                background: p.highlight ? 'color-mix(in oklch, var(--primary) 10%, var(--bg-card))' : 'var(--bg-card)',
                border: `1px solid ${p.highlight ? 'var(--primary)' : 'var(--border)'}`,
                position: 'relative',
              }}
            >
              {p.highlight && (
                <span className="badge badge-primary" style={{ position: 'absolute', top: -10, right: 16 }}>Most popular</span>
              )}
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                <span className="t-display" style={{ fontSize: 36 }}>{p.price}</span>
                <span style={{ color: 'var(--fg-muted)', fontSize: 14 }}>{p.period}</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22, fontSize: 14, padding: 0 }}>
                {p.features.map((f) => (
                  <li key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <Check size={14} color="var(--income-fg)" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={p.highlight ? 'btn btn-primary' : 'btn btn-outline'}
                style={{ width: '100%' }}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQSection() {
  const [open, setOpen] = useState(0)
  const faqs = [
    { q: 'Is Saku really free?',           a: 'Yes. The Free plan stays free forever — unlimited entries, 6 categories, 3 AI insights per month. Plus is optional for power users.' },
    { q: 'How does the AI feature work?',  a: "When you tap \"Get AI Insights\" on the dashboard, Saku sends your current month's totals and category breakdown to Claude. It returns 3 short insights. No raw notes or personal data are sent." },
    { q: 'Can I export my data?',          a: 'Yes, anytime. CSV and JSON for all entries and categories. No paywall.' },
    { q: 'Where is my data stored?',       a: 'In a managed Postgres database (Neon), encrypted at rest. We never share with third parties.' },
    { q: 'Multi-currency support?',        a: 'Not yet — Saku is single-currency per account. You can pick your preferred symbol in settings.' },
  ]
  return (
    <section id="faq" style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
      <div className="app-container" style={{ maxWidth: 720 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span className="badge" style={{ marginBottom: 12 }}>FAQ</span>
          <h2 className="t-display" style={{ fontSize: 'clamp(2rem, 4vw, 2.4rem)' }}>Questions, answered</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {faqs.map((f, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-card)', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setOpen(open === i ? -1 : i)}
                style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 20px', background: 'transparent', border: 'none',
                  fontSize: 15, fontWeight: 600, color: 'var(--fg)', textAlign: 'left',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {f.q}
                <ChevronDown
                  size={16}
                  color="var(--fg-muted)"
                  style={{ transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                />
              </button>
              {open === i && (
                <div className="fade-in" style={{ padding: '0 20px 16px', fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section style={{ padding: '60px 0' }}>
      <div className="app-container">
        <div
          style={{
            padding: 48, borderRadius: 16,
            background: 'linear-gradient(135deg, color-mix(in oklch, var(--primary) 100%, white 8%), var(--primary))',
            color: 'var(--primary-fg)',
            textAlign: 'center',
          }}
        >
          <h2
            className="t-display"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', color: 'inherit', marginBottom: 12 }}
          >
            Stop wondering where it went.
          </h2>
          <p style={{ fontSize: 16, opacity: 0.85, maxWidth: 480, margin: '0 auto 24px' }}>
            Five seconds to make an account. Two minutes to feel in control.
          </p>
          <Link to="/register" className="btn btn-lg" style={{ background: 'var(--bg-card)', color: 'var(--fg)' }}>
            Create your free account
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}

function LandingFooter() {
  const linkStyle: React.CSSProperties = { fontSize: 13, color: 'var(--fg-muted)', display: 'block', padding: '4px 0' }
  return (
    <footer style={{ borderTop: '1px solid var(--border)', marginTop: 80, padding: '48px 0 32px' }}>
      <div className="app-container">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 32, marginBottom: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <BrandMark size={28} />
              <span className="brand-wordmark">Saku</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--fg-muted)', maxWidth: 320 }}>
              The pocket-sized budget tracker for people who'd rather live than spreadsheet.
            </p>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 10 }}>Product</div>
            <a href="#features" style={linkStyle}>Features</a>
            <a href="#pricing" style={linkStyle}>Pricing</a>
            <a href="#faq" style={linkStyle}>FAQ</a>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 10 }}>Company</div>
            <a href="#" style={linkStyle} onClick={(e) => e.preventDefault()}>About</a>
            <a href="#" style={linkStyle} onClick={(e) => e.preventDefault()}>Blog</a>
            <a href="#" style={linkStyle} onClick={(e) => e.preventDefault()}>Contact</a>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 10 }}>Legal</div>
            <a href="#" style={linkStyle} onClick={(e) => e.preventDefault()}>Privacy</a>
            <a href="#" style={linkStyle} onClick={(e) => e.preventDefault()}>Terms</a>
            <a href="#" style={linkStyle} onClick={(e) => e.preventDefault()}>Security</a>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 24, fontSize: 12, color: 'var(--fg-muted)' }}>
          <span>© 2026 Saku Finance. Made in Jakarta.</span>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="#" aria-label="Email" onClick={(e) => e.preventDefault()}><Mail size={16} color="var(--fg-muted)" /></a>
          </div>
        </div>
      </div>
    </footer>
  )
}

function BgBlobs() {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute', top: -120, left: '-10%', width: 480, height: 480, borderRadius: '50%',
          background: 'radial-gradient(circle, color-mix(in oklch, var(--primary) 35%, transparent), transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute', bottom: -200, right: '-10%', width: 520, height: 520, borderRadius: '50%',
          background: 'radial-gradient(circle, oklch(0.91 0.04 155 / 0.5), transparent 70%)',
          filter: 'blur(50px)',
        }}
      />
    </div>
  )
}
