import { FilePlus2, Files, Home, Settings } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePinLock } from '../context/PinLockContext'
import { PinLockScreen } from './PinLockScreen'
import { ThemeIconButton } from './ThemeToggle'
import { cn } from './ui'

const nav = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/documents', label: 'Documents', icon: Files },
  { to: '/app/upload', label: 'Upload', icon: FilePlus2 },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

export function AppShell() {
  const { user } = useAuth()
  const { locked, ready } = usePinLock()

  return (
    <div className="min-h-svh bg-paper text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="" className="h-8 w-8 rounded-lg" />
            <div>
              <p className="text-sm font-bold tracking-tight text-brand">DocSphere</p>
              <p className="text-[11px] text-muted">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeIconButton />
            <nav className="hidden gap-1 md:flex">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'rounded-xl px-3 py-2 text-sm font-medium',
                      isActive ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-paper',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-24 md:pb-8">
        {ready ? <Outlet /> : <p className="text-sm text-muted">Loading…</p>}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-4">
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 py-2 text-[11px] font-medium',
                    isActive ? 'text-brand' : 'text-muted',
                  )
                }
              >
                <Icon size={20} />
                {item.label}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {locked ? <PinLockScreen /> : null}
    </div>
  )
}
