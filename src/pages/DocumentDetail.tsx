import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DocumentViewer } from '../components/DocumentViewer'
import { QrPasscard } from '../components/QrPasscard'
import { ShareDialog } from '../components/ShareDialog'
import { UnlockPrompt } from '../components/UnlockPrompt'
import { Alert, Badge, Button, Card, Field, Input, Select, Textarea } from '../components/ui'
import { useVaultLock } from '../context/VaultLockContext'
import { categoryLabel, CATEGORIES } from '../lib/categories'
import { expiryCountdown, expiryStatus, formatDisplayDate } from '../lib/dates'
import { deleteDocument, fetchDocumentBlob, getDocument, updateDocumentMeta } from '../lib/documents'
import { FAMILY_FOLDERS, folderLabel } from '../lib/folders'
import { last4, maskDocumentNumber } from '../lib/ocr'
import { renewalPortal } from '../lib/renewal'
import { formatFileSize, validateCategory, validateDescription, validateDocumentName, validateFamilyFolder } from '../lib/validation'
import type { DocumentRecord } from '../types'

export function DocumentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isLocked, unlock } = useVaultLock()
  const [doc, setDoc] = useState<DocumentRecord | null>(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewer, setViewer] = useState(false)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [share, setShare] = useState(false)
  const [passcard, setPasscard] = useState(false)
  const [blocked, setBlocked] = useState<{ kind: 'folder' | 'category'; key: string } | null>(null)
  const [numberInput, setNumberInput] = useState('')

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [holderName, setHolderName] = useState('')
  const [familyFolder, setFamilyFolder] = useState('my_vault')
  const [pinLocked, setPinLocked] = useState(false)

  useEffect(() => {
    if (!id) return
    getDocument(id)
      .then((row) => {
        setDoc(row)
        if (row) {
          setName(row.name)
          setCategory(row.category)
          setDescription(row.description ?? '')
          setIssueDate(row.issue_date ?? '')
          setExpiryDate(row.expiry_date ?? '')
          setHolderName(row.holder_name ?? '')
          setFamilyFolder(String(row.family_folder || 'my_vault'))
          setPinLocked(row.pin_locked)
          if (isLocked('folder', String(row.family_folder))) {
            setBlocked({ kind: 'folder', key: String(row.family_folder) })
          } else if (isLocked('category', row.category) || (row.pin_locked && isLocked('category', 'bank'))) {
            setBlocked({ kind: 'category', key: isLocked('category', row.category) ? row.category : 'bank' })
          }
        }
      })
      .catch(() => setError('Could not load this document.'))
      .finally(() => setLoading(false))
  }, [id, isLocked])

  async function onDownload() {
    if (!doc) return
    setError('')
    try {
      const blob = await fetchDocumentBlob(doc.storage_path)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = doc.original_filename || doc.name
      anchor.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Download failed.')
    }
  }

  async function onSave(event: FormEvent) {
    event.preventDefault()
    if (!doc) return
    const nameError = validateDocumentName(name)
    const categoryError = validateCategory(category)
    const folderError = validateFamilyFolder(familyFolder)
    const descriptionError = validateDescription(description)
    if (nameError || categoryError || folderError || descriptionError) {
      setError(nameError ?? categoryError ?? folderError ?? descriptionError ?? '')
      return
    }
    if (issueDate && expiryDate && expiryDate < issueDate) {
      setError('Expiry date cannot be before the issue date.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await updateDocumentMeta(doc.id, {
        name: name.trim(),
        category,
        description: description.trim() || null,
        issue_date: issueDate || null,
        expiry_date: expiryDate || null,
        holder_name: holderName.trim() || null,
        document_number_last4: numberInput ? last4(numberInput) : doc.document_number_last4,
        family_folder: familyFolder,
        pin_locked: pinLocked,
      })
      const next = await getDocument(doc.id)
      setDoc(next)
      setEditing(false)
      setNumberInput('')
      setInfo('Details updated.')
    } catch {
      setError('Could not save changes.')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete() {
    if (!doc) return
    if (!window.confirm('Delete this document permanently? This cannot be undone.')) return
    setBusy(true)
    try {
      await deleteDocument(doc)
      navigate('/app/documents')
    } catch {
      setError('Could not delete this document.')
      setBusy(false)
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading…</p>
  if (!doc) return <Alert tone="danger">Document not found.</Alert>

  if (blocked) {
    return (
      <UnlockPrompt
        title={`Unlock ${blocked.kind === 'folder' ? folderLabel(blocked.key) : categoryLabel(blocked.key)}`}
        onUnlock={async (pin) => {
          const ok = await unlock(blocked.kind, blocked.key, pin)
          if (ok) setBlocked(null)
          return ok
        }}
        onCancel={() => navigate('/app/documents')}
      />
    )
  }

  const status = expiryStatus(doc.expiry_date)
  const tone = status === 'expired' ? 'danger' : status === 'soon' ? 'warn' : status === 'valid' ? 'ok' : 'neutral'
  const statusLabel =
    status === 'expired' ? 'Expired' : status === 'soon' ? 'Expiring soon' : status === 'valid' ? 'Valid' : 'No expiry'
  const portal = (status === 'expired' || status === 'soon') ? renewalPortal(doc.category) : null

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">
            {categoryLabel(doc.category)} · {folderLabel(String(doc.family_folder))}
          </p>
          <h1 className="text-2xl font-bold">{doc.name}</h1>
        </div>
        <Badge tone={tone}>{statusLabel}</Badge>
      </div>

      {status === 'expired' ? (
        <Alert tone="danger">{expiryCountdown(doc.expiry_date)}</Alert>
      ) : status === 'soon' ? (
        <Alert tone="warn">{expiryCountdown(doc.expiry_date)}</Alert>
      ) : null}

      {portal ? (
        <a className="inline-flex text-sm font-semibold text-brand" href={portal.url} target="_blank" rel="noreferrer noopener">
          Renew on {portal.label}
        </a>
      ) : null}

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {info ? <Alert tone="ok">{info}</Alert> : null}

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setViewer(true)}>View</Button>
        <Button variant="secondary" onClick={() => void onDownload()}>
          Download
        </Button>
        <Button variant="secondary" onClick={() => setShare(true)}>
          Share link
        </Button>
        <Button variant="secondary" onClick={() => setPasscard(true)}>
          QR passcard
        </Button>
        <Button variant="secondary" onClick={() => setEditing((value) => !value)}>
          {editing ? 'Cancel edit' : 'Edit details'}
        </Button>
        <Button variant="danger" onClick={() => void onDelete()} disabled={busy}>
          Delete
        </Button>
      </div>

      <Card>
        {editing ? (
          <form className="space-y-4" onSubmit={onSave}>
            <Field label="Document name">
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
            </Field>
            <Field label="Holder name">
              <Input value={holderName} onChange={(e) => setHolderName(e.target.value)} maxLength={120} />
            </Field>
            <Field label="Update document number" hint="Leave blank to keep the stored last 4.">
              <Input value={numberInput} onChange={(e) => setNumberInput(e.target.value)} />
            </Field>
            <Field label="Category">
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Family folder">
              <Select value={familyFolder} onChange={(e) => setFamilyFolder(e.target.value)}>
                {FAMILY_FOLDERS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Description">
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Issue date">
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </Field>
              <Field label="Expiry date">
                <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
              </Field>
            </div>
            <Field label="PIN lock">
              <Select value={pinLocked ? 'yes' : 'no'} onChange={(e) => setPinLocked(e.target.value === 'yes')}>
                <option value="no">Off</option>
                <option value="yes">On</option>
              </Select>
            </Field>
            <Button type="submit" disabled={busy}>
              Save
            </Button>
          </form>
        ) : (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Item label="Holder" value={doc.holder_name || '—'} />
            <Item label="Document number" value={maskDocumentNumber(doc.document_number_last4)} />
            <Item label="Issue date" value={formatDisplayDate(doc.issue_date)} />
            <Item label="Expiry date" value={formatDisplayDate(doc.expiry_date)} />
            <Item label="Validity" value={doc.expiry_date ? expiryCountdown(doc.expiry_date) : '—'} />
            <Item label="Type" value={doc.mime_type} />
            <Item label="Size" value={formatFileSize(doc.file_size)} />
            <Item label="Original file" value={doc.original_filename} />
            <Item label="Uploaded" value={new Date(doc.created_at).toLocaleString()} />
            <Item label="Description" value={doc.description || '—'} />
          </dl>
        )}
      </Card>

      {viewer ? <DocumentViewer doc={doc} onClose={() => setViewer(false)} /> : null}
      {share ? <ShareDialog doc={doc} onClose={() => setShare(false)} /> : null}
      {passcard ? <QrPasscard doc={doc} onClose={() => setPasscard(false)} /> : null}
    </div>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  )
}
