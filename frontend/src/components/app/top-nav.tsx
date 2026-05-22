import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  Bell, ChevronDown, Download, Home, List, LogOut, Moon, Settings, Sun, Tag, User,
  type LucideProps,
} from 'lucide-react'
import { BrandMark } from '@/components/ui/brand-mark'
import { useTheme } from '@/lib/theme'

type Props = {
  userName: string
  userEmail: string
  onSignOut: () => void
}

type NavItem = {
  id: string
  label: string
  Icon: ComponentType<LucideProps>
  to: '/dashboard' | '/entries' | '/categories'
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',  label: 'Dashboard',  Icon: Home, to: '/dashboard' },
  { id: 'entries',    label: 'Entries',    Icon: List, to: '/entries' },
  { id: 'categories', label: 'Categories', Icon: Tag,  to: '/categories' },
]

export function TopNav({ userName, userEmail, onSignOut }: Props) {
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const initial = (userName || userEmail || 'U').charAt(0).toUpperCase()

  return (
    <header className="topnav">
      <div className="app-container topnav-inner">
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandMark size={32} />
          <span className="brand-wordmark hide-sm">Saku</span>
        </Link>
        <nav style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              className={`topnav-link ${pathname.startsWith(item.to) ? 'active' : ''}`}
            >
              <item.Icon size={15} />
              <span className="hide-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={toggleTheme}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Notifications" title="Notifications">
            <Bell size={16} />
          </button>
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 10px 4px 4px', height: 36,
                border: '1px solid var(--border)', borderRadius: 999,
                background: 'transparent', color: 'var(--fg)',
                cursor: 'pointer', fontSize: 13, fontWeight: 500,
                fontFamily: 'inherit',
              }}
            >
              <span
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--primary)', color: 'var(--primary-fg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                }}
              >
                {initial}
              </span>
              <span className="hide-sm">{userName || 'Account'}</span>
              <ChevronDown size={13} color="var(--fg-muted)" />
            </button>
            {menuOpen && (
              <div
                className="fade-in"
                role="menu"
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                  width: 220, background: 'var(--bg-popover)',
                  border: '1px solid var(--border)', borderRadius: 12,
                  boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
                  padding: 6, zIndex: 60,
                }}
              >
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{userName}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>{userEmail}</div>
                </div>
                <MenuItem Icon={User}     label="Profile" />
                <MenuItem Icon={Settings} label="Settings" />
                <MenuItem Icon={Download} label="Export data" />
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                <MenuItem Icon={LogOut}   label="Sign out" onClick={onSignOut} danger />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function MenuItem({
  Icon,
  label,
  onClick,
  danger,
}: {
  Icon: ComponentType<LucideProps>
  label: ReactNode
  onClick?: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="menuitem"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '8px 12px', borderRadius: 8,
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: danger ? 'var(--destructive)' : 'var(--fg)',
        fontSize: 13, fontWeight: 500, textAlign: 'left',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger
          ? 'color-mix(in oklch, var(--destructive) 10%, transparent)'
          : 'var(--bg-muted)'
      }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      <Icon size={14} color={danger ? 'var(--destructive)' : undefined} />
      {label}
    </button>
  )
}
