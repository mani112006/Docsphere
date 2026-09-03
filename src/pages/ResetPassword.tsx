import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Field, Input } from '../components/ui'
import { supabase } from '../lib/supabase'
import { validatePassword } from '../lib/validation'
import { AuthLayout } from './SignIn'

export function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData.session) setReady(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (updateError) {
      setError('Could not update the password. Request a new reset link.')
      return
    }
    setInfo('Password updated. Redirecting…')
    window.setTimeout(() => navigate('/app', { replace: true }), 800)
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="This replaces your previous password for this account.">
      {!ready ? (
        <Alert tone="info">Open this page from the reset link in your email to continue.</Alert>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          {error ? <Alert tone="danger">{error}</Alert> : null}
          {info ? <Alert tone="ok">{info}</Alert> : null}
          <Field label="New password">
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
            {busy ? 'Saving…' : 'Update password'}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
