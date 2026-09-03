import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CreatorCredit } from '../components/CreatorCredit'
import { Alert, Button, Card, Field, Input } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
export function SignIn() {
  const { user, configured, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/app'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && user) return <Navigate to="/app" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!configured) {
      setError('Supabase is not configured yet.')
      return
    }
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    setBusy(true)
    const { error: signError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setBusy(false)
    if (signError) {
      setError('Could not sign in. Check your email and password.')
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <AuthLayout title="Sign in" subtitle="Access your private document wallet.">
      <form className="space-y-4" onSubmit={onSubmit}>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Field label="Email">
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-brand">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        New here?{' '}
        <Link to="/signup" className="font-semibold text-brand">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <img src="/icon.svg" alt="" className="mx-auto h-12 w-12 rounded-xl" />
          <h1 className="mt-3 text-2xl font-bold text-brand">DocSphere</h1>
          <p className="mt-1 text-lg font-semibold text-ink">{title}</p>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
        <Card>{children}</Card>
        <p className="mt-4 text-center text-sm">
          <Link to="/" className="text-muted hover:text-brand">
            Back to home
          </Link>
        </p>
        <CreatorCredit className="mt-6" />
      </div>
    </div>
  )
}
