import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useMemo, useState, type FormEvent } from 'react'
import { AuthShell } from '@/components/auth/auth-shell'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { redirectIfAuthed } from '@/lib/require-auth'

export const Route = createFileRoute('/register')({
  beforeLoad: redirectIfAuthed,
  component: RegisterPage,
})

function passwordScore(pw: string): number {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 6) s += 1
  if (pw.length >= 10) s += 1
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s += 1
  if (/\d/.test(pw)) s += 1
  if (/[^a-zA-Z0-9]/.test(pw)) s += 1
  return Math.min(s, 4)
}

function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [agree, setAgree] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const pwScore = useMemo(() => passwordScore(password), [password])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !email || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (!agree) {
      setError('Agree to the Terms to continue.')
      return
    }
    setLoading(true)
    const { error: signUpError } = await authClient.signUp.email({ email, password, name: name.trim() })
    setLoading(false)
    if (signUpError) {
      setError(signUpError.message ?? 'Unable to create account')
      return
    }
    router.navigate({ to: '/dashboard' })
  }

  return (
    <AuthShell>
      <Link to="/" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginBottom: 24, color: 'var(--fg-muted)' }}>
        <ArrowLeft size={14} /> Back to home
      </Link>

      <h1 className="t-display" style={{ fontSize: 32, marginBottom: 8 }}>Create your account</h1>
      <p style={{ color: 'var(--fg-muted)', fontSize: 14, marginBottom: 28 }}>
        Free forever. No card. Default categories are seeded for you.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label htmlFor="name" className="label">Name</label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)' }}>
              <User size={16} />
            </div>
            <input
              id="name"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ paddingLeft: 38 }}
              placeholder="Rina Pratiwi"
              autoComplete="name"
              required
            />
          </div>
        </div>
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
          <label htmlFor="password" className="label">Password</label>
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
              autoComplete="new-password"
              placeholder="At least 8 characters"
              required
              minLength={8}
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
          {password && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1, height: 4, borderRadius: 2,
                      background:
                        i < pwScore
                          ? pwScore < 2
                            ? 'var(--destructive)'
                            : pwScore < 3
                            ? '#f59e0b'
                            : 'var(--income-fg)'
                          : 'var(--border)',
                      transition: 'background 0.2s',
                    }}
                  />
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 6 }}>
                {pwScore < 2 ? 'Weak — add length or numbers' : pwScore < 3 ? 'Decent — could be stronger' : pwScore < 4 ? 'Strong' : 'Excellent'}
              </div>
            </div>
          )}
        </div>

        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer', fontSize: 13, color: 'var(--fg-muted)' }}>
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            style={{ marginTop: 3 }}
          />
          <span>
            I agree to Saku's{' '}
            <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--primary)' }}>Terms</a> and{' '}
            <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--primary)' }}>Privacy Policy</a>.
          </span>
        </label>

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

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={16} className="spin" /> Creating account…
            </>
          ) : (
            <>
              Create account <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <p style={{ marginTop: 24, fontSize: 14, color: 'var(--fg-muted)', textAlign: 'center' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
