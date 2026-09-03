import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading, user, configured } = useAuth()
  const location = useLocation()

  if (!configured) {
    return <Navigate to="/" replace />
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted">
        Checking your session…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />
  }

  return children
}
