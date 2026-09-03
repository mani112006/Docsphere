import { useState, type FormEvent } from 'react'
import { Alert, Button, Field, Input } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { AuthLayout } from './SignIn'

export function ForgotPassword() {
  const { configured } = useAuth()
  const [email, setEmail] = useState('')
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
    if (!email.trim()) {
      setError('Enter your email.')
      return
    }
    setBusy(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setBusy(false)
    if (resetError) {
      setError('Could not send a reset email right now.')
      return
    }
    setInfo('If that email is registered, a reset link is on its way.')
  }

  return (
    <AuthLayout title="Reset password" subtitle="We’ll email a link to choose a new password.">
      <form className="space-y-4" onSubmit={onSubmit}>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {info ? <Alert tone="ok">{info}</Alert> : null}
        <Field label="Email">
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </AuthLayout>
  )
}
