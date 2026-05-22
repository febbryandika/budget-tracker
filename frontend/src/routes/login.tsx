import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { AuthShell } from '@/components/auth/auth-shell'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { redirectIfAuthed } from '@/lib/require-auth'

export const Route = createFileRoute('/login')({
  beforeLoad: redirectIfAuthed,
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: signInError } = await authClient.signIn.email({ email, password })
    setLoading(false)
    if (signInError) {
      setError(signInError.message ?? 'Unable to sign in')
      return
    }
    router.navigate({ to: '/dashboard' })
  }

  return (
    <AuthShell>
      <Link to="/" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginBottom: 24, color: 'var(--fg-muted)' }}>
        <ArrowLeft size={14} /> Back to home
      </Link>

      <h1 className="t-display" style={{ fontSize: 32, marginBottom: 8 }}>Sign in</h1>
      <p style={{ color: 'var(--fg-muted)', fontSize: 14, marginBottom: 28 }}>
        Welcome back to your Saku account.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)' }}>
              <Mail size={16} />
            </div>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ paddingLeft: 38 }}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <label htmlFor="password" className="label">Password</label>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 500 }}
            >
              Forgot?
            </a>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)' }}>
              <Lock size={16} />
            </div>
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingLeft: 38, paddingRight: 38 }}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--fg-muted)', padding: 6, borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
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

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: 6 }}>
          {loading ? (
            <>
              <Loader2 size={16} className="spin" /> Signing in…
            </>
          ) : (
            <>
              Sign in <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <p style={{ marginTop: 24, fontSize: 14, color: 'var(--fg-muted)', textAlign: 'center' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
          Create one
        </Link>
      </p>
    </AuthShell>
  )
}
