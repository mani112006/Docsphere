import { CATEGORIES } from '../lib/categories'
import { FAMILY_FOLDERS } from '../lib/folders'
import { expiryCountdown, expiryStatus } from '../lib/dates'
import { formatFileSize } from '../lib/validation'
import { maskDocumentNumber } from '../lib/ocr'
import type { ExtractedDetails } from '../types'
import { Badge, Button, Card, Field, Input, Select, Textarea } from './ui'

export function ExtractedReviewCard({
  details,
  onChange,
  file,
  ocrBusy,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm and save',
}: {
  details: ExtractedDetails
  onChange: (next: ExtractedDetails) => void
  file: File | null
  ocrBusy?: boolean
  onConfirm: () => void
  onCancel?: () => void
  confirmLabel?: string
}) {
  const status = expiryStatus(details.expiryDate || null)
  const tone = status === 'expired' ? 'danger' : status === 'soon' ? 'warn' : status === 'valid' ? 'ok' : 'neutral'
  const statusLabel =
    status === 'expired' ? 'Expired' : status === 'soon' ? 'Expiring soon' : status === 'valid' ? 'Valid' : 'No expiry'

  function patch(partial: Partial<ExtractedDetails>) {
    onChange({ ...details, ...partial })
  }

  return (
    <Card className={status === 'expired' ? 'border-danger/50 ring-1 ring-danger/30' : undefined}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">Extracted details review</h2>
          <p className="mt-1 text-sm text-muted">
            {ocrBusy ? 'Reading the document with on-device OCR…' : 'Check every field before it is saved to your private vault.'}
          </p>
        </div>
        <Badge tone={tone}>{statusLabel}</Badge>
      </div>

      {file ? (
        <dl className="mt-4 grid gap-2 rounded-xl bg-paper px-3 py-2 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-muted">File name</dt>
            <dd className="font-medium">{file.name}</dd>
          </div>
          <div>
            <dt className="text-muted">Size</dt>
            <dd className="font-medium">{formatFileSize(file.size)}</dd>
          </div>
          <div>
            <dt className="text-muted">Type</dt>
            <dd className="font-medium">{file.type || '—'}</dd>
          </div>
          <div>
            <dt className="text-muted">Upload date</dt>
            <dd className="font-medium">{new Date().toLocaleString()}</dd>
          </div>
        </dl>
      ) : null}

      {details.expiryDate ? (
        <p className={`mt-3 text-sm font-medium ${status === 'expired' ? 'text-danger' : status === 'soon' ? 'text-warn' : 'text-ink'}`}>
          {expiryCountdown(details.expiryDate)}
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Document name">
          <Input value={details.name} onChange={(e) => patch({ name: e.target.value })} maxLength={120} />
        </Field>
        <Field label="Category">
          <Select value={details.category} onChange={(e) => patch({ category: e.target.value })}>
            {CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Document holder name">
          <Input value={details.holderName} onChange={(e) => patch({ holderName: e.target.value })} maxLength={120} />
        </Field>
        <Field label="Document number" hint="Only the last 4 characters are stored.">
          <Input
            value={details.documentNumber}
            onChange={(e) => patch({ documentNumber: e.target.value })}
            placeholder="Will be saved as •••• last 4"
          />
        </Field>
        <Field label="Issue date">
          <Input type="date" value={details.issueDate} onChange={(e) => patch({ issueDate: e.target.value })} />
        </Field>
        <Field label="Expiry date">
          <Input type="date" value={details.expiryDate} onChange={(e) => patch({ expiryDate: e.target.value })} />
        </Field>
        <Field label="Family folder">
          <Select value={details.familyFolder} onChange={(e) => patch({ familyFolder: e.target.value })}>
            {FAMILY_FOLDERS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Extra PIN lock">
          <Select
            value={details.pinLocked ? 'yes' : 'no'}
            onChange={(e) => patch({ pinLocked: e.target.value === 'yes' })}
          >
            <option value="no">Not required</option>
            <option value="yes">Require folder/category PIN</option>
          </Select>
        </Field>
      </div>
      <Field label="Notes (optional)">
        <Textarea className="mt-4" value={details.description} onChange={(e) => patch({ description: e.target.value })} maxLength={500} />
      </Field>
      {details.documentNumber ? (
        <p className="mt-2 text-xs text-muted">Stored number preview: {maskDocumentNumber(details.documentNumber)}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={onConfirm} disabled={ocrBusy}>
          {confirmLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </Card>
  )
}
