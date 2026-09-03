import { useEffect, useState, type FormEvent } from 'react'
import { CreatorCredit } from '../components/CreatorCredit'
import { ThemeToggle } from '../components/ThemeToggle'
import { Alert, Button, Card, Field, Input } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { usePinLock } from '../context/PinLockContext'
import { disablePin, enablePin, fetchProfile, updateDisplayName, verifyPin } from '../lib/pin'
import { supabase } from '../lib/supabase'
import { validatePassword, validatePin } from '../lib/validation'
import { AUTO_LOCK_MS, SESSION_IDLE_SIGNOUT_MS } from '../types'

export function Settings() {
  const { user, signOut } = useAuth()
  const { pinEnabled, refreshProfile, lockNow } = usePinLock()
  const [displayName, setDisplayName] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [currentPin, setCurrentPin] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchProfile()
      .then((profile) => setDisplayName(profile?.display_name ?? ''))
      .catch(() => undefined)
  }, [])

  async function saveName(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await updateDisplayName(displayName.trim())
      setInfo('Display name saved.')
    } catch {
      setError('Could not save your name.')
    } finally {
      setBusy(false)
    }
  }

  async function savePin(event: FormEvent) {
    event.preventDefault()
    setError('')
    const pinError = validatePin(pin)
    if (pinError) {
      setError(pinError)
      return
    }
    if (pin !== pinConfirm) {
      setError('PIN confirmation does not match.')
      return
    }
    setBusy(true)
    try {
      await enablePin(pin)
      setPin('')
      setPinConfirm('')
      await refreshProfile()
      setInfo('PIN lock enabled. The app will lock after 3 minutes of inactivity.')
    } catch {
      setError('Could not save the PIN.')
    } finally {
      setBusy(false)
    }
  }

  async function removePin(event: FormEvent) {
    event.preventDefault()
    setError('')
    const pinError = validatePin(currentPin)
    if (pinError) {
      setError(pinError)
      return
    }
    setBusy(true)
    try {
      const profile = await fetchProfile()
      if (!profile?.pin_salt) {
        setError('PIN is not set.')
        return
      }
      const result = await verifyPin(currentPin, profile.pin_salt)
      if (!result.ok) {
        setError('Current PIN is incorrect or temporarily locked.')
        return
      }
      await disablePin()
      setCurrentPin('')
      await refreshProfile()
      setInfo('PIN lock turned off.')
    } catch {
      setError('Could not disable PIN.')
    } finally {
      setBusy(false)
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault()
    setError('')
    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setError(passwordError)
      return
    }
    setBusy(true)
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    setBusy(false)
    if (updateError) {
      setError('Could not update password.')
      return
    }
    setNewPassword('')
    setInfo('Password updated.')
  }

  async function onSignOut() {
    await signOut()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted">{user?.email}</p>
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {info ? <Alert tone="ok">{info}</Alert> : null}

      <Card>
        <h2 className="font-semibold">Profile</h2>
        <form className="mt-4 space-y-4" onSubmit={saveName}>
          <Field label="Display name">
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} />
          </Field>
          <Button type="submit" disabled={busy}>
            Save name
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="font-semibold">Appearance</h2>
        <p className="mt-1 text-sm text-muted">Switch between light and OLED dark themes. The choice is saved on this device.</p>
        <ThemeToggle className="mt-4" />
      </Card>

      <Card>
        <h2 className="font-semibold">PIN lock</h2>
        <p className="mt-1 text-sm text-muted">
          Optional extra step on this device. The PIN is stored as a salted SHA-256 hash. It is not a
          replacement for signing out on a shared phone. Failed attempts are rate-limited (5 tries, then a
          5-minute lockout).
        </p>
        <p className="mt-2 text-sm text-muted">
          Auto-lock after {Math.round(AUTO_LOCK_MS / 60000)} minutes idle when PIN is on. If PIN is off, the
          session signs out after {Math.round(SESSION_IDLE_SIGNOUT_MS / 60000)} minutes idle.
        </p>

        {pinEnabled ? (
          <form className="mt-4 space-y-4" onSubmit={removePin}>
            <Field label="Current PIN">
              <Input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={lockNow}>
                Lock now
              </Button>
              <Button type="submit" variant="danger" disabled={busy}>
                Turn off PIN
              </Button>
            </div>
          </form>
        ) : (
          <form className="mt-4 space-y-4" onSubmit={savePin}>
            <Field label="New PIN (4–6 digits)">
              <Input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </Field>
            <Field label="Confirm PIN">
              <Input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </Field>
            <Button type="submit" disabled={busy}>
              Enable PIN
            </Button>
          </form>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold">Password</h2>
        <form className="mt-4 space-y-4" onSubmit={changePassword}>
          <Field label="New password">
            <Input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Field>
          <Button type="submit" disabled={busy}>
            Update password
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="font-semibold">Session</h2>
        <p className="mt-1 text-sm text-muted">Sign out invalidates this refresh session on the server.</p>
        <Button className="mt-4" variant="secondary" onClick={() => void onSignOut()}>
          Sign out
        </Button>
      </Card>

      <footer className="pt-4">
        <CreatorCredit />
      </footer>
    </div>
  )
}
