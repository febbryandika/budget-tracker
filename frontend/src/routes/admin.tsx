import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { Key, Loader2, Pencil, Plus, Trash, UserPlus, X } from 'lucide-react'
import { client } from '@/lib/client'
import { useSession } from '@/lib/auth-client'
import { requireAdmin } from '@/lib/require-auth'

export const Route = createFileRoute('/admin')({
  beforeLoad: requireAdmin,
  component: AdminPage,
})

type AdminUser = {
  id: string
  name: string
  email: string
  role: string | null
  createdAt: string
}

async function fetchUsers(): Promise<AdminUser[]> {
  const res = await client.api.admin.users.$get()
  if (!res.ok) throw new Error('Failed to load users')
  const data = (await res.json()) as { users: AdminUser[] }
  return data.users ?? []
}

function AdminPage() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const currentUserId = session?.user.id

  const usersQuery = useQuery({ queryKey: ['admin', 'users'], queryFn: fetchUsers })

  const [createOpen, setCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [passwordUser, setPasswordUser] = useState<AdminUser | null>(null)

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.admin.users[':id'].$delete({ param: { id } })
      if (!res.ok) throw new Error('Failed to delete user')
    },
    onSuccess: () => {
      toast.success('User deleted')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: () => toast.error('Failed to delete user'),
  })

  function handleDelete(u: AdminUser) {
    if (u.id === currentUserId) return
    if (!window.confirm(`Delete ${u.email}? This cannot be undone.`)) return
    deleteMutation.mutate(u.id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 className="t-display" style={{ fontSize: 28, marginBottom: 4 }}>Admin</h1>
          <p style={{ color: 'var(--fg-muted)', fontSize: 14 }}>Manage who can access the budget tracker.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <UserPlus size={15} /> New user
        </button>
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        {usersQuery.isLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--fg-muted)' }}>
            <Loader2 size={18} className="spin" />
          </div>
        ) : usersQuery.error ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--destructive)' }}>
            Could not load users.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--bg-muted)', textAlign: 'left', color: 'var(--fg-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={th}>Name</th>
                <th style={th}>Email</th>
                <th style={th}>Role</th>
                <th style={th}>Created</th>
                <th style={{ ...th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(usersQuery.data ?? []).map((u) => {
                const isSelf = u.id === currentUserId
                return (
                  <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={td}>{u.name}{isSelf && <span style={{ marginLeft: 6, color: 'var(--fg-muted)', fontSize: 12 }}>(you)</span>}</td>
                    <td style={{ ...td, color: 'var(--fg-muted)' }}>{u.email}</td>
                    <td style={td}>
                      <span
                        className="badge"
                        style={{
                          background: u.role === 'admin' ? 'color-mix(in oklch, var(--primary) 14%, transparent)' : 'var(--bg-muted)',
                          color: u.role === 'admin' ? 'var(--primary)' : 'var(--fg-muted)',
                        }}
                      >
                        {u.role ?? 'user'}
                      </span>
                    </td>
                    <td style={{ ...td, color: 'var(--fg-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 4 }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          aria-label={`Edit ${u.email}`}
                          title="Edit"
                          onClick={() => setEditingUser(u)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          aria-label={`Reset password for ${u.email}`}
                          title="Reset password"
                          onClick={() => setPasswordUser(u)}
                        >
                          <Key size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          aria-label={`Delete ${u.email}`}
                          title={isSelf ? 'You cannot delete your own account' : 'Delete'}
                          onClick={() => handleDelete(u)}
                          disabled={isSelf || deleteMutation.isPending}
                          style={{ color: isSelf ? undefined : 'var(--destructive)' }}
                        >
                          <Trash size={14} color={isSelf ? undefined : 'var(--destructive)'} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {(usersQuery.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...td, textAlign: 'center', color: 'var(--fg-muted)', padding: 32 }}>
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {createOpen && <CreateUserModal onClose={() => setCreateOpen(false)} />}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />}
      {passwordUser && <ResetPasswordModal user={passwordUser} onClose={() => setPasswordUser(null)} />}
    </div>
  )
}

const th: React.CSSProperties = { padding: '12px 16px', fontWeight: 600 }
const td: React.CSSProperties = { padding: '14px 16px', verticalAlign: 'middle' }

function ModalShell({
  title,
  description,
  onClose,
  children,
  footer,
}: {
  title: string
  description?: string
  onClose: () => void
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(10, 12, 20, 0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 16,
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)',
          width: '100%', maxWidth: 480, boxShadow: '0 24px 60px rgba(0,0,0,0.30)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h2>
            {description && <p style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>{description}</p>}
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {children}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 20, borderTop: '1px solid var(--border)' }}>
          {footer}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        padding: 10, fontSize: 13, color: 'var(--destructive)',
        background: 'color-mix(in oklch, var(--destructive) 12%, transparent)',
        borderRadius: 8,
      }}
    >
      {message}
    </div>
  )
}

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await client.api.admin.users.$post({
        json: { name: name.trim(), email: email.trim(), password },
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
        throw new Error(body.error?.message ?? 'Failed to create user')
      }
    },
    onSuccess: () => {
      toast.success('User created')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      onClose()
    },
    onError: (err) => setError(err.message),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    mutation.mutate()
  }

  return (
    <ModalShell
      title="New user"
      description="Create an account that can sign in to the budget tracker."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </button>
          <button type="submit" form="create-user-form" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? <><Loader2 size={14} className="spin" /> Creating…</> : <><Plus size={14} /> Create user</>}
          </button>
        </>
      }
    >
      <form id="create-user-form" onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label htmlFor="new-name" className="label">Name</label>
          <input id="new-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
        </div>
        <div>
          <label htmlFor="new-email" className="label">Email</label>
          <input id="new-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        <div>
          <label htmlFor="new-password" className="label">Password</label>
          <input id="new-password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
          <div className="help">At least 8 characters.</div>
        </div>
        {error && <ErrorMessage message={error} />}
      </form>
    </ModalShell>
  )
}

function EditUserModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      const patch: { name?: string; email?: string } = {}
      const trimmedName = name.trim()
      const trimmedEmail = email.trim()
      if (trimmedName !== user.name) patch.name = trimmedName
      if (trimmedEmail !== user.email) patch.email = trimmedEmail
      if (Object.keys(patch).length === 0) return
      const res = await client.api.admin.users[':id'].$patch({
        param: { id: user.id },
        json: patch,
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
        throw new Error(body.error?.message ?? 'Failed to update user')
      }
    },
    onSuccess: () => {
      toast.success('User updated')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      onClose()
    },
    onError: (err) => setError(err.message),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    mutation.mutate()
  }

  return (
    <ModalShell
      title="Edit user"
      description={user.email}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </button>
          <button type="submit" form="edit-user-form" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? <><Loader2 size={14} className="spin" /> Saving…</> : 'Save changes'}
          </button>
        </>
      }
    >
      <form id="edit-user-form" onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label htmlFor="edit-name" className="label">Name</label>
          <input id="edit-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
        </div>
        <div>
          <label htmlFor="edit-email" className="label">Email</label>
          <input id="edit-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        {error && <ErrorMessage message={error} />}
      </form>
    </ModalShell>
  )
}

function ResetPasswordModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await client.api.admin.users[':id'].password.$post({
        param: { id: user.id },
        json: { newPassword: password },
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
        throw new Error(body.error?.message ?? 'Failed to reset password')
      }
    },
    onSuccess: () => {
      toast.success('Password updated')
      onClose()
    },
    onError: (err) => setError(err.message),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    mutation.mutate()
  }

  return (
    <ModalShell
      title="Reset password"
      description={user.email}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </button>
          <button type="submit" form="reset-pw-form" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? <><Loader2 size={14} className="spin" /> Updating…</> : <><Key size={14} /> Set new password</>}
          </button>
        </>
      }
    >
      <form id="reset-pw-form" onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label htmlFor="reset-pw" className="label">New password</label>
          <input id="reset-pw" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} autoFocus required />
          <div className="help">At least 8 characters. The user&apos;s existing sessions will remain valid.</div>
        </div>
        {error && <ErrorMessage message={error} />}
      </form>
    </ModalShell>
  )
}
