import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, Field, Input } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { validatePassword } from '../lib/validation'
import { AuthLayout } from './SignIn'

export function SignUp() {
  const { configured } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setInfo('')
    if (!configured) {
      setError('Supabase is not configured yet.')
      return
    }
    const passwordError = validatePassword(password)
    if (!email.trim()) {
      setError('Enter your email.')
      return
    }
    if (passwordError) {
      setError(passwordError)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    const { error: signError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: displayName.trim() || undefined },
        emailRedirectTo: `${window.location.origin}/signin`,
      },
    })
    setBusy(false)
    if (signError) {
      setError('Could not create the account. Try a different email or stronger password.')
      return
    }
    setInfo('Account created. Check your email if confirmation is required, then sign in.')
  }

  return (
    <AuthLayout title="Create account" subtitle="Your files stay private to this login.">
      <form className="space-y-4" onSubmit={onSubmit}>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {info ? <Alert tone="ok">{info}</Alert> : null}
        <Field label="Name (optional)">
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" />
        </Field>
        <Field label="Email">
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password" hint="At least 8 characters, with a letter and a number.">
          <Input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Field label="Confirm password">
          <Input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </Field>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Creating…' : 'Sign up'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        Already registered?{' '}
        <Link to="/signin" className="font-semibold text-brand">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
