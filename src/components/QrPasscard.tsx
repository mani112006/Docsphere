import { useState } from 'react'
import { buildPasscardPayload, passcardPlainText, qrDataUrl } from '../lib/qr'
import { folderLabel } from '../lib/folders'
import { categoryLabel } from '../lib/categories'
import { expiryCountdown, expiryStatus } from '../lib/dates'
import { maskDocumentNumber } from '../lib/ocr'
import type { DocumentRecord } from '../types'
import { Alert, Badge, Button, Card, Field, Input } from './ui'

export function QrPasscard({ doc, onClose }: { doc: DocumentRecord; onClose: () => void }) {
  const [secret, setSecret] = useState('')
  const [qr, setQr] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const status = expiryStatus(doc.expiry_date)
  const tone = status === 'expired' ? 'danger' : status === 'soon' ? 'warn' : status === 'valid' ? 'ok' : 'neutral'

  async function generate() {
    if (secret.length < 4) {
      setError('Enter a 4–6 digit unlock code for the encrypted QR.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const payload = await buildPasscardPayload(doc, secret)
      setQr(await qrDataUrl(payload))
    } catch {
      setError('Could not generate the QR passcard.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/70 p-4">
      <Card className="w-full max-w-md">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold">Emergency QR passcard</h2>
            <p className="mt-1 text-sm text-muted">Offline summary on this screen. The QR stores an encrypted copy.</p>
          </div>
          <Badge tone={tone}>{status === 'expired' ? 'Expired' : status === 'soon' ? 'Expiring soon' : status === 'valid' ? 'Valid' : 'No expiry'}</Badge>
        </div>
        <div className="mt-4 rounded-xl bg-paper p-3 text-sm">
          <p className="font-semibold">{doc.holder_name || doc.name}</p>
          <p className="text-muted">{categoryLabel(doc.category)} · {folderLabel(String(doc.family_folder))}</p>
          <p className="mt-1">{maskDocumentNumber(doc.document_number_last4)}</p>
          <p className="mt-1 font-medium">{expiryCountdown(doc.expiry_date)}</p>
          <p className="mt-2 text-xs text-muted">{passcardPlainText(doc)}</p>
        </div>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {!qr ? (
          <div className="mt-4 space-y-3">
            <Field label="QR unlock code">
              <Input
                inputMode="numeric"
                value={secret}
                onChange={(e) => setSecret(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </Field>
            <Button type="button" disabled={busy} onClick={() => void generate()}>
              {busy ? 'Encrypting…' : 'Generate encrypted QR'}
            </Button>
          </div>
        ) : (
          <img src={qr} alt="Encrypted document QR" className="mx-auto mt-4 h-56 w-56 rounded-xl bg-white p-2" />
        )}
        <Button className="mt-3" variant="secondary" type="button" onClick={onClose}>
          Close
        </Button>
      </Card>
    </div>
  )
}
