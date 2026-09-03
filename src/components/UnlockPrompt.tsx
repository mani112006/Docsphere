import { useState, type FormEvent } from 'react'
import { Alert, Button, Card, Field, Input } from './ui'

export function UnlockPrompt({
  title,
  onUnlock,
  onCancel,
}: {
  title: string
  onUnlock: (pin: string) => Promise<boolean>
  onCancel: () => void
}) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const ok = await onUnlock(pin)
      if (!ok) setError('Incorrect PIN.')
    } catch {
      setError('Could not verify PIN.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/70 p-4">
      <Card className="w-full max-w-sm">
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted">This folder or category is PIN protected on your account.</p>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <form className="mt-4 space-y-3" onSubmit={(e) => void submit(e)}>
          <Field label="PIN">
            <Input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy || pin.length < 4}>
              Unlock
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
