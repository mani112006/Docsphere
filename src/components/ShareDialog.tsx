import { useState } from 'react'
import { createDocumentShare, type ShareTtl } from '../lib/shares'
import type { DocumentRecord } from '../types'
import { Alert, Button, Card, Field, Input, Select } from './ui'

export function ShareDialog({
  doc,
  onClose,
}: {
  doc: DocumentRecord
  onClose: () => void
}) {
  const [ttl, setTtl] = useState<ShareTtl>(600)
  const [pin, setPin] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function create() {
    setError('')
    if (pin && (pin.length < 4 || pin.length > 6)) {
      setError('Share PIN must be 4–6 digits, or leave it blank.')
      return
    }
    setBusy(true)
    try {
      const created = await createDocumentShare({ doc, ttl, pin: pin || undefined })
      setUrl(created.url)
    } catch {
      setError('Could not create a share link. Run the latest Supabase schema if this is a new feature.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/70 p-4">
      <Card className="w-full max-w-md">
        <h2 className="font-semibold">Temporary share link</h2>
        <p className="mt-1 text-sm text-muted">
          The link self-destructs after the timer. File access uses a matching signed URL. Do not post it publicly.
        </p>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {url ? (
          <div className="mt-4 space-y-3">
            <Field label="Share URL">
              <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
            </Field>
            <Button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(url)
              }}
            >
              Copy link
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <Field label="Expires in">
              <Select value={String(ttl)} onChange={(e) => setTtl(Number(e.target.value) as ShareTtl)}>
                <option value="600">10 minutes</option>
                <option value="3600">1 hour</option>
              </Select>
            </Field>
            <Field label="Optional PIN">
              <Input
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="4–6 digits"
              />
            </Field>
            <Button type="button" disabled={busy} onClick={() => void create()}>
              {busy ? 'Creating…' : 'Create link'}
            </Button>
          </div>
        )}
        <Button className="mt-3" variant="secondary" type="button" onClick={onClose}>
          Close
        </Button>
      </Card>
    </div>
  )
}
